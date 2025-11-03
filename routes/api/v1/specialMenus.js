// routes/api/v1/specialMenus.js
const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");
const {
  createSpecialMenu,
  updateSpecialMenu,
  deleteSpecialMenu,
} = require("../../../controllers/specialMenusController");

module.exports = (pool) => {
  const router = express.Router();

  // Create
  router.post("/", asyncHandler((req, res) => createSpecialMenu(req, res, pool)));

  // Update (preferred)
  router.patch("/:id", asyncHandler((req, res) => updateSpecialMenu(req, res, pool)));
  // Update (alias for idempotent clients)
  router.put("/:id", asyncHandler((req, res) => updateSpecialMenu(req, res, pool)));

  // Delete (preferred)
  router.delete("/:id", asyncHandler((req, res) => deleteSpecialMenu(req, res, pool)));
  // Delete (alias for environments without DELETE verb)
  router.post("/:id/delete", asyncHandler((req, res) => deleteSpecialMenu(req, res, pool)));

  return router;
};
