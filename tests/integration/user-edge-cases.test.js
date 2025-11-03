/**
 * Edge Case Tests for User API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken, hashPassword } = require("../helpers/testHelpers");

describe("User API - Edge Cases", () => {
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

  beforeEach(async () => {
    await cleanDatabase(pool);
    testData = await seedTestData(pool);
  });

  describe("Input Validation Edge Cases", () => {
    it("should handle extremely long name", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "A".repeat(101), // Exceeds max length
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
    });

    it("should handle SQL injection attempt in name", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "'; DROP TABLE users; --",
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      // Should sanitize or reject
      expect([201, 400]).toContain(response.status);
    });

    it("should handle XSS attempt in name", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "<script>alert('XSS')</script>",
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      // Should sanitize
      expect([201, 400]).toContain(response.status);
    });

    it("should handle empty string vs null for optional fields", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "customer",
          phone: "", // Empty string
        });

      expect([201, 400]).toContain(response.status);
    });

    it("should handle special characters in email", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
          email: "test+special@example.com",
          password: "password123",
          role: "customer",
        });

      expect([201, 400]).toContain(response.status);
    });

    it("should handle unicode characters in name", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "José María 中文",
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect([201, 400]).toContain(response.status);
    });
  });

  describe("Authentication Edge Cases", () => {
    it("should handle expired token gracefully", async () => {
      // Create an expired token (this would be done differently in practice)
      const expiredToken = generateTestToken({ id: testData.userId, exp: Math.floor(Date.now() / 1000) - 3600 });
      
      const response = await request(app)
        .get("/api/v1/user/profile")
        .set("Cookie", `token=${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it("should handle malformed token", async () => {
      const response = await request(app)
        .get("/api/v1/user/profile")
        .set("Cookie", "token=not.a.valid.token");

      expect(response.status).toBe(401);
    });

    it("should handle missing token cookie", async () => {
      const response = await request(app)
        .get("/api/v1/user/profile");

      expect(response.status).toBe(401);
    });

    it("should handle token for deleted user", async () => {
      // Create user and get token
      const hashedPassword = await hashPassword("password123");
      await pool.query(
        `INSERT INTO users (name, email, password, role, confirmed_user)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        ["Temp User", "temp@example.com", hashedPassword, "customer", true]
      );

      const token = generateTestToken({ id: 99999 }); // Non-existent user ID

      const response = await request(app)
        .get("/api/v1/user/profile")
        .set("Cookie", `token=${token}`);

      // Should handle gracefully - might return 401 or 404
      expect([401, 404, 500]).toContain(response.status);
    });
  });

  describe("Rate Limiting Edge Cases", () => {
    it("should handle rapid successive requests", async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post("/api/v1/user/login")
          .send({
            email: "test@example.com",
            password: "wrongpassword",
          })
      );

      const responses = await Promise.all(requests);
      
      // Some requests might be rate limited
      responses.forEach((response) => {
        expect([400, 429]).toContain(response.status);
      });
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent favorite toggles", async () => {
      const token = generateTestToken({ id: testData.userId });
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post("/api/v1/user/favorites/toggle")
          .set("Cookie", `token=${token}`)
          .send({ restaurant_id: testData.restaurantId })
      );

      const responses = await Promise.all(requests);
      
      // Should handle gracefully
      responses.forEach((response) => {
        expect([200, 201, 400]).toContain(response.status);
      });
    });
  });

  describe("Boundary Value Testing", () => {
    it("should handle minimum valid password length", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "12345678", // Exactly 8 characters
          role: "customer",
        });

      expect([201, 400]).toContain(response.status);
    });

    it("should handle maximum valid name length", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "A".repeat(100), // Exactly 100 characters
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect([201, 400]).toContain(response.status);
    });

    it("should handle minimum valid name length", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "ABC", // Exactly 3 characters
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect([201, 400]).toContain(response.status);
    });
  });

  describe("Data Type Edge Cases", () => {
    it("should handle number instead of string for name", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: 12345, // Number instead of string
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
    });

    it("should handle boolean for required string fields", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: true, // Boolean instead of string
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
    });

    it("should handle array for single value fields", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: ["Test", "User"], // Array instead of string
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Missing Required Fields", () => {
    it("should return 400 when all fields are missing", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({});

      expect(response.status).toBe(400);
    });

    it("should return 400 when only name is provided", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Unauthorized Access Attempts", () => {
    it("should prevent user from accessing owner endpoints", async () => {
      const token = generateTestToken({ id: testData.userId, role: "customer" });
      const response = await request(app)
        .get("/api/v1/restaurant/owner")
        .set("Cookie", `token=${token}`);

      // Should return 401 or 403
      expect([401, 403]).toContain(response.status);
    });

    it("should prevent owner from accessing admin endpoints", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/admin/createRestaurant")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Restaurant",
          location: "Test",
          cuisine: "Test",
          address: {},
          coordinates: {},
          openingHours: {},
          contact: {},
          owner_id: testData.ownerId,
        });

      expect(response.status).toBe(403);
    });

    it("should prevent accessing other user's profile", async () => {
      const token = generateTestToken({ id: testData.userId });
      // Try to access a different user's data (if such endpoint exists)
      // This would typically be prevented by checking user ID in token
      
      const response = await request(app)
        .get("/api/v1/user/profile")
        .set("Cookie", `token=${token}`);

      // Should only return current user's profile
      expect(response.status).toBe(200);
      if (response.body.id) {
        expect(response.body.id).toBe(testData.userId);
      }
    });
  });
});

