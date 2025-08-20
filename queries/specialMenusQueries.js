// queries/specialMenusQueries.js

// Create a special menu (prices/discount% are recomputed server-side)
const createSpecialMenuQuery = `
  INSERT INTO special_menus (
    name, description, original_price, discounted_price,
    discount_percentage, photo_url, restaurant_id, availability
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *;
`;

const deleteSpecialMenuQuery = `
  DELETE FROM special_menus
  WHERE id = $1
  RETURNING *;
`;

// Ownership checks
const verifyRestaurantOwnership = `
  SELECT 1
  FROM restaurants
  WHERE id = $1 AND owner_id = $2;
`;

const verifySpecialMenuOwnershipById = `
  SELECT 1
  FROM special_menus sm
  JOIN restaurants r ON sm.restaurant_id = r.id
  WHERE sm.id = $1 AND r.owner_id = $2;
`;

// Recompute original_price + discount_percentage from linked items
const updatePricesFromLinked = `
  WITH agg AS (
    SELECT
      $1::int AS id,
      (SELECT COALESCE(SUM(mi.price), 0)
         FROM special_menu_items smi
         JOIN menu_items mi ON mi.id = smi.menu_item_id
        WHERE smi.special_menu_id = $1) AS original_price_sum
  )
  UPDATE special_menus sm
  SET
    original_price = CASE
      WHEN agg.original_price_sum > 0 THEN agg.original_price_sum
      ELSE COALESCE(sm.discounted_price, 0)
    END,
    discount_percentage = CASE
      WHEN GREATEST(agg.original_price_sum, COALESCE(sm.discounted_price,0)) > 0
        THEN ROUND(
          ((CASE WHEN agg.original_price_sum > 0 THEN agg.original_price_sum ELSE COALESCE(sm.discounted_price,0) END
           - COALESCE(sm.discounted_price,0))
          / NULLIF((CASE WHEN agg.original_price_sum > 0 THEN agg.original_price_sum ELSE COALESCE(sm.discounted_price,0) END), 0)
          ) * 100
        )
      ELSE 0
    END,
    updated_at = NOW()
  FROM agg
  WHERE sm.id = agg.id
  RETURNING sm.*;
`;

module.exports = {
  createSpecialMenuQuery,
  deleteSpecialMenuQuery,
  verifyRestaurantOwnership,
  verifySpecialMenuOwnershipById,
  updatePricesFromLinked,
};
