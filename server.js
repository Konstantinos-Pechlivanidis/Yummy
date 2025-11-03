// server.js
require("dotenv").config();
const { validateEnv } = require("./config/envValidator");

// Validate environment variables before starting server
validateEnv();

// Initialize Sentry (if configured)
const { initSentry } = require("./utils/sentry");

// deps
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const path = require("path");
const cors = require("cors");
// optional perf
const compression = require("compression");

const { rateLimiter } = require("./middleware/rateLimiter");
const requestIdMiddleware = require("./middleware/requestId");
const { sanitizeRequestBody } = require("./utils/sanitizer");
const logger = require("./utils/logger");
const pool = require("./config/db.config");

const { envPORT, FRONT_END_URL, NODE_ENV } = process.env;
const PORT = Number(envPORT) || 3000;

// routes
const authRoutes = require("./routes/api/v1/auth");
const userRoutes = require("./routes/api/v1/user");
const restaurantRoutes = require("./routes/api/v1/restaurant");
const testimonialRoutes = require("./routes/api/v1/testimonials");
const reservationRoutes = require("./routes/api/v1/reservations");
const couponsRoutes = require("./routes/api/v1/coupons");
const ownerRoutes = require("./routes/api/v1/owner");
const adminRoutes = require("./routes/api/v1/admin");
const menuItemsRoutes = require("./routes/api/v1/menuItems");
const specialMenusRoutes = require("./routes/api/v1/specialMenus");
const specialMenuItemsRoutes = require("./routes/api/v1/specialMenuItems");

const app = express();

// Initialize Redis cache (if configured)
const { initRedis } = require("./utils/cache");
initRedis().catch((err) => {
  logger.warn("Redis initialization failed, continuing without cache", {
    error: err.message,
  });
});

// Initialize Sentry before other middleware
initSentry(app);

// Sentry request handler must be the first middleware
const { Sentry } = require("./utils/sentry");
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

/* ---------- core middleware ---------- */
app.set("trust proxy", 1); // needed for secure cookies behind proxies

// Request ID tracking (must be first to track all requests)
app.use(requestIdMiddleware);

// Structured logging with morgan (enhanced with request IDs)
const morganFormat = NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim(), { source: "morgan" })
  }
}));

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Input sanitization
app.use(sanitizeRequestBody);

// CORS (credentials + allowlist)
const allowlist = (FRONT_END_URL || "").split(",").map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin(origin, cb) {
    // allow same-origin (server-to-server) and explicit allowlist
    if (!origin || allowlist.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));
// Preflight for all routes
app.options("*", cors(corsOptions));

// Helmet (sane defaults). If you serve a static login page that uses external CDNs,
// add a CSP below with those sources.
app.use(helmet());
// Optional stricter CSP for your static page only—uncomment and customize if needed.
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'"], // add CDNs if your HTML needs them
//       objectSrc: ["'none'"],
//     },
//   })
// );

// rate limiting AFTER trust proxy/CORS/cookies
app.use(rateLimiter);

// static (only if you really want to serve the login page from the API host)
app.use(express.static("public"));

/* ---------- mount routes ---------- */
app.use("/api/v1/auth", authRoutes(pool));
app.use("/api/v1/user", userRoutes(pool));
app.use("/api/v1/restaurant", restaurantRoutes(pool));         // includes /owner + /owner/overview
app.use("/api/v1/testimonials", testimonialRoutes(pool));
app.use("/api/v1/reservations", reservationRoutes(pool));
app.use("/api/v1/coupons", couponsRoutes(pool));
app.use("/api/v1/owner", ownerRoutes(pool));
app.use("/api/v1/admin", adminRoutes(pool));
app.use("/api/v1/menuItems", menuItemsRoutes(pool));
app.use("/api/v1/specialMenus", specialMenusRoutes(pool));
app.use("/api/v1/special-menu-items", specialMenuItemsRoutes(pool));

/* ---------- utility routes ---------- */
// Health check with database connectivity test
app.get("/healthz", async (req, res) => {
  try {
    // Test database connectivity
    await pool.query("SELECT 1");
    res.status(200).json({ 
      ok: true, 
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ 
      ok: false, 
      database: "disconnected",
      error: "Database connection failed",
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static login page (optional)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "loginPage.html"));
});

/* ---------- 404 + error handling ---------- */
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not Found" });
  }
  next();
});

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use((err, req, res, next) => {
  // Capture error in Sentry
  if (process.env.SENTRY_DSN) {
    const { captureException } = require("./utils/sentry");
    captureException(err, {
      request: {
        method: req.method,
        path: req.path,
        headers: req.headers,
        query: req.query,
      },
      user: req.user || {},
    });
  }

  // Log error with request context
  logger.error("Unhandled error", {
    requestId: req.id,
    error: err.message,
    stack: NODE_ENV !== "production" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Don't leak internals to clients in production
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    requestId: req.id,
    ...(NODE_ENV !== "production" && { message: err.message }),
  });
});

/* ---------- start ---------- */
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: NODE_ENV,
    port: PORT,
  });
});
