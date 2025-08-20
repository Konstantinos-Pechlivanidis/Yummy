// controllers/restaurantController.js
require("dotenv").config();
const jwt = require("jsonwebtoken");

const {
  fetchRestaurantById,
  fetchMenuItemsByRestaurant,
  fetchSpecialMenusByRestaurant,
  fetchCouponsByRestaurant,
  fetchTrendingRestaurants,
  getRestaurantsTotal,
  fetchDiscountedRestaurants,
  totalDiscountedRestaurants,
  fetchFilteredRestaurantsBase,
  countFilteredRestaurantsBase,
  verifyRestaurantOwnership,
  fetchRestaurantsByOwner,
  updateRestaurantContactQuery,
} = require("../queries/restaurantQueries");

const {
  fetchOwnerFilteredReservations, // expects 5 params: ownerId, statusPatternOrNull, dateOrNull, limit, offset
} = require("../queries/reservationsQueries");

const { updateRestaurantSchema } = require("../validators/restaurantValidator");

const JWT_SECRET = process.env.JWT_SECRET;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const verifyToken = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized - No token found" });
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    res.status(401).json({ message: "Unauthorized - Invalid token" });
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* Public listings                                                    */
/* ------------------------------------------------------------------ */

const getTrendingRestaurants = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  try {
    const trendingRestaurants = await pool.query(fetchTrendingRestaurants, [
      limit,
      offset,
    ]);
    const rows = trendingRestaurants.rows;

    if (rows.length === 0) {
      return res.status(200).json({
        allTrendingRestaurants: [],
        Pagination: {
          currentPage: page,
          recordsOnCurrentPage: 0,
          viewedRecords: 0,
          remainingRecords: 0,
          total: 0,
        },
      });
    }

    const countResult = await pool.query(getRestaurantsTotal);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const viewedRecords = (page - 1) * pageSize + rows.length;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      allTrendingRestaurants: rows,
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: rows.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching trending restaurants:", err);
    res.status(500).json({ message: "Failed to load trending restaurants." });
  }
};

const getDiscountedRestaurants = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  try {
    const discountedRestaurants = await pool.query(
      fetchDiscountedRestaurants,
      [limit, offset]
    );
    const rows = discountedRestaurants.rows;

    const countResult = await pool.query(totalDiscountedRestaurants);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const viewedRecords = (page - 1) * pageSize + rows.length;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      allDiscountedRestaurants: rows,
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: rows.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching discounted restaurants:", err);
    res.status(500).json({ message: "Failed to load discounted restaurants." });
  }
};

