/**
 * Jest Test Setup
 * Configures test environment before running tests
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-minimum-32-characters-long-for-testing";
process.env.JWT_EXPIRES_IN = "1h";
process.env.FRONT_END_URL = "http://localhost:3000";
process.env.PGHOST = process.env.PGHOST || "localhost";
process.env.PGDATABASE = process.env.PGDATABASE || "yummy_test";
process.env.PGUSER = process.env.PGUSER || "postgres";
process.env.PGPASSWORD = process.env.PGPASSWORD || "postgres";

// Mock logger to avoid file system operations during tests
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  withRequest: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Increase timeout for integration tests
jest.setTimeout(10000);

