// server.js
require("dotenv").config();

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

/* ---------- core middleware ---------- */
app.set("trust proxy", 1); // needed for secure cookies behind proxies

app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

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
// Health check
app.get("/healthz", (req, res) => res.status(200).json({ ok: true }));

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

app.use((err, req, res, next) => {
  // helpful logging; don't leak internals to clients
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------- start ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
