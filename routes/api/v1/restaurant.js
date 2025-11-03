// routes/restaurantRoutes.js
const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");
const cookieJWTAuth = require("../../../middleware/cookieJWTAuth");
const { cacheMiddleware } = require("../../../utils/cache");
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
  // Cache public endpoints for 15 minutes
  router.get("/trending", cacheMiddleware(900), asyncHandler((req, res) => getTrendingRestaurants(req, res, pool)));
  router.get("/discounted", cacheMiddleware(900), asyncHandler((req, res) =>
    getDiscountedRestaurants(req, res, pool)
  ));
  router.get("/", cacheMiddleware(900), asyncHandler((req, res) => getFilteredRestaurants(req, res, pool)));

  /* ---------- Public single read (legacy path) ---------- */
  router.get("/id/:id", cacheMiddleware(900), asyncHandler((req, res) => getRestaurantById(req, res, pool)));

  /* ---------- Owner endpoints (protected) ---------- */
  router.patch("/:id", cookieJWTAuth, asyncHandler((req, res) =>
    updateRestaurant(req, res, pool)
  ));
  // Optional aliases for environments without PATCH support:
  // router.put("/:id", cookieJWTAuth, asyncHandler((req, res) => updateRestaurant(req, res, pool)));
  // router.post("/:id/contact", cookieJWTAuth, asyncHandler((req, res) => updateRestaurant(req, res, pool)));

  router.get("/owner", cookieJWTAuth, asyncHandler((req, res) =>
    getOwnerRestaurant(req, res, pool)
  ));

  // If you add the overview controller:
  router.get("/owner/overview", cookieJWTAuth, asyncHandler((req, res) =>
    getOwnerOverview(req, res, pool)
  ));

  /* ---------- REST-style single read (place LAST to avoid shadowing) ---------- */
  router.get("/:id", cacheMiddleware(900), asyncHandler((req, res) => getRestaurantById(req, res, pool)));

  return router;
};
