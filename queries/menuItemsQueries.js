// queries/menuItemsQueries.js

// Create a menu item (restaurant ownership is checked in controller)
const createMenuItemQuery = `
  INSERT INTO menu_items (name, price, category, description, discount, restaurant_id)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *;
`;

// 🔒 Verify ownership by menu item id (join item → restaurant → owner)
const verifyMenuItemOwnershipById = `
  SELECT 1
  FROM menu_items mi
  JOIN restaurants r ON mi.restaurant_id = r.id
  WHERE mi.id = $1 AND r.owner_id = $2
`;

// 🗑️ Owner-scoped delete by item id (drops restaurant_id param)
// Params: [menuItemId, ownerId]
const deleteMenuItemByOwnerQuery = `
  DELETE FROM menu_items mi
  USING restaurants r
  WHERE mi.id = $1
    AND mi.restaurant_id = r.id
    AND r.owner_id = $2
  RETURNING mi.*;
`;

module.exports = {
  createMenuItemQuery,
  verifyMenuItemOwnershipById,
  deleteMenuItemByOwnerQuery,
};
