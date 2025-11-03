/**
 * Async Handler Middleware
 * Wraps async route handlers to automatically catch errors
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler that catches errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;

