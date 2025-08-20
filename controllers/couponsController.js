// controllers/couponsController.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const {
  fetchUserCouponsQuery,
  purchaseCouponQuery,
  // fetchAvailableCouponsQuery,  // (intentionally not used; we do a fixed query inline)
  fetchRestaurantsWithPurchasedCoupons,
  getUserCouponsTotal,
  fetchAvailableCouponsQueryTotal,
  createCouponQuery,
  verifyRestaurantOwnership,
  // updateCouponQuery,           // we build dynamic UPDATE with whitelist
  getCouponWithRestaurant,
  deleteCouponQuery,
} = require("../queries/couponsQueries");

const { getConfirmedUserStatus } = require("../queries/userQueries");

const {
  createCouponSchema,
  patchCouponSchema,
} = require("../validators/couponValidator");

/* ------------------------------- helpers ------------------------------- */

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

// Whitelist for PATCH
const ALLOWED_COUPON_FIELDS = new Set([
  "description",
  "discount_percentage",
  "required_points",
]);

/* --------------------------- controller methods --------------------------- */

const getUserCoupons = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const offset = (page - 1) * pageSize;

    const result = await pool.query(fetchUserCouponsQuery, [
      decoded.id,
      pageSize,
      offset,
    ]);
    const userCoupons = result.rows;

    const countResult = await pool.query(getUserCouponsTotal, [decoded.id]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const viewedRecords = offset + userCoupons.length;
    const remainingRecords = totalCount - viewedRecords;

    return res.status(200).json({
      userCoupons, // always array
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: userCoupons.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    return res.status(500).json({ message: "Failed to fetch user coupons." });
  }
};

const purchaseCoupon = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { coupon_id } = req.body;
  if (!coupon_id) {
    return res.status(400).json({ error: "coupon_id is required." });
  }

  // Ensure user is confirmed
  try {
    const {
      rows: [{ confirmed_user: isUserConfirmed }],
    } = await pool.query(getConfirmedUserStatus, [decoded.id]);

    if (!isUserConfirmed) {
      return res
        .status(401)
        .json({ message: "User is not confirmed. Please verify your email." });
    }
  } catch (e) {
    return res.status(500).json({ message: "Failed to verify user." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Duplicate purchase check
    const dupCheck = await client.query(
      "SELECT 1 FROM purchased_coupons WHERE user_id = $1 AND coupon_id = $2",
      [decoded.id, coupon_id]
    );
    if (dupCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ message: "Έχετε ήδη αγοράσει αυτό το κουπόνι." });
    }

    // Points check
    const { rows: couponRows } = await client.query(
      "SELECT required_points FROM coupons WHERE id = $1",
      [coupon_id]
    );
    if (couponRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Coupon not found." });
    }
    const requiredPoints = couponRows[0].required_points;

    const { rows: userRows } = await client.query(
      "SELECT loyalty_points FROM users WHERE id = $1 FOR UPDATE",
      [decoded.id]
    );
    if (userRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found." });
    }
    const userPoints = userRows[0].loyalty_points;

    if (userPoints < requiredPoints) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Δεν έχετε αρκετούς πόντους." });
    }

    // Deduct points
    await client.query(
      "UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2",
      [requiredPoints, decoded.id]
    );

    // Insert purchase (defaults: is_locked=false, is_used=false)
    const { rows } = await client.query(purchaseCouponQuery, [
      decoded.id,
      coupon_id,
    ]);

    await client.query("COMMIT");
    return res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Purchase coupon error:", err);
    return res.status(500).json({ message: "Αποτυχία αγοράς κουπονιού." });
  } finally {
    client.release();
  }
};

