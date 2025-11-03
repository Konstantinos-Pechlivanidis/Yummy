/**
 * JWT Authentication Helper
 * Provides reusable functions for JWT token operations
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET, NODE_ENV, JWT_EXPIRES_IN = "1d" } = process.env;

/**
 * Generate a JWT token with consistent payload structure
 * @param {Object} user - User object with id, name, email, role, confirmed_user
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    confirmed_user: user.confirmed_user,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode JWT token from cookies
 * @param {Object} req - Express request object
 * @returns {Object|null} Decoded user payload or null
 */
const verifyTokenFromCookie = (req) => {
  const token = req.cookies.token;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Set JWT token in HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    path: "/",
    sameSite: "Lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

/**
 * Clear JWT token cookie
 * @param {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.clearCookie("token");
};

module.exports = {
  generateToken,
  verifyTokenFromCookie,
  setTokenCookie,
  clearTokenCookie,
};

