/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 */

const requiredEnvVars = {
  // JWT Configuration
  JWT_SECRET: {
    required: true,
    minLength: 32,
    description: "JWT secret key for token signing (minimum 32 characters)"
  },

  // Database Configuration
  PGHOST: {
    required: true,
    description: "PostgreSQL host address"
  },
  PGDATABASE: {
    required: true,
    description: "PostgreSQL database name"
  },
  PGUSER: {
    required: true,
    description: "PostgreSQL username"
  },
  PGPASSWORD: {
    required: true,
    description: "PostgreSQL password"
  },

  // OAuth Configuration
  GOOGLE_CLIENT_ID: {
    required: true,
    description: "Google OAuth client ID"
  },
  GOOGLE_CLIENT_SECRET: {
    required: true,
    description: "Google OAuth client secret"
  },
  GOOGLE_CALLBACK_URL: {
    required: true,
    description: "Google OAuth callback URL"
  },
  FACEBOOK_CLIENT_ID: {
    required: true,
    description: "Facebook OAuth app ID"
  },
  FACEBOOK_CLIENT_SECRET: {
    required: true,
    description: "Facebook OAuth app secret"
  },
  FACEBOOK_CALLBACK_URL: {
    required: true,
    description: "Facebook OAuth callback URL"
  },

  // Email Configuration
  EMAIL_USER: {
    required: true,
    description: "Email service username (Gmail SMTP)"
  },
  EMAIL_PASS: {
    required: true,
    description: "Email service password or app password"
  },

  // Application Configuration
  NODE_ENV: {
    required: false,
    default: "development",
    description: "Application environment (development, production, test)"
  },
  FRONT_END_URL: {
    required: true,
    description: "Frontend application URL for CORS and redirects"
  },
  PORT: {
    required: false,
    default: "5000",
    description: "Server port number (Note: code uses envPORT, but this can be set as PORT)"
  },
  envPORT: {
    required: false,
    default: "5000",
    description: "Server port number (alternative to PORT)"
  },
  JWT_EXPIRES_IN: {
    required: false,
    default: "1d",
    description: "JWT token expiration time"
  }
};

/**
 * Validates all required environment variables
 * @throws {Error} If any required variable is missing or invalid
 */
const validateEnv = () => {
  const missing = [];
  const invalid = [];

  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];

    // Check if required variable is missing
    if (config.required && !value) {
      missing.push({
        name: varName,
        description: config.description
      });
      continue;
    }

    // Use default value if provided and variable is missing
    if (!value && config.default) {
      process.env[varName] = config.default;
      continue;
    }

    // Validate minimum length if specified
    if (value && config.minLength && value.length < config.minLength) {
      invalid.push({
        name: varName,
        description: config.description,
        reason: `Must be at least ${config.minLength} characters`
      });
    }
  }

  // Report missing variables
  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:\n");
    missing.forEach(({ name, description }) => {
      console.error(`  - ${name}: ${description}`);
    });
    console.error("\nPlease set these variables in your .env file.\n");
    process.exit(1);
  }

  // Report invalid variables
  if (invalid.length > 0) {
    console.error("\n⚠️  Invalid environment variables:\n");
    invalid.forEach(({ name, description, reason }) => {
      console.error(`  - ${name}: ${description}`);
      console.error(`    Reason: ${reason}\n`);
    });
    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully");
};

module.exports = { validateEnv };

