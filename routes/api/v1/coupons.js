// routes/api/v1/coupons.js
const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");
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
  router.get("/ownedByUser", asyncHandler((req, res) => getUserCoupons(req, res, pool)));
  router.post("/purchase", asyncHandler((req, res) => purchaseCoupon(req, res, pool)));
  router.get("/available", asyncHandler((req, res) => getAvailableCoupons(req, res, pool)));
  router.get("/purchased/restaurants", asyncHandler((req, res) =>
    getRestaurantsWithPurchasedCoupons(req, res, pool)
  ));
  router.post("/creation", asyncHandler((req, res) => createCoupon(req, res, pool)));
  router.patch("/edit", asyncHandler((req, res) => editCoupon(req, res, pool)));
  router.delete("/delete", asyncHandler((req, res) => deleteCoupon(req, res, pool)));

  // --- REST-style aliases (preferred going forward) ---
  // Purchase a coupon by ID
  router.post("/:couponId/purchase", asyncHandler((req, res) => {
    req.body.coupon_id = req.params.couponId; // map param -> expected body field
    return purchaseCoupon(req, res, pool);
  }));

  // Patch a coupon by ID (uses same controller; it expects body.couponId)
  router.patch("/:couponId", asyncHandler((req, res) => {
    req.body.couponId = req.params.couponId; // map param -> expected body field
    return editCoupon(req, res, pool);
  }));

  // Delete a coupon by ID (uses same controller; it expects body.couponId)
  router.delete("/:couponId", asyncHandler((req, res) => {
    req.body.couponId = req.params.couponId; // map param -> expected body field
    return deleteCoupon(req, res, pool);
  }));

  return router;
};
