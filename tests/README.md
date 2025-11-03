# Testing Guide

## Overview

This directory contains comprehensive automated tests for the Yummy API backend. The test suite includes both unit tests for controllers/services and integration tests for all API endpoints.

## Test Structure

```
tests/
├── helpers/              # Test utilities and helpers
│   ├── testHelpers.js   # Mock objects, test data generators
│   ├── dbTestHelpers.js # Database utilities for tests
│   └── appFactory.js    # Express app factory for testing
├── integration/          # Integration tests for API routes
│   ├── auth.test.js
│   ├── user.test.js
│   ├── restaurant.test.js
│   ├── reservations.test.js
│   ├── coupons.test.js
│   ├── admin.test.js
│   ├── menuItems.test.js
│   ├── testimonials.test.js
│   └── health.test.js
└── unit/                # Unit tests for controllers/services
    ├── controllers/
    │   └── userController.test.js
    └── utils/
        └── jwtHelper.test.js
```

## Running Tests

### All Tests
```bash
npm test
```
Runs all tests with coverage reporting.

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```
Automatically re-runs tests when files change.

### Generate Test Checklist
```bash
npm run test:checklist
```
Generates a comprehensive test coverage report at `docs/TEST_CHECKLIST.md`.

## Test Coverage

### What Gets Tested

Each endpoint is tested for:

1. **Status Codes**: Correct HTTP status codes (200, 201, 400, 401, 403, 404, 500)
2. **Input Validation**: Proper validation of request bodies, params, and queries
3. **Error Handling**: Consistent error responses for invalid inputs
4. **Response Data**: Accurate response structure and data
5. **Authentication**: Proper authorization checks
6. **Edge Cases**: Boundary conditions and error scenarios

### Current Coverage

See `docs/TEST_CHECKLIST.md` for detailed coverage report.

**Major Endpoints Covered:**
- ✅ User registration and authentication
- ✅ User profile management
- ✅ Restaurant CRUD operations
- ✅ Reservations management
- ✅ Coupons system
- ✅ Admin operations
- ✅ Menu items management
- ✅ Health checks

## Test Helpers

### Database Helpers

```javascript
const { createTestPool, cleanDatabase, seedTestData } = require("./helpers/dbTestHelpers");

// Create test database connection
const pool = createTestPool();

// Clean database between tests
await cleanDatabase(pool);

// Seed test data
const testData = await seedTestData(pool);
```

### Test Data Generators

```javascript
const { 
  createTestUser, 
  createTestRestaurant, 
  generateTestToken 
} = require("./helpers/testHelpers");

// Create test user data
const user = createTestUser({ email: "test@example.com" });

// Generate JWT token
const token = generateTestToken({ id: 1, role: "customer" });
```

### Mock Objects

```javascript
const { 
  createMockRequest, 
  createMockResponse, 
  createMockPool 
} = require("./helpers/testHelpers");

// Create mock Express request
const req = createMockRequest({ body: { name: "Test" } });

// Create mock Express response
const res = createMockResponse();

// Create mock database pool
const pool = createMockPool({ 
  "SELECT * FROM users": { rows: [user] } 
});
```

## Writing New Tests

### Integration Test Template

```javascript
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken } = require("../helpers/testHelpers");

describe("My API Routes", () => {
  let app;
  let pool;
  let testData;

  beforeAll(async () => {
    pool = createTestPool();
    app = createApp(pool);
    await cleanDatabase(pool);
    testData = await seedTestData(pool);
  });

  afterAll(async () => {
    await cleanDatabase(pool);
    await pool.end();
  });

  describe("POST /api/v1/my-endpoint", () => {
    it("should create resource successfully", async () => {
      const token = generateTestToken({ id: testData.userId });
      const response = await request(app)
        .post("/api/v1/my-endpoint")
        .set("Cookie", `token=${token}`)
        .send({ /* data */ });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });

    it("should return 400 for invalid input", async () => {
      const response = await request(app)
        .post("/api/v1/my-endpoint")
        .send({ /* invalid data */ });

      expect(response.status).toBe(400);
    });
  });
});
```

### Unit Test Template

```javascript
const controller = require("../../../controllers/myController");
const { createMockRequest, createMockResponse, createMockPool } = require("../../helpers/testHelpers");

describe("My Controller Unit Tests", () => {
  let mockPool;
  let mockRes;

  beforeEach(() => {
    mockPool = createMockPool();
    mockRes = createMockResponse();
  });

  it("should handle request correctly", async () => {
    const mockReq = createMockRequest({ body: { name: "Test" } });
    mockPool.setQueryResult("SELECT * FROM table", { rows: [] });

    await controller.myFunction(mockReq, mockRes, mockPool);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});
```

## Test Database Setup

Tests use a separate test database. Configure in `.env` or test environment:

```env
PGHOST=localhost
PGDATABASE=yummy_test
PGUSER=postgres
PGPASSWORD=postgres
```

**Note:** Tests will automatically clean the database between test runs to ensure isolation.

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Naming**: Use descriptive test names: `should return 401 for invalid token`
4. **Coverage**: Test both success and error cases
5. **Assertions**: Verify status codes, response structure, and data
6. **Mocking**: Mock external dependencies (email, OAuth, etc.)

## Continuous Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Via GitHub Actions (`.github/workflows/ci.yml`)

## Troubleshooting

### Tests Failing Due to Database

1. Ensure PostgreSQL is running
2. Check test database exists: `yummy_test`
3. Verify database credentials in test environment
4. Check for hanging connections

### Authentication Tests Failing

1. Verify JWT_SECRET is set in test environment
2. Check token generation helper is working
3. Ensure cookie handling is enabled in supertest

### Port Conflicts

If you see port conflict errors, tests use the test database but don't start a server. This shouldn't be an issue.

## Contributing

When adding new endpoints:

1. Write integration tests first
2. Add unit tests for complex controller logic
3. Update test checklist: `npm run test:checklist`
4. Ensure all tests pass before committing
5. Aim for 80%+ code coverage

---

**Last Updated:** $(date)
**Test Coverage:** See `docs/TEST_CHECKLIST.md`