const getFilteredRestaurants = async (req, res, pool) => {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const filters = [];
  const values = [];
  let idx = 1;

  if (req.query.cuisine) {
    filters.push(`cuisine ILIKE $${idx}`);
    values.push(`%${req.query.cuisine}%`);
    idx++;
  }
  if (req.query.rating) {
    const rating = parseFloat(req.query.rating);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      filters.push(`rating >= $${idx}`);
      values.push(rating);
      idx++;
    }
  }
  if (req.query.location) {
    filters.push(`location ILIKE $${idx}`);
    values.push(`%${req.query.location}%`);
    idx++;
  }
  if (req.query.name) {
    filters.push(`name ILIKE $${idx}`);
    values.push(`%${req.query.name}%`);
    idx++;
  }

  const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";

  try {
    const dataQuery = `
      ${fetchFilteredRestaurantsBase}
      ${whereClause}
      ORDER BY name
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    values.push(limit, offset);

    const { rows } = await pool.query(dataQuery, values);

    const countQuery = `
      ${countFilteredRestaurantsBase}
      ${whereClause}
    `;
    const countValues = values.slice(0, idx - 1);
    const { rows: countRows } = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countRows[0].count, 10);

    const viewedRecords = (page - 1) * pageSize + rows.length;
    const remainingRecords = totalCount - viewedRecords;

    res.json({
      restaurants: rows,
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: rows.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching filtered restaurants:", err);
    res.status(500).json({ message: "Failed to load restaurants." });
  }
};

const getRestaurantById = async (req, res, pool) => {
  const { id } = req.params;
  try {
    const restRes = await pool.query(fetchRestaurantById, [id]);
    if (restRes.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    const [menuRes, specialRes, couponRes] = await Promise.all([
      pool.query(fetchMenuItemsByRestaurant, [id]),
      pool.query(fetchSpecialMenusByRestaurant, [id]),
      pool.query(fetchCouponsByRestaurant, [id]),
    ]);

    res.json({
      restaurant: restRes.rows[0],
      menu_items: menuRes.rows || [],
      special_menus: specialRes.rows || [],
      coupons: couponRes.rows || [],
    });
  } catch (err) {
    console.error("Error fetching restaurant details:", err);
    res.status(500).json({ message: "Failed to load restaurant details." });
  }
};

/* ------------------------------------------------------------------ */
/* Owner endpoints                                                    */
/* ------------------------------------------------------------------ */

const getOwnerRestaurant = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  try {
    const { rows: restaurantRows } = await pool.query(fetchRestaurantsByOwner, [
      decoded.id,
    ]);

    if (restaurantRows.length === 0) {
      return res
        .status(200)
        .json({ restaurant: null, message: "No restaurants for this owner." });
    }

    const restaurant = restaurantRows[0];

    // IMPORTANT: Pass all 5 params expected by fetchOwnerFilteredReservations
    // ownerId, statusPatternOrNull, dateOrNull, limit, offset
    const [menuRes, specialMenuRes, couponRes, reservationRes] =
      await Promise.all([
        pool.query(fetchMenuItemsByRestaurant, [restaurant.id]),
        pool.query(fetchSpecialMenusByRestaurant, [restaurant.id]),
        pool.query(fetchCouponsByRestaurant, [restaurant.id]),
        pool.query(fetchOwnerFilteredReservations, [
          decoded.id,
          null, // status filter
          null, // date filter
          50, // limit
          0, // offset
        ]),
      ]);

    const responseData = {
      ...restaurant,
      menu_items: menuRes.rows || [],
      special_menus: specialMenuRes.rows || [],
      coupons: couponRes.rows || [],
      reservations: reservationRes.rows || [],
    };

    res.json({ restaurant: responseData });
  } catch (err) {
    console.error("Error fetching owner's restaurant and related data:", err);
    res.status(500).json({ message: "Failed to load restaurant data." });
  }
};

const getOwnerOverview = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  try {
    // All restaurants for this owner
    const { rows: restaurants } = await pool.query(fetchRestaurantsByOwner, [
      decoded.id,
    ]);

    if (restaurants.length === 0) {
      return res.status(200).json({ restaurants: [] });
    }

    const ids = restaurants.map((r) => r.id);

    // Aggregate counts in parallel
    const [
      reservationsCountRes,
      couponsCountRes,
      specialMenusCountRes,
    ] = await Promise.all([
      pool.query(
        `SELECT restaurant_id, COUNT(*)::int AS cnt
         FROM reservations
         WHERE restaurant_id = ANY($1)
         GROUP BY restaurant_id`,
        [ids]
      ),
      pool.query(
        `SELECT restaurant_id, COUNT(*)::int AS cnt
         FROM coupons
         WHERE restaurant_id = ANY($1)
         GROUP BY restaurant_id`,
        [ids]
      ),
      pool.query(
        `SELECT restaurant_id, COUNT(*)::int AS cnt
         FROM special_menus
         WHERE restaurant_id = ANY($1)
         GROUP BY restaurant_id`,
        [ids]
      ),
    ]);

    const byId = (rows) =>
      rows.reduce((acc, r) => {
        acc[r.restaurant_id] = r.cnt;
        return acc;
      }, {});

    const resCounts = byId(reservationsCountRes.rows);
    const couponCounts = byId(couponsCountRes.rows);
    const smCounts = byId(specialMenusCountRes.rows);

    const overview = restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      rating: r.rating,
      address: r.address,
      contact: r.contact,
      opening_hours: r.opening_hours,
      totals: {
        reservations: resCounts[r.id] || 0,
        coupons: couponCounts[r.id] || 0,
        special_menus: smCounts[r.id] || 0,
      },
    }));

    res.json({ restaurants: overview });
  } catch (err) {
    console.error("Error building owner overview:", err);
    res.status(500).json({ message: "Failed to load overview." });
  }
};

const updateRestaurant = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;
  const { error, value } = updateRestaurantSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  try {
    // owner is allowed to update only their own restaurant
    const ownership = await pool.query(verifyRestaurantOwnership, [
      id,
      decoded.id,
    ]);
    if (ownership.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant." });
    }

    // Hard whitelist: only 'contact' JSONB is accepted
    const contact = value?.contact;
    if (contact === undefined) {
      return res
        .status(400)
        .json({ message: "Only 'contact' is allowed to be updated." });
    }
    if (
      contact === null ||
      typeof contact !== "object" ||
      Array.isArray(contact)
    ) {
      return res.status(400).json({ message: "'contact' must be a JSON object." });
    }

    const { rows } = await pool.query(updateRestaurantContactQuery, [
      contact,
      id,
    ]);

    return res
      .status(200)
      .json({ message: "Restaurant updated", restaurant: rows[0] });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    res.status(500).json({ message: "Failed to update restaurant." });
  }
};

/* ------------------------------------------------------------------ */

module.exports = {
  getTrendingRestaurants,
  getDiscountedRestaurants,
  getFilteredRestaurants,
  getRestaurantById,
  getOwnerRestaurant,
  getOwnerOverview,
  updateRestaurant,
};
