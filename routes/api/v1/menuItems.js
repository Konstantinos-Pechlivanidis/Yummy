// routes/api/v1/menuItems.js
const express = require("express");
const {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../../../controllers/menuItemsController");

module.exports = (pool) => {
  const router = express.Router();

  // Create
  router.post("/", (req, res) => createMenuItem(req, res, pool));

  // Update (preferred)
  router.patch("/:id", (req, res) => updateMenuItem(req, res, pool));
  // Update (alias for idempotent clients)
  router.put("/:id", (req, res) => updateMenuItem(req, res, pool));

  // Delete (preferred)
  router.delete("/:id", (req, res) => deleteMenuItem(req, res, pool));
  // Delete (alias for environments without DELETE verb)
  router.post("/:id/delete", (req, res) => deleteMenuItem(req, res, pool));

  return router;
};
