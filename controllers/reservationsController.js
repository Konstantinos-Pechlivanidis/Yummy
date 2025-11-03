// controllers/reservationsController.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const {
  fetchReservationsByUser,
  fetchReservationById,
  createReservationQuery,
  deleteReservationQuery,
  cancelReservationQuery,
  fetchFilteredUserReservations,
  countFilteredUserReservations,
  patchReservationAsOwnerQuery,
  verifyReservationOwnership,
  fetchOwnerFilteredReservations,
  countOwnerFilteredReservations,
} = require("../queries/reservationsQueries");

const {
  getConfirmedUserStatus,
  updateUserPointsQuery,
  fetchUserPoints,
} = require("../queries/userQueries");

const {
  patchReservationAsOwnerSchema,
  getOwnerFilteredReservationsSchema,
} = require("../validators/reservationsValidator");

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

const isValidTransition = (from, to) => {
  // Allowed paths:
  // pending -> confirmed -> completed
  // pending|confirmed -> cancelled
  if (from === to) return true;
  const map = {
    pending: new Set(["confirmed", "cancelled"]),
    confirmed: new Set(["completed", "cancelled"]),
    completed: new Set([]),
    cancelled: new Set([]),
  };
  return map[from]?.has(to) || false;
};

/**
 * Unlock exactly one purchased coupon instance (if any).
 */
const unlockOnePurchasedCoupon = async (client, { userId, couponId }) => {
  const { rows: pick } = await client.query(
    `
      SELECT id FROM purchased_coupons
      WHERE user_id = $1 AND coupon_id = $2
        AND is_used = false AND is_locked = true
      ORDER BY id
      LIMIT 1
    `,
    [userId, couponId]
  );
  if (pick.length === 0) return false;

  await client.query(
    `UPDATE purchased_coupons SET is_locked = false WHERE id = $1`,
    [pick[0].id]
  );
  return true;
};

/**
 * Lock exactly one available purchased coupon instance (if any).
 * Returns the locked instance id (or null if none).
 */
const lockOnePurchasedCoupon = async (client, { userId, couponId }) => {
  const { rows: pick } = await client.query(
    `
      SELECT id FROM purchased_coupons
      WHERE user_id = $1 AND coupon_id = $2
        AND is_used = false AND is_locked = false
      ORDER BY id
      LIMIT 1
    `,
    [userId, couponId]
  );
  if (pick.length === 0) return null;

  await client.query(
    `UPDATE purchased_coupons SET is_locked = true WHERE id = $1`,
    [pick[0].id]
  );
  return pick[0].id;
};

/**
 * Consume exactly one locked coupon instance (if any): used=true, locked=false
 */
const consumeOneLockedCoupon = async (client, { userId, couponId }) => {
  const { rows: pick } = await client.query(
    `
      SELECT id FROM purchased_coupons
      WHERE user_id = $1 AND coupon_id = $2
        AND is_used = false AND is_locked = true
      ORDER BY id
      LIMIT 1
    `,
    [userId, couponId]
  );
  if (pick.length === 0) return false;

  await client.query(
    `UPDATE purchased_coupons SET is_used = true, is_locked = false WHERE id = $1`,
    [pick[0].id]
  );
  return true;
};

/* --------------------------- controller methods --------------------------- */

const getUserReservations = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  try {
    const { rows } = await pool.query(fetchReservationsByUser, [decoded.id]);
    // Always 200 with an array
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reservations." });
  }
};

const getReservationById = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;

  try {
    const { rows } = await pool.query(fetchReservationById, [id, decoded.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found." });
    }
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reservation." });
  }
};

