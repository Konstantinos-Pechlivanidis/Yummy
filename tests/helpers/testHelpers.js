/**
 * Test Helpers
 * Common utilities for testing
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-minimum-32-characters-long-for-testing";

/**
 * Generate a test JWT token
 */
function generateTestToken(payload = {}) {
  const defaultPayload = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "customer",
    confirmed_user: true,
    ...payload,
  };
  return jwt.sign(defaultPayload, JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Hash password for testing
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Create mock database pool
 */
function createMockPool(mockResults = {}) {
  const queryResults = {};
  const queryCalls = [];

  const pool = {
    query: jest.fn((query, params) => {
      queryCalls.push({ query, params });
      const result = queryResults[query] || mockResults[query] || { rows: [] };
      return Promise.resolve(typeof result === "function" ? result(params) : result);
    }),
    connect: jest.fn(() => {
      const client = {
        query: jest.fn((query, params) => {
          queryCalls.push({ query, params, client: true });
          const result = queryResults[query] || mockResults[query] || { rows: [] };
          return Promise.resolve(typeof result === "function" ? result(params) : result);
        }),
        release: jest.fn(),
      };
      return Promise.resolve(client);
    }),
    end: jest.fn(() => Promise.resolve()),
  };

  // Helper to set query results
  pool.setQueryResult = (query, result) => {
    queryResults[query] = result;
  };

  // Helper to get query calls
  pool.getQueryCalls = () => queryCalls;

  // Helper to reset
  pool.reset = () => {
    queryCalls.length = 0;
    Object.keys(queryResults).forEach((key) => delete queryResults[key]);
    jest.clearAllMocks();
  };

  return pool;
}

/**
 * Create mock request object
 */
function createMockRequest(options = {}) {
  const {
    body = {},
    params = {},
    query = {},
    cookies = {},
    headers = {},
    user = null,
  } = options;

  return {
    body,
    params,
    query,
    cookies,
    headers,
    user,
    id: headers["x-request-id"] || "test-request-id",
  };
}

/**
 * Create mock response object
 */
function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    statusCode: 200,
  };
  return res;
}

/**
 * Create test user data
 */
function createTestUser(overrides = {}) {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    phone: "+1234567890",
    role: "customer",
    confirmed_user: true,
    loyalty_points: 100,
    profile_image: null,
    ...overrides,
  };
}

/**
 * Create test owner data
 */
function createTestOwner(overrides = {}) {
  return {
    id: 2,
    name: "Test Owner",
    email: "owner@example.com",
    phone: "+1234567891",
    role: "owner",
    confirmed_user: true,
    ...overrides,
  };
}

/**
 * Create test admin data
 */
function createTestAdmin(overrides = {}) {
  return {
    id: 3,
    name: "Test Admin",
    email: "admin@example.com",
    role: "admin",
    ...overrides,
  };
}

/**
 * Create test restaurant data
 */
function createTestRestaurant(overrides = {}) {
  return {
    id: 1,
    name: "Test Restaurant",
    location: "Athens",
    cuisine: "Italian",
    address: {
      street: "Main Street",
      number: "123",
      postalCode: "10431",
      area: "City Center",
    },
    coordinates: {
      lat: 37.9838,
      lng: 23.7275,
    },
    openingHours: {
      open: "11:00",
      close: "23:00",
    },
    contact: {
      phone: "+302101234567",
      email: "restaurant@example.com",
      socialMedia: {
        facebook: "https://facebook.com/restaurant",
        instagram: "https://instagram.com/restaurant",
      },
    },
    owner_id: 2,
    rating: 4.5,
    total_reviews: 100,
    ...overrides,
  };
}

/**
 * Create test reservation data
 */
function createTestReservation(overrides = {}) {
  return {
    id: 1,
    user_id: 1,
    restaurant_id: 1,
    date: "2024-01-20",
    time: "19:00",
    guest_count: 4,
    status: "pending",
    special_menu_id: null,
    coupon_id: null,
    reservation_notes: null,
    ...overrides,
  };
}

/**
 * Create test coupon data
 */
function createTestCoupon(overrides = {}) {
  return {
    id: 1,
    description: "20% off on main course",
    discount_percentage: 20,
    required_points: 100,
    restaurant_id: 1,
    ...overrides,
  };
}

/**
 * Wait for async operations
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Expect error response
 */
function expectErrorResponse(response, statusCode, errorMessage = null) {
  expect(response.status).toBe(statusCode);
  if (errorMessage) {
    expect(response.body).toHaveProperty("error");
    expect(response.body.error || response.body.message).toContain(errorMessage);
  }
}

/**
 * Expect success response
 */
function expectSuccessResponse(response, statusCode = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toBeDefined();
}

module.exports = {
  generateTestToken,
  hashPassword,
  createMockPool,
  createMockRequest,
  createMockResponse,
  createTestUser,
  createTestOwner,
  createTestAdmin,
  createTestRestaurant,
  createTestReservation,
  createTestCoupon,
  sleep,
  expectErrorResponse,
  expectSuccessResponse,
};

