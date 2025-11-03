/**
 * Database Test Helpers
 * Utilities for database testing and isolation
 */

const { Pool } = require("pg");

/**
 * Create a test database connection
 */
function createTestPool() {
  return new Pool({
    host: process.env.PGHOST || "localhost",
    database: process.env.PGDATABASE || "yummy_test",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    port: process.env.PGPORT || 5432,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

/**
 * Clean test database
 */
async function cleanDatabase(pool) {
  const tables = [
    "purchased_coupons",
    "reservations",
    "special_menu_items",
    "special_menus",
    "menu_items",
    "favorites",
    "coupons",
    "restaurants",
    "users",
    "admins",
  ];

  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (err) {
      // Table might not exist, ignore
      if (!err.message.includes("does not exist")) {
        console.warn(`Failed to truncate ${table}:`, err.message);
      }
    }
  }
}

/**
 * Seed test data
 */
async function seedTestData(pool) {
  const hashedPassword = await require("./testHelpers").hashPassword("password123");
  
  // Insert test user
  await pool.query(
    `INSERT INTO users (name, email, password, role, confirmed_user, loyalty_points)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO NOTHING
     RETURNING *`,
    ["Test User", "test@example.com", hashedPassword, "customer", true, 100]
  );

  // Insert test owner
  await pool.query(
    `INSERT INTO users (name, email, password, role, confirmed_user)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING
     RETURNING *`,
    ["Test Owner", "owner@example.com", hashedPassword, "owner", true]
  );

  // Insert test restaurant
  const restaurantResult = await pool.query(
    `INSERT INTO restaurants (name, location, cuisine, address, coordinates, opening_hours, contact, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [
      "Test Restaurant",
      "Athens",
      "Italian",
      JSON.stringify({
        street: "Main Street",
        number: "123",
        postalCode: "10431",
        area: "City Center",
      }),
      JSON.stringify({ lat: 37.9838, lng: 23.7275 }),
      JSON.stringify({ open: "11:00", close: "23:00" }),
      JSON.stringify({
        phone: "+302101234567",
        email: "restaurant@example.com",
        socialMedia: {
          facebook: "https://facebook.com/restaurant",
          instagram: "https://instagram.com/restaurant",
        },
      }),
      2, // owner_id
    ]
  );

  return {
    userId: 1,
    ownerId: 2,
    restaurantId: restaurantResult.rows[0]?.id || 1,
  };
}

/**
 * Execute in transaction for test isolation
 */
async function withTransaction(pool, callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("ROLLBACK");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createTestPool,
  cleanDatabase,
  seedTestData,
  withTransaction,
};