const createReservation = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  try {
    const {
      rows: [{ confirmed_user: isUserConfirmed }],
    } = await pool.query(getConfirmedUserStatus, [decoded.id]);

    if (!isUserConfirmed) {
      return res.status(401).json({ message: "User is not confirmed." });
    }
  } catch (e) {
    return res.status(500).json({ message: "Failed to verify user." });
  }

  const {
    restaurant_id,
    date,
    time,
    guest_count,
    status = "pending",
    special_menu_id,
    coupon_id,
    reservation_notes,
  } = req.body;

  const cleanNotes =
    typeof reservation_notes === "string" && reservation_notes.trim().length > 0
      ? reservation_notes.trim()
      : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // If a coupon is provided, lock exactly one available instance
    if (coupon_id) {
      const lockedId = await lockOnePurchasedCoupon(client, {
        userId: decoded.id,
        couponId: coupon_id,
      });
      if (!lockedId) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Coupon is not available or has already been used.",
        });
      }
    }

    const { rows } = await client.query(createReservationQuery, [
      decoded.id,
      restaurant_id,
      date,
      time,
      guest_count,
      status,
      special_menu_id,
      coupon_id,
      cleanNotes,
    ]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message:
          "Special menu or coupon does not belong to the selected restaurant.",
      });
    }

    await client.query("COMMIT");
    return res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to create reservation." });
  } finally {
    client.release();
  }
};

