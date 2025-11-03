/**
 * Jest Configuration
 */
module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "utils/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/?(*.)+(spec|test).js",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};

