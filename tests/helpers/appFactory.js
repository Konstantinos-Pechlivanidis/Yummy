/**
 * App Factory for Testing
 * Creates Express app instance without starting server
 */

require("dotenv").config({ path: ".env.test" });

// Mock env validation for tests
jest.mock("../../config/envValidator", () => ({
  validateEnv: jest.fn(),
}));

// Mock Sentry for tests
jest.mock("../../utils/sentry", () => ({
  initSentry: jest.fn(),
  Sentry: {
    Handlers: {
      requestHandler: jest.fn(() => (req, res, next) => next()),
      errorHandler: jest.fn(() => (err, req, res, next) => next(err)),
      tracingHandler: jest.fn(() => (req, res, next) => next()),
    },
    captureException: jest.fn(),
  },
}));

// Mock Redis
jest.mock("../../utils/cache", () => ({
  initRedis: jest.fn(() => Promise.resolve()),
  cacheMiddleware: jest.fn(() => (req, res, next) => next()),
}));

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const { rateLimiter } = require("../../middleware/rateLimiter");
const requestIdMiddleware = require("../../middleware/requestId");
const { sanitizeRequestBody } = require("../../utils/sanitizer");
const pool = require("../../config/db.config");

// routes
const authRoutes = require("../../routes/api/v1/auth");
const userRoutes = require("../../routes/api/v1/user");
const restaurantRoutes = require("../../routes/api/v1/restaurant");
const testimonialRoutes = require("../../routes/api/v1/testimonials");
const reservationRoutes = require("../../routes/api/v1/reservations");
const couponsRoutes = require("../../routes/api/v1/coupons");
const ownerRoutes = require("../../routes/api/v1/owner");
const adminRoutes = require("../../routes/api/v1/admin");
const menuItemsRoutes = require("../../routes/api/v1/menuItems");
const specialMenusRoutes = require("../../routes/api/v1/specialMenus");
const specialMenuItemsRoutes = require("../../routes/api/v1/specialMenuItems");

function createApp(testPool = null) {
  const app = express();
  const dbPool = testPool || pool;

  /* ---------- core middleware ---------- */
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(
    morgan("dev", {
      skip: () => process.env.NODE_ENV === "test",
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(sanitizeRequestBody);

  // CORS
  const FRONT_END_URL = process.env.FRONT_END_URL || "http://localhost:3000";
  const allowlist = FRONT_END_URL.split(",").map((s) => s.trim()).filter(Boolean);
  const corsOptions = {
    origin(origin, cb) {
      if (!origin || allowlist.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(helmet());
  app.use(rateLimiter);

  /* ---------- mount routes ---------- */
  app.use("/api/v1/auth", authRoutes(dbPool));
  app.use("/api/v1/user", userRoutes(dbPool));
  app.use("/api/v1/restaurant", restaurantRoutes(dbPool));
  app.use("/api/v1/testimonials", testimonialRoutes(dbPool));
  app.use("/api/v1/reservations", reservationRoutes(dbPool));
  app.use("/api/v1/coupons", couponsRoutes(dbPool));
  app.use("/api/v1/owner", ownerRoutes(dbPool));
  app.use("/api/v1/admin", adminRoutes(dbPool));
  app.use("/api/v1/menuItems", menuItemsRoutes(dbPool));
  app.use("/api/v1/specialMenus", specialMenusRoutes(dbPool));
  app.use("/api/v1/special-menu-items", specialMenuItemsRoutes(dbPool));

  // Health check
  app.get("/healthz", async (req, res) => {
    try {
      await dbPool.query("SELECT NOW()");
      res.json({ ok: true, database: "connected", timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({
        ok: false,
        database: "disconnected",
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Global error handler
  app.use((err, req, res, next) => {
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: "Internal Server Error",
        requestId: req.id,
        ...(process.env.NODE_ENV !== "production" && { message: err.message }),
      });
    }
  });

  return app;
}

module.exports = createApp;

