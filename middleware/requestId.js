/**
 * Request ID Middleware
 * Generates and attaches a unique request ID to each request for distributed tracing
 */
const crypto = require("crypto");

const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from header or generate new one
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  
  // Attach to request object
  req.id = requestId;
  
  // Add to response header for client correlation
  res.setHeader("X-Request-ID", requestId);
  
  next();
};

module.exports = requestIdMiddleware;

