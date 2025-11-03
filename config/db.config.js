require("dotenv").config();
const { Pool } = require("pg");
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, NODE_ENV } = process.env;

// Postgres pool of connections
// Neon requires SSL connections - detect if using Neon by checking host
const isNeon = PGHOST && (PGHOST.includes("neon.tech") || PGHOST.includes("aws.neon.tech"));

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  // Neon always requires SSL. For production, use strict SSL validation
  // For development/testing with Neon or other cloud providers, allow self-signed certs
  ssl: isNeon || NODE_ENV === "production"
    ? { rejectUnauthorized: NODE_ENV === "production" }
    : false,
  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Handle pool errors
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test connection on startup
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Database connected successfully");
  }
});

module.exports = pool;
