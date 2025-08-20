// routes/api/v1/specialMenus.js
const express = require("express");
const {
  createSpecialMenu,
  updateSpecialMenu,
  deleteSpecialMenu,
} = require("../../../controllers/specialMenusController");

module.exports = (pool) => {
  const router = express.Router();

  // Create
  router.post("/", (req, res) => createSpecialMenu(req, res, pool));

  // Update (preferred)
  router.patch("/:id", (req, res) => updateSpecialMenu(req, res, pool));
  // Update (alias for idempotent clients)
  router.put("/:id", (req, res) => updateSpecialMenu(req, res, pool));

  // Delete (preferred)
  router.delete("/:id", (req, res) => deleteSpecialMenu(req, res, pool));
  // Delete (alias for environments without DELETE verb)
  router.post("/:id/delete", (req, res) => deleteSpecialMenu(req, res, pool));

  return router;
};
