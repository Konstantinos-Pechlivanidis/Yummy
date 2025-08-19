const express = require("express");
const {
  checkUnifiedAuthStatus,
} = require("../../../controllers/authController");

module.exports = (pool) => {
  const router = express.Router();

  // This single route will now handle auth status for both customers and owners.
  router.get("/status", (req, res) => checkUnifiedAuthStatus(req, res, pool));

  return router;
};