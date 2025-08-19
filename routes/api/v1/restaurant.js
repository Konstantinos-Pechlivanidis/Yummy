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
} = require("../../../controllers/restaurantController");

module.exports = (pool) => {
  const router = express.Router();

  router.get("/id/:id", (req, res) => getRestaurantById(req, res, pool));
  router.get("/", (req, res) => getFilteredRestaurants(req, res, pool));
  router.get("/trending", (req, res) => getTrendingRestaurants(req, res, pool));
  router.get("/discounted", (req, res) =>
    getDiscountedRestaurants(req, res, pool)
  );
  router.patch("/:id", (req, res) => updateRestaurant(req, res, pool));
  router.get("/owner", (req, res) => getOwnerRestaurant(req, res, pool));

  return router;
};
