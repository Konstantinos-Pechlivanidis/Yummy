/**
 * Input Sanitization Utilities
 * Sanitizes user-generated content to prevent XSS and injection attacks
 */
const createDOMPurify = require("isomorphic-dompurify");
const DOMPurify = createDOMPurify();

/**
 * Sanitize HTML content
 * @param {string} dirty - Unsanitized HTML string
 * @param {Object} options - DOMPurify options
 * @returns {string} Sanitized HTML string
 */
const sanitizeHTML = (dirty, options = {}) => {
  if (!dirty || typeof dirty !== "string") return "";
  
  const defaultOptions = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  };
  
  return DOMPurify.sanitize(dirty, { ...defaultOptions, ...options });
};

/**
 * Sanitize plain text (removes HTML and special characters)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized plain text
 */
const sanitizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, "");
  
  // Remove potentially dangerous characters but keep basic punctuation
  sanitized = sanitized.replace(/[<>\"'`]/g, "");
  
  return sanitized.trim();
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  
  // Remove any whitespace
  email = email.trim();
  
  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "";
  
  // Remove potentially dangerous characters
  return email.replace(/[<>\"'`]/g, "");
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone number
 */
const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== "string") return "";
  
  // Remove all non-digit characters except +, -, spaces, and parentheses
  return phone.replace(/[^\d\+\-\(\)\s]/g, "").trim();
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Function} sanitizer - Sanitizer function to apply
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj, sanitizer = sanitizeText) => {
  if (!obj || typeof obj !== "object") return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sanitizer));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Sanitize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    // Sanitize string fields
    const fieldsToSanitize = [
      "name", "email", "phone", "description", "notes", 
      "reservation_notes", "cancellation_reason"
    ];
    
    fieldsToSanitize.forEach(field => {
      if (req.body[field] && typeof req.body[field] === "string") {
        if (field === "email") {
          req.body[field] = sanitizeEmail(req.body[field]);
        } else if (field === "phone") {
          req.body[field] = sanitizePhone(req.body[field]);
        } else {
          req.body[field] = sanitizeText(req.body[field]);
        }
      }
    });
    
    // Recursively sanitize nested objects
    req.body = sanitizeObject(req.body, sanitizeText);
  }
  
  next();
};

module.exports = {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
  sanitizeRequestBody,
};

