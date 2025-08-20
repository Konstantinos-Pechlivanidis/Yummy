// routes/api/v1/coupons.js
const express = require("express");
const {
  getUserCoupons,
  purchaseCoupon,
  getAvailableCoupons,
  getRestaurantsWithPurchasedCoupons,
  createCoupon,
  editCoupon,
  deleteCoupon,
} = require("../../../controllers/couponsController");

module.exports = (pool) => {
  const router = express.Router();

  // --- Existing endpoints (kept for backward compatibility) ---
  router.get("/ownedByUser", (req, res) => getUserCoupons(req, res, pool));
  router.post("/purchase", (req, res) => purchaseCoupon(req, res, pool));
  router.get("/available", (req, res) => getAvailableCoupons(req, res, pool));
  router.get("/purchased/restaurants", (req, res) =>
    getRestaurantsWithPurchasedCoupons(req, res, pool)
  );
  router.post("/creation", (req, res) => createCoupon(req, res, pool));
  router.patch("/edit", (req, res) => editCoupon(req, res, pool));
  router.delete("/delete", (req, res) => deleteCoupon(req, res, pool));

  // --- REST-style aliases (preferred going forward) ---
  // Purchase a coupon by ID
  router.post("/:couponId/purchase", (req, res) => {
    req.body.coupon_id = req.params.couponId; // map param -> expected body field
    purchaseCoupon(req, res, pool);
  });

  // Patch a coupon by ID (uses same controller; it expects body.couponId)
  router.patch("/:couponId", (req, res) => {
    req.body.couponId = req.params.couponId; // map param -> expected body field
    editCoupon(req, res, pool);
  });

  // Delete a coupon by ID (uses same controller; it expects body.couponId)
  router.delete("/:couponId", (req, res) => {
    req.body.couponId = req.params.couponId; // map param -> expected body field
    deleteCoupon(req, res, pool);
  });

  return router;
};
