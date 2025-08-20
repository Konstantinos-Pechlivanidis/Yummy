// routes/restaurantRoutes.js
const express = require("express");
const cookieJWTAuth = require("../../../middleware/cookieJWTAuth");
const {
  getTrendingRestaurants,
  getDiscountedRestaurants,
  getFilteredRestaurants,
  getRestaurantById,
  updateRestaurant,
  getOwnerRestaurant,
  getOwnerOverview
} = require("../../../controllers/restaurantController");

module.exports = (pool) => {
  const router = express.Router();

  /* ---------- Public list endpoints ---------- */
  router.get("/trending", (req, res) => getTrendingRestaurants(req, res, pool));
  router.get("/discounted", (req, res) =>
    getDiscountedRestaurants(req, res, pool)
  );
  router.get("/", (req, res) => getFilteredRestaurants(req, res, pool));

  /* ---------- Public single read (legacy path) ---------- */
  router.get("/id/:id", (req, res) => getRestaurantById(req, res, pool));

  /* ---------- Owner endpoints (protected) ---------- */
  router.patch("/:id", cookieJWTAuth, (req, res) =>
    updateRestaurant(req, res, pool)
  );
  // Optional aliases for environments without PATCH support:
  // router.put("/:id", cookieJWTAuth, (req, res) => updateRestaurant(req, res, pool));
  // router.post("/:id/contact", cookieJWTAuth, (req, res) => updateRestaurant(req, res, pool));

  router.get("/owner", cookieJWTAuth, (req, res) =>
    getOwnerRestaurant(req, res, pool)
  );

  // If you add the overview controller:
  router.get("/owner/overview", cookieJWTAuth, (req, res) =>
    getOwnerOverview(req, res, pool)
  );

  /* ---------- REST-style single read (place LAST to avoid shadowing) ---------- */
  router.get("/:id", (req, res) => getRestaurantById(req, res, pool));

  return router;
};