const getAvailableCoupons = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const { restaurant_id } = req.query;

  if (!restaurant_id) {
    return res.status(400).json({ error: "restaurant_id is required." });
  }

  try {
    // TOTAL (already correct in queries file)
    const countResult = await pool.query(fetchAvailableCouponsQueryTotal, [
      restaurant_id,
      decoded.id,
    ]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // DATA: correct pagination on OUTER query
    const { rows: availableCoupons } = await pool.query(
      `
      SELECT c.*
      FROM coupons c
      WHERE c.restaurant_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM purchased_coupons pc
          WHERE pc.coupon_id = c.id
            AND pc.user_id = $2
        )
      ORDER BY c.id DESC
      LIMIT $3 OFFSET $4
      `,
      [restaurant_id, decoded.id, pageSize, offset]
    );

    const viewedRecords = offset + availableCoupons.length;
    const remainingRecords = totalCount - viewedRecords;

    return res.status(200).json({
      availableCoupons,
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: availableCoupons.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    console.error("Error fetching available coupons:", err);
    return res.status(500).json({ message: "Failed to load available coupons." });
  }
};

const getRestaurantsWithPurchasedCoupons = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  try {
    const result = await pool.query(fetchRestaurantsWithPurchasedCoupons, [
      decoded.id,
    ]);
    const restaurantsWithPurchasedCoupons = result.rows;
    return res.status(200).json({ restaurantsWithPurchasedCoupons });
  } catch (error) {
    console.error("Error fetching restaurants with coupons:", error);
    return res.status(500).json({ message: "Failed to fetch restaurants." });
  }
};

const createCoupon = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { error, value } = createCouponSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { description, discount_percentage, required_points, restaurant_id } =
    value;

  try {
    const ownershipResult = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);

    if (ownershipResult.rowCount === 0) {
      return res.status(403).json({
        message: "Forbidden - You do not own this restaurant.",
      });
    }

    const { rows } = await pool.query(createCouponQuery, [
      description,
      discount_percentage,
      required_points,
      restaurant_id,
    ]);

    return res
      .status(201)
      .json({ message: "Coupon created successfully", coupon: rows[0] });
  } catch (err) {
    console.error("Error creating coupon:", err);
    return res.status(500).json({ message: "Failed to create coupon." });
  }
};

const editCoupon = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { error, value } = patchCouponSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { couponId, ...fieldsToUpdate } = value;

  // Whitelist + build dynamic update safely
  const keys = Object.keys(fieldsToUpdate).filter((k) =>
    ALLOWED_COUPON_FIELDS.has(k)
  );
  if (keys.length === 0) {
    return res.status(400).json({ message: "No valid fields to update." });
  }

  try {
    // Ownership check
    const ownershipCheck = await pool.query(getCouponWithRestaurant, [
      couponId,
    ]);
    if (
      ownershipCheck.rowCount === 0 ||
      ownershipCheck.rows[0].owner_id !== decoded.id
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this coupon." });
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = keys.map((k) => fieldsToUpdate[k]);

    const updateQuery = `
      UPDATE coupons
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [...values, couponId]);

    return res
      .status(200)
      .json({ message: "Coupon updated successfully", coupon: rows[0] });
  } catch (err) {
    console.error("Error updating coupon:", err);
    return res.status(500).json({ message: "Failed to update coupon." });
  }
};

const deleteCoupon = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { couponId } = req.body;
  if (!couponId) {
    return res.status(400).json({ message: "couponId is required." });
  }

  try {
    // Ownership check
    const ownershipCheck = await pool.query(getCouponWithRestaurant, [
      couponId,
    ]);
    if (
      ownershipCheck.rowCount === 0 ||
      ownershipCheck.rows[0].owner_id !== decoded.id
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this coupon." });
    }

    // Block deletion if any unused or locked purchase exists
    const { rows: usage } = await pool.query(
      `
      SELECT 1
      FROM purchased_coupons
      WHERE coupon_id = $1
        AND (is_used = false OR is_locked = true)
      LIMIT 1
      `,
      [couponId]
    );
    if (usage.length > 0) {
      return res.status(409).json({
        message:
          "Δεν μπορείτε να διαγράψετε το κουπόνι: υπάρχουν μη χρησιμοποιημένες ή κλειδωμένες αγορές.",
      });
    }

    const { rows } = await pool.query(deleteCouponQuery, [couponId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    return res
      .status(200)
      .json({ message: "Coupon deleted successfully", coupon: rows[0] });
  } catch (err) {
    console.error("Error deleting coupon:", err);
    return res.status(500).json({ message: "Failed to delete coupon." });
  }
};

module.exports = {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
  getRestaurantsWithPurchasedCoupons,
  createCoupon,
  editCoupon,
  deleteCoupon,
};
