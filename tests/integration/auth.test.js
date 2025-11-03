/**
 * Integration Tests for Authentication
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase } = require("../helpers/dbTestHelpers");
const { generateTestToken } = require("../helpers/testHelpers");

describe("Authentication API", () => {
  let app;
  let pool;

  beforeAll(async () => {
    pool = createTestPool();
    app = createApp(pool);
    await cleanDatabase(pool);
  });

  afterAll(async () => {
    await cleanDatabase(pool);
    await pool.end();
  });

  describe("POST /api/v1/user/register", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
          email: "testuser@example.com",
          password: "testpassword123",
          role: "customer",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
    });

    it("should return 400 for invalid input", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "AB", // Too short
          email: "invalid-email",
          password: "123", // Too short
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/user/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/user/login")
        .send({
          email: "testuser@example.com",
          password: "testpassword123",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 for invalid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/user/login")
        .send({
          email: "testuser@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /healthz", () => {
    it("should return 200 when server is healthy", async () => {
      const response = await request(app).get("/healthz");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("ok", true);
      expect(response.body).toHaveProperty("database", "connected");
    });
  });
});