const deleteReservation = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;

  try {
    const { rows } = await pool.query(deleteReservationQuery, [id, decoded.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found." });
    }
    return res.json({ status: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete reservation." });
  }
};

const cancelReservation = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res
      .status(400)
      .json({ message: "Ο λόγος ακύρωσης είναι υποχρεωτικός." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Reservation owned by this user
    const { rows: rows0 } = await client.query(
      `SELECT id, user_id, restaurant_id, date, time, status, coupon_id
       FROM reservations WHERE id = $1 AND user_id = $2`,
      [id, decoded.id]
    );
    if (rows0.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Reservation not found or not owned by user." });
    }
    const resv = rows0[0];

    // Compute hours until reservation
    const dateObj = new Date(
      Date.UTC(resv.date.getFullYear(), resv.date.getMonth(), resv.date.getDate())
    );
    const [hh, mm, ss] = String(resv.time).split(":").map(Number);
    const reservationDateTimeUTC = new Date(dateObj);
    reservationDateTimeUTC.setUTCHours(hh || 0, mm || 0, ss || 0, 0);
    const diffInHours = (reservationDateTimeUTC - new Date()) / (1000 * 60 * 60);

    // Update to cancelled
    const { rows } = await client.query(cancelReservationQuery, [
      reason.trim(),
      id,
      decoded.id,
    ]);

    // Unlock coupon instance if any
    if (resv.coupon_id) {
      await unlockOnePurchasedCoupon(client, {
        userId: decoded.id,
        couponId: resv.coupon_id,
      });
    }

    // Late cancellation penalty (within 2 hours)
    if (diffInHours < 2 && diffInHours > 0) {
      const userResult = await client.query(fetchUserPoints, [decoded.id]);
      const currentPoints = userResult.rows[0]?.loyalty_points || 0;
      const newPoints = Math.max(currentPoints - 15, 0);
      await client.query(updateUserPointsQuery, [newPoints, decoded.id]);
    }

    await client.query("COMMIT");
    return res.json({ status: "Canceled", reservation: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to cancel reservation." });
  } finally {
    client.release();
  }
};

/**
 * User filtered list (uses the parametrized queries).
 * Query: ?status=&date=YYYY-MM-DD&page=&pageSize=
 */
const getFilteredReservations = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const statusPattern = req.query.status ? `%${req.query.status}%` : null;
  const dateParam = req.query.date || null;

  try {
    const { rows } = await pool.query(fetchFilteredUserReservations, [
      decoded.id,
      statusPattern,
      dateParam,
      limit,
      offset,
    ]);

    const formatted = rows.map((r) => {
      const {
        sm_id,
        sm_name,
        sm_description,
        c_id,
        c_description,
        ...base
      } = r;
      return {
        ...base,
        special_menu: sm_id
          ? { id: sm_id, name: sm_name, description: sm_description }
          : null,
        coupon: c_id ? { id: c_id, description: c_description } : null,
      };
    });

    const { rows: countRows } = await pool.query(
      countFilteredUserReservations,
      [decoded.id, statusPattern, dateParam]
    );
    const totalCount = parseInt(countRows[0].count, 10);

    const viewedRecords = (page - 1) * pageSize + formatted.length;
    const remainingRecords = totalCount - viewedRecords;

    return res.json({
      reservations: formatted,
      Pagination: {
        currentPage: page,
        recordsOnCurrentPage: formatted.length,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reservations." });
  }
};

/**
 * Owner changes status with transaction + side effects.
 */
const patchReservationAsOwner = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { error, value } = patchReservationAsOwnerSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { status: nextStatus, cancellation_reason, reservation_id } = value;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ownership check
    const ownership = await client.query(verifyReservationOwnership, [
      reservation_id,
      decoded.id,
    ]);
    if (ownership.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant" });
    }

    // Fetch current reservation to enforce transitions & side-effects
    const { rows: rows0 } = await client.query(
      `SELECT id, user_id, status, coupon_id FROM reservations WHERE id = $1`,
      [reservation_id]
    );
    if (rows0.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Reservation not found" });
    }
    const current = rows0[0];

    // Enforce valid transitions
    if (!isValidTransition(current.status, nextStatus)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: `Invalid status transition: ${current.status} → ${nextStatus}`,
      });
    }

    // Require reason on cancel
    if (nextStatus === "cancelled" && !cancellation_reason?.trim()) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "cancellation_reason is required for cancel." });
    }

    // Update reservation
    const { rows } = await client.query(patchReservationAsOwnerQuery, [
      nextStatus,
      cancellation_reason || null,
      reservation_id,
    ]);
    const updated = rows[0];

    // Side-effects
    if (current.coupon_id) {
      if (nextStatus === "cancelled") {
        await unlockOnePurchasedCoupon(client, {
          userId: current.user_id,
          couponId: current.coupon_id,
        });
      } else if (nextStatus === "completed") {
        await consumeOneLockedCoupon(client, {
          userId: current.user_id,
          couponId: current.coupon_id,
        });
      }
    }

    // Award points on completed
    if (nextStatus === "completed") {
      const { rows: up } = await client.query(fetchUserPoints, [
        current.user_id,
      ]);
      const pts = up[0]?.loyalty_points || 0;
      const newPts = pts + 10;
      await client.query(updateUserPointsQuery, [newPts, current.user_id]);
    }

    await client.query("COMMIT");
    return res.status(200).json({
      message: "Reservation updated successfully",
      reservation: updated,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * Owner filtered list (parametrized query; no extra string concatenation).
 * Query: ?status=&date=YYYY-MM-DD&page=&pageSize=
 */
const getOwnerFilteredReservations = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { error } = getOwnerFilteredReservationsSchema.validate(req.query);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const statusPattern = req.query.status ? `%${req.query.status}%` : null;
  const dateParam = req.query.date || null;

  try {
    const { rows: reservations } = await pool.query(
      fetchOwnerFilteredReservations,
      [decoded.id, statusPattern, dateParam, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      countOwnerFilteredReservations,
      [decoded.id, statusPattern, dateParam]
    );
    const totalCount = parseInt(countRows[0].count, 10);

    const currentPage = page;
    const recordsOnCurrentPage = reservations.length;
    const viewedRecords = (currentPage - 1) * pageSize + recordsOnCurrentPage;
    const remainingRecords = totalCount - viewedRecords;

    return res.json({
      reservations,
      Pagination: {
        currentPage,
        recordsOnCurrentPage,
        viewedRecords,
        remainingRecords,
        total: totalCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load reservations." });
  }
};

module.exports = {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
  cancelReservation,
  getFilteredReservations,
  patchReservationAsOwner,
  getOwnerFilteredReservations,
};
