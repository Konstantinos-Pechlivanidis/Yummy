const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");
const {
  fetchTestimonials,
} = require("../../../controllers/testimonialsController");

module.exports = (pool) => {
  const router = express.Router();

  router.get("/all", asyncHandler((req, res) => fetchTestimonials(req, res, pool)));

  return router;
};
