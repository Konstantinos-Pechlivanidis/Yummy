// queries/couponsQueries.js

// User's purchased coupons (paginated + deterministic order)
const fetchUserCouponsQuery = `
  SELECT
    c.*,
    pc.id AS purchased_coupon_id,
    pc.is_used,
    pc.is_locked,
    pc.purchased_at
  FROM purchased_coupons pc
  JOIN coupons c ON pc.coupon_id = c.id
  WHERE pc.user_id = $1
  ORDER BY pc.purchased_at DESC, pc.id DESC
  LIMIT $2 OFFSET $3
`;

const getUserCouponsTotal = `
  SELECT COUNT(*)
  FROM purchased_coupons pc
  JOIN coupons c ON pc.coupon_id = c.id
  WHERE pc.user_id = $1
`;

// Insert a purchase (defaults: is_locked=false, is_used=false)
const purchaseCouponQuery = `
  INSERT INTO purchased_coupons (user_id, coupon_id, purchased_at)
  VALUES ($1, $2, NOW())
  RETURNING *;
`;

// 🔧 AVAILABLE COUPONS (correct pagination: LIMIT/OFFSET on OUTER query)
const fetchAvailableCouponsQuery = `
  SELECT c.*
  FROM coupons c
  WHERE c.restaurant_id = $1
    AND NOT EXISTS (
      SELECT 1
      FROM purchased_coupons pc
      WHERE pc.coupon_id = c.id
        AND pc.user_id = $2
    )
  ORDER BY c.id DESC
  LIMIT $3 OFFSET $4
`;

// Total count for available coupons (same predicate, no LIMIT/OFFSET)
const fetchAvailableCouponsQueryTotal = `
  SELECT COUNT(*)
  FROM coupons c
  WHERE c.restaurant_id = $1
    AND NOT EXISTS (
      SELECT 1
      FROM purchased_coupons pc
      WHERE pc.coupon_id = c.id
        AND pc.user_id = $2
    )
`;

// Restaurants where the user has at least one purchased coupon
const fetchRestaurantsWithPurchasedCoupons = `
  SELECT
    r.*,
    json_agg(DISTINCT c.*) AS coupons,
    json_agg(DISTINCT sm.*) AS special_menus
  FROM restaurants r
  JOIN coupons c ON c.restaurant_id = r.id
  JOIN purchased_coupons upc ON upc.coupon_id = c.id
  LEFT JOIN special_menus sm ON sm.restaurant_id = r.id
  WHERE upc.user_id = $1
  GROUP BY r.id
`;

// Owner ops
const createCouponQuery = `
  INSERT INTO coupons (description, discount_percentage, required_points, restaurant_id)
  VALUES ($1, $2, $3, $4)
  RETURNING *;
`;

const verifyRestaurantOwnership = `
  SELECT 1 FROM restaurants
  WHERE id = $1 AND owner_id = $2
`;

// (Optional) Static update query. If you build dynamic updates in controller, you may not use this.
const updateCouponQuery = `
  UPDATE coupons
  SET description = $1,
      discount_percentage = $2,
      required_points = $3
  WHERE id = $4
  RETURNING *;
`;

const deleteCouponQuery = `
  DELETE FROM coupons
  WHERE id = $1
  RETURNING *;
`;

const getCouponWithRestaurant = `
  SELECT c.id, c.restaurant_id, r.owner_id
  FROM coupons c
  JOIN restaurants r ON c.restaurant_id = r.id
  WHERE c.id = $1
`;

// ✅ Helper to block deletion when there are still unused/locked purchases
const existsActivePurchaseForCoupon = `
  SELECT 1
  FROM purchased_coupons
  WHERE coupon_id = $1
    AND (is_used = false OR is_locked = true)
  LIMIT 1
`;

module.exports = {
  fetchUserCouponsQuery,
  purchaseCouponQuery,
  fetchAvailableCouponsQuery,
  fetchRestaurantsWithPurchasedCoupons,
  getUserCouponsTotal,
  fetchAvailableCouponsQueryTotal,
  createCouponQuery,
  verifyRestaurantOwnership,
  updateCouponQuery,
  deleteCouponQuery,
  getCouponWithRestaurant,
  existsActivePurchaseForCoupon,
};
