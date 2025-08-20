// routes/api/v1/reservations.js
const express = require("express");
const {
  getUserReservations,
  getReservationById,
  createReservation,
  deleteReservation,
  cancelReservation,
  getFilteredReservations,
  patchReservationAsOwner,
  getOwnerFilteredReservations,
} = require("../../../controllers/reservationsController");

module.exports = (pool) => {
  const router = express.Router();

  /* ------------------------ User-facing routes ------------------------ */
  // List all reservations of the logged-in user
  router.get("/", (req, res) => getUserReservations(req, res, pool));

  // Filtered + paginated list for the user
  // Query: ?status=pending|confirmed|completed|cancelled&date=YYYY-MM-DD&page=&pageSize=
  router.get("/filter", (req, res) => getFilteredReservations(req, res, pool));

  // Create a reservation
  router.post("/", (req, res) => createReservation(req, res, pool));

  // User cancels their reservation (needs body: { reason })
  router.post("/:id/cancel", (req, res) => cancelReservation(req, res, pool));

  // User deletes (if allowed by your biz rules)
  router.delete("/:id", (req, res) => deleteReservation(req, res, pool));

  /* ------------------------- Owner-facing routes ------------------------- */
  // Owner filtered + paginated listing across their restaurants
  // Query: ?status=&date=YYYY-MM-DD&page=&pageSize=
  router.get("/owner", (req, res) =>
    getOwnerFilteredReservations(req, res, pool)
  );

  // Owner updates reservation status (expects body: { reservation_id, status, cancellation_reason? })
  router.patch("/owner/status", (req, res) =>
    patchReservationAsOwner(req, res, pool)
  );

  /* ------------------------- REST-style aliases ------------------------- */
  // Single reservation (user scope) — placed after fixed paths to avoid shadowing
  router.get("/:id", (req, res) => getReservationById(req, res, pool));

  // REST alias: owner updates status by param (maps :id -> reservation_id)
  router.patch("/:id/status", (req, res) => {
    req.body.reservation_id = req.params.id; // map param to controller expectation
    // body.status and body.cancellation_reason pass through from the request
    patchReservationAsOwner(req, res, pool);
  });

  // REST alias: owner cancel by param (sets status=cancelled, requires body.cancellation_reason)
  router.post("/:id/owner-cancel", (req, res) => {
    req.body.reservation_id = req.params.id;
    req.body.status = "cancelled";
    patchReservationAsOwner(req, res, pool);
  });

  return router;
};
