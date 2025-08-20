// queries/reservationsQueries.js

/* =========================
 * User-facing reservations
 * ========================= */

// All reservations for a user (simple list, already ordered)
const fetchReservationsByUser = `
  SELECT *
  FROM reservations
  WHERE user_id = $1
  ORDER BY date DESC, time DESC
`;

// Filtered + paginated user reservations
// Params: [userId, statusPatternOrNull, dateOrNull, limit, offset]
const fetchFilteredUserReservations = `
  SELECT
    r.*,
    sm.id   AS sm_id,
    sm.name AS sm_name,
    sm.description AS sm_description,
    c.id    AS c_id,
    c.description AS c_description
  FROM reservations r
  LEFT JOIN special_menus sm ON r.special_menu_id = sm.id
  LEFT JOIN coupons c        ON r.coupon_id      = c.id
  WHERE r.user_id = $1
    AND ($2::text IS NULL OR r.status ILIKE $2)
    AND ($3::date IS NULL OR r.date = $3)
  ORDER BY r.date DESC, r.time DESC
  LIMIT $4 OFFSET $5
`;

const countFilteredUserReservations = `
  SELECT COUNT(*)
  FROM reservations r
  WHERE r.user_id = $1
    AND ($2::text IS NULL OR r.status ILIKE $2)
    AND ($3::date IS NULL OR r.date = $3)
`;

// Fetch single reservation by id for a specific user
const fetchReservationById = `
  SELECT *
  FROM reservations
  WHERE id = $1 AND user_id = $2
`;

/* =========================
 * Create / mutate
 * ========================= */

const createReservationQuery = `
  WITH 
    special_menu_check AS (
      SELECT restaurant_id AS sm_restaurant_id
      FROM special_menus
      WHERE id = $7
    ),
    coupon_check AS (
      SELECT restaurant_id AS cp_restaurant_id
      FROM coupons
      WHERE id = $8
    )
  INSERT INTO reservations (
    user_id, restaurant_id, date, time, guest_count, status, special_menu_id, coupon_id, reservation_notes
  )
  SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
  WHERE 
    (
      ($7 IS NULL OR EXISTS (
        SELECT 1 FROM special_menu_check WHERE sm_restaurant_id = $2
      ))
      AND
      ($8 IS NULL OR EXISTS (
        SELECT 1 FROM coupon_check WHERE cp_restaurant_id = $2
      ))
    )
  RETURNING *;
`;

const deleteReservationQuery = `
  DELETE FROM reservations
  WHERE id = $1 AND user_id = $2
  RETURNING id;
`;

const cancelReservationQuery = `
  UPDATE reservations
  SET status = 'cancelled', cancellation_reason = $1
  WHERE id = $2 AND user_id = $3
  RETURNING *;
`;

const patchReservationAsOwnerQuery = `
  UPDATE reservations
  SET
    status = COALESCE($1, status),
    cancellation_reason = COALESCE($2, cancellation_reason)
  WHERE id = $3
  RETURNING *;
`;

/* =========================
 * Ownership / listing for owners
 * ========================= */

// Verify this reservation belongs to a restaurant owned by ownerId
const verifyReservationOwnership = `
  SELECT 1
  FROM reservations r
  JOIN restaurants res ON r.restaurant_id = res.id
  WHERE r.id = $1 AND res.owner_id = $2
`;

/**
 * Owner filtered listing with built-in filters + pagination.
 * Status: ILIKE pattern (e.g. '%pending%') or NULL to ignore
 * Date: compares against local day (Europe/Athens) or NULL to ignore
 *
 * Params: [ownerId, statusPatternOrNull, dateOrNull, limit, offset]
 */
const fetchOwnerFilteredReservations = `
  SELECT
    r.*
  FROM reservations r
  JOIN restaurants res ON r.restaurant_id = res.id
  WHERE res.owner_id = $1
    AND ($2::text IS NULL OR r.status ILIKE $2)
    AND (
      $3::date IS NULL OR
      (r.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Athens')::date = $3
    )
  ORDER BY r.date DESC, r.time ASC
  LIMIT $4 OFFSET $5
`;

const countOwnerFilteredReservations = `
  SELECT COUNT(*)
  FROM reservations r
  JOIN restaurants res ON r.restaurant_id = res.id
  WHERE res.owner_id = $1
    AND ($2::text IS NULL OR r.status ILIKE $2)
    AND (
      $3::date IS NULL OR
      (r.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Athens')::date = $3
    )
`;

module.exports = {
  /* user */
  fetchReservationsByUser,
  fetchFilteredUserReservations,
  countFilteredUserReservations,
  fetchReservationById,

  /* create/mutate */
  createReservationQuery,
  deleteReservationQuery,
  cancelReservationQuery,
  patchReservationAsOwnerQuery,

  /* owner */
  verifyReservationOwnership,
  fetchOwnerFilteredReservations,
  countOwnerFilteredReservations,
};
