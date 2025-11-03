// controllers/specialMenusController.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { JWT_SECRET } = process.env;

const {
  createSpecialMenuSchema,
  updateSpecialMenuSchema,
  deleteSpecialMenuSchema,
} = require("../validators/specialMenusValidator");

const {
  // queries
  createSpecialMenuQuery,
  deleteSpecialMenuQuery,
  verifyRestaurantOwnership,
  verifySpecialMenuOwnershipById,
  updatePricesFromLinked,
} = require("../queries/specialMenusQueries");

/* ------------------------------- helpers ------------------------------- */

const verifyToken = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized - No token" });
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    res.clearCookie("token");
    res.status(401).json({ message: "Unauthorized - Invalid token" });
    return null;
  }
};

/* --------------------------- controller methods --------------------------- */

const createSpecialMenu = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { error, value } = createSpecialMenuSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  const {
    name,
    description,
    // original_price (ignored; computed server-side)
    discounted_price,
    // discount_percentage (ignored; computed server-side)
    photo_url,
    restaurant_id,
    availability,
  } = value;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify the restaurant belongs to this owner
    const ownerCheck = await client.query(verifyRestaurantOwnership, [
      restaurant_id,
      decoded.id,
    ]);
    if (ownerCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Forbidden - Not owner" });
    }

    // Insert special menu (server will later recompute prices/discount%)
    const { rows: createdRows } = await client.query(createSpecialMenuQuery, [
      name,
      description || null,
      /* original_price */ null,
      discounted_price,
      /* discount_percentage */ null,
      photo_url || null,
      restaurant_id,
      availability || null,
    ]);
    const created = createdRows[0];

    // Recompute original_price & discount_percentage from linked items
    const { rows: recomputed } = await client.query(updatePricesFromLinked, [
      created.id,
    ]);

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Special menu created",
      specialMenu: recomputed[0] || created,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("❌ Error creating special menu:", err);
    return res.status(500).json({ message: "Failed to create special menu." });
  } finally {
    client.release();
  }
};

const updateSpecialMenu = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;
  const { error, value } = updateSpecialMenuSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  // Ignore client-sent original_price / discount_percentage (computed server-side)
  const {
    restaurant_id: _ignoreRestaurantId,
    original_price: _ignoreOriginal,
    discount_percentage: _ignoreDiscountPct,
    ...fields
  } = value;

  // Whitelist allowed fields for update
  const ALLOWED = new Set([
    "name",
    "description",
    "discounted_price",
    "photo_url",
    "availability",
  ]);
  const keys = Object.keys(fields).filter((k) => ALLOWED.has(k));
  if (keys.length === 0) {
    return res.status(400).json({ message: "No valid fields to update." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ownership by special menu id
    const own = await client.query(verifySpecialMenuOwnershipById, [
      id,
      decoded.id,
    ]);
    if (own.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this special menu." });
    }

    // Dynamic update
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);

    const updateQuery = `
      UPDATE special_menus
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *;
    `;

    const { rows: updatedRows } = await client.query(updateQuery, [
      ...values,
      id,
    ]);
    if (updatedRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Special menu not found." });
    }

    // Recompute prices from linked items (reflects any change in discounted_price)
    const { rows: recomputed } = await client.query(updatePricesFromLinked, [
      id,
    ]);

    await client.query("COMMIT");
    return res.status(200).json({
      message: "Special menu updated",
      specialMenu: recomputed[0] || updatedRows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("❌ Error updating special menu:", err);
    return res.status(500).json({ message: "Failed to update special menu." });
  } finally {
    client.release();
  }
};

const deleteSpecialMenu = async (req, res, pool) => {
  const decoded = verifyToken(req, res);
  if (!decoded) return;

  const { id } = req.params;

  // If your schema requires some body fields, validate (ignored for auth)
  const { error } = deleteSpecialMenuSchema.validate(req.body || {});
  if (error)
    return res
      .status(400)
      .json({ message: "Validation failed", details: error.details });

  try {
    // Ownership by special menu id
    const own = await pool.query(verifySpecialMenuOwnershipById, [
      id,
      decoded.id,
    ]);
    if (own.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Forbidden - You do not own this special menu." });
    }

    const { rows } = await pool.query(deleteSpecialMenuQuery, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Special menu not found." });
    }

    return res
      .status(200)
      .json({ message: "Special menu deleted", deleted: rows[0] });
  } catch (err) {
    logger.error("❌ Error deleting special menu:", err);
    return res.status(500).json({ message: "Failed to delete special menu." });
  }
};

module.exports = {
  createSpecialMenu,
  updateSpecialMenu,
  deleteSpecialMenu,
};
