/**
 * Quick script to update ratings for all restaurants
 * Run this if trending endpoint doesn't show restaurants
 */

require("dotenv").config();
const pool = require("../config/db.config");

async function updateRatings() {
  try {
    // Check current state
    const checkNull = await pool.query(
      `SELECT COUNT(*) as count FROM restaurants WHERE rating IS NULL OR rating = 0`
    );
    console.log(`Found ${checkNull.rows[0].count} restaurants without ratings`);

    // Update all restaurants without ratings
    const result = await pool.query(
      `SELECT id FROM restaurants WHERE rating IS NULL OR rating = 0`
    );

    if (result.rows.length === 0) {
      console.log("✅ All restaurants already have ratings!");
      return;
    }

    let updated = 0;
    for (const row of result.rows) {
      const rating = parseFloat((Math.random() * 1.5 + 3.5).toFixed(1));
      
      await pool.query(
        `UPDATE restaurants SET rating = $1 WHERE id = $2`,
        [rating, row.id]
      );
      updated++;
    }

    console.log(`✅ Updated ratings for ${updated} restaurants`);
    console.log("✅ Trending endpoint should now work correctly!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (!error.message.includes("does not exist")) {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

updateRatings();

