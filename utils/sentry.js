/**
 * Sentry Error Tracking Configuration
 * Initialize Sentry for error monitoring and performance tracking
 */
const Sentry = require("@sentry/node");
const { ProfilingIntegration } = require("@sentry/profiling-node");
const { NODE_ENV, SENTRY_DSN } = process.env;

let sentryInitialized = false;

/**
 * Initialize Sentry if DSN is provided
 */
const initSentry = (app) => {
  if (!SENTRY_DSN || NODE_ENV === "test") {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV || "development",
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Profiling integration (optional, requires @sentry/profiling-node)
      // new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,
    // Session Replay (optional)
    replaysSessionSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive information
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        if (event.request.data) {
          // Remove password fields
          if (event.request.data.password) {
            event.request.data.password = "[REDACTED]";
          }
        }
      }
      return event;
    },
  });

  sentryInitialized = true;
  console.log("Sentry initialized successfully");
};

/**
 * Capture exception
 */
const captureException = (error, context = {}) => {
  if (sentryInitialized) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  }
};

/**
 * Capture message
 */
const captureMessage = (message, level = "info", context = {}) => {
  if (sentryInitialized) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureMessage(message, level);
    });
  }
};

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  Sentry,
};

