// controllers/menuItemsController.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { JWT_SECRET } = process.env;

const {
  menuItemSchema,
  updateMenuItemSchema,
} = require("../validators/menuItemsValidator");

const {
  createMenuItemQuery,
} = require("../queries/menuItemsQueries");

const { verifyRestaurantOwnership } = require("../queries/restaurantQueries");

/* ------------------------------- helpers ------------------------------- */

const verifyToken = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized - No token found" });
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    res.clearCookie("token");
    res.status(401).json({ message: "Unauthorized - Invalid token" });
    return null;
  }
};

// Ownership by menu item id (do not trust restaurant_id from client on update/delete)
const VERIFY_MENUITEM_OWNERSHIP_BY_ID = `
  SELECT 1
  FROM menu_items mi
  JOIN restaurants r ON mi.restaurant_id = r.id
  WHERE mi.id = $1 AND r.owner_id = $2
`;

// Allowed fields to update
const ALLOWED_FIELDS = new Set(["name", "price", "category", "description", "discount"]);

/* --------------------------- controller methods --------------------------- */

const createMenuItem = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { error, value } = menuItemSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  const { name, price, category, description, discount, restaurant_id } = value;

  try {
    // Verify the restaurant belongs to the owner
    const ownershipResult = await pool.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownershipResult.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this restaurant." });
    }

    const { rows } = await pool.query(createMenuItemQuery, [
      name,
      price,
      category,
      description,
      discount,
      restaurant_id,
    ]);

    return res
      .status(201)
      .json({ message: "Menu item created", menu_item: rows[0] });
  } catch (err) {
    logger.error("Error creating menu item:", err);
    return res.status(500).json({ message: "Failed to create menu item." });
  }
};

const updateMenuItem = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;
  const { error, value } = updateMenuItemSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });
  }

  // Ignore restaurant_id for security; enforce ownership by item id
  const { restaurant_id: _ignore, ...fieldsToUpdate } = value;

  try {
    // Ownership by item id
    const own = await pool.query(VERIFY_MENUITEM_OWNERSHIP_BY_ID, [
      id,
      decoded.id,
    ]);
    if (own.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this menu item." });
    }

    const keys = Object.keys(fieldsToUpdate).filter((k) => ALLOWED_FIELDS.has(k));
    if (keys.length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => fieldsToUpdate[k]);

    const updateQuery = `
      UPDATE menu_items
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [...values, id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    return res
      .status(200)
      .json({ message: "Menu item updated", menu_item: rows[0] });
  } catch (err) {
    logger.error("Error updating menu item:", err);
    return res.status(500).json({ message: "Failed to update menu item." });
  }
};

const deleteMenuItem = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;

  try {
    // Ownership by item id
    const own = await pool.query(VERIFY_MENUITEM_OWNERSHIP_BY_ID, [
      id,
      decoded.id,
    ]);
    if (own.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this menu item." });
    }

    // Delete by id (no restaurant_id from client)
    const { rows } = await pool.query(
      `DELETE FROM menu_items WHERE id = $1 RETURNING *;`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    return res
      .status(200)
      .json({ message: "Menu item deleted successfully", menu_item: rows[0] });
  } catch (err) {
    logger.error("Error deleting menu item:", err);
    return res.status(500).json({ message: "Failed to delete menu item." });
  }
};

module.exports = {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
