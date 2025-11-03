const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");

const {
  createSpecialMenuItem,
  deleteSpecialMenuItem,
} = require("../../../controllers/specialMenuItemsController");

module.exports = (pool) => {
  const router = express.Router();
  // Create link between special menu and menu item
  router.post("/", asyncHandler((req, res) => {
    return createSpecialMenuItem(req, res, pool);
  }));

  // Delete link between special menu and menu item
  router.delete("/", asyncHandler((req, res) => {
    return deleteSpecialMenuItem(req, res, pool);
  }));

  return router;
};
