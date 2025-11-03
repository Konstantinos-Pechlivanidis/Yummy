/**
 * Structured Logging Configuration
 * Uses Winston for production-ready logging with multiple transports
 */
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { NODE_ENV } = process.env;

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, requestId, userId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    const requestIdStr = requestId ? `[${requestId}]` : "";
    const userIdStr = userId ? `[User:${userId}]` : "";
    return `${timestamp} ${level.toUpperCase()} ${requestIdStr} ${userIdStr} ${message} ${metaStr}`;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, requestId, userId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    const requestIdStr = requestId ? `[${requestId}]` : "";
    const userIdStr = userId ? `[User:${userId}]` : "";
    return `${timestamp} ${level} ${requestIdStr} ${userIdStr} ${message} ${metaStr}`;
  })
);

// File transports
const fileTransports = [
  // Error log file
  new DailyRotateFile({
    filename: "logs/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    level: "error",
    format: logFormat,
    maxSize: "20m",
    maxFiles: "14d",
    zippedArchive: true,
  }),
  // Combined log file
  new DailyRotateFile({
    filename: "logs/combined-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    format: logFormat,
    maxSize: "20m",
    maxFiles: "30d",
    zippedArchive: true,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "yummy-api" },
  transports: [
    ...fileTransports,
    // Console output in development
    ...(NODE_ENV !== "production"
      ? [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]
      : []),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: "logs/exceptions-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      format: logFormat,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: "logs/rejections-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      format: logFormat,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

/**
 * Helper to create logger with request context
 * @param {Object} req - Express request object
 * @returns {Object} Logger instance with request context
 */
logger.withRequest = (req) => {
  return {
    info: (message, meta = {}) => logger.info(message, { requestId: req.id, ...meta }),
    error: (message, meta = {}) => logger.error(message, { requestId: req.id, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { requestId: req.id, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { requestId: req.id, ...meta }),
  };
};

module.exports = logger;

