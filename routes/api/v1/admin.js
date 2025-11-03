const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");
const {
  createRestaurant,
  registerAdmin,
  loginAdmin,
} = require("../../../controllers/adminController");

module.exports = (pool) => {
  const router = express.Router();

  router.post("/createRestaurant", asyncHandler((req, res) =>
    createRestaurant(req, res, pool)
  ));

  router.post("/register", asyncHandler((req, res) => registerAdmin(req, res, pool)));
  router.post("/login", asyncHandler((req, res) => loginAdmin(req, res, pool)));

  return router;
};
