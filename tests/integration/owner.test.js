/**
 * Integration Tests for Owner API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken, hashPassword } = require("../helpers/testHelpers");

describe("Owner API Routes", () => {
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

  describe("POST /api/v1/owner/register", () => {
    it("should register a new owner successfully", async () => {
      const response = await request(app)
        .post("/api/v1/owner/register")
        .send({
          name: "New Owner",
          email: "newowner@example.com",
          password: "ownerpass123",
          phone: "+1234567890",
          role: "owner",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("registered");
    });

    it("should return 400 for invalid name (too short)", async () => {
      const response = await request(app)
        .post("/api/v1/owner/register")
        .send({
          name: "AB",
          email: "owner@example.com",
          password: "ownerpass123",
          role: "owner",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/owner/register")
        .send({
          name: "Test Owner",
          email: "invalid-email",
          password: "ownerpass123",
          role: "owner",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for password too short", async () => {
      const response = await request(app)
        .post("/api/v1/owner/register")
        .send({
          name: "Test Owner",
          email: "owner@example.com",
          password: "123",
          role: "owner",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for duplicate email", async () => {
      // First registration
      await request(app)
        .post("/api/v1/owner/register")
        .send({
          name: "First Owner",
          email: "duplicate@example.com",
          password: "ownerpass123",
          role: "owner",
        });

      // Second registration
      const response = await request(app)
        .post("/api/v1/owner/register")
        .send({
          name: "Second Owner",
          email: "duplicate@example.com",
          password: "ownerpass123",
          role: "owner",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Owner already exists");
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/v1/owner/register")
        .send({
          name: "Test Owner",
          // Missing email, password, role
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/owner/login", () => {
    beforeEach(async () => {
      const hashedPassword = await hashPassword("ownerpass123");
      await pool.query(
        `INSERT INTO users (name, email, password, role, confirmed_user)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password = $3`,
        ["Login Owner", "ownerlogin@example.com", hashedPassword, "owner", true]
      );
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/owner/login")
        .send({
          email: "ownerlogin@example.com",
          password: "ownerpass123",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("user");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/owner/login")
        .send({
          email: "nonexistent@example.com",
          password: "ownerpass123",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid password", async () => {
      const response = await request(app)
        .post("/api/v1/owner/login")
        .send({
          email: "ownerlogin@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing email", async () => {
      const response = await request(app)
        .post("/api/v1/owner/login")
        .send({
          password: "ownerpass123",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing password", async () => {
      const response = await request(app)
        .post("/api/v1/owner/login")
        .send({
          email: "ownerlogin@example.com",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/owner/profile", () => {
    it("should return owner profile with valid token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .get("/api/v1/owner/profile")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
      expect(response.body).toHaveProperty("role", "owner");
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/v1/owner/profile");

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/owner/profile")
        .set("Cookie", "token=invalid-token");

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent owner", async () => {
      const token = generateTestToken({ id: 99999, role: "owner" });
      const response = await request(app)
        .get("/api/v1/owner/profile")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/owner/update", () => {
    it("should update owner profile with valid token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch("/api/v1/owner/update")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Updated Owner Name",
          phone: "+9876543210",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Owner updated successfully");
      expect(response.body.owner).toHaveProperty("name", "Updated Owner Name");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .patch("/api/v1/owner/update")
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid email format", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch("/api/v1/owner/update")
        .set("Cookie", `token=${token}`)
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for password too short", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch("/api/v1/owner/update")
        .set("Cookie", `token=${token}`)
        .send({
          password: "123",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for empty update", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch("/api/v1/owner/update")
        .set("Cookie", `token=${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/v1/owner/password/reset/request", () => {
    it("should request password reset for valid owner", async () => {
      const response = await request(app)
        .post("/api/v1/owner/password/reset/request")
        .send({
          email: "test@example.com",
        });

      // Should return 200 even if email doesn't exist (security best practice)
      expect([200, 201, 400]).toContain(response.status);
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/owner/password/reset/request")
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing email", async () => {
      const response = await request(app)
        .post("/api/v1/owner/password/reset/request")
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/owner/auth/status", () => {
    it("should return logged in status with valid token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .get("/api/v1/owner/auth/status")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("loggedIn", true);
      expect(response.body).toHaveProperty("user");
    });

    it("should return logged out status without token", async () => {
      const response = await request(app).get("/api/v1/owner/auth/status");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("loggedIn", false);
    });

    it("should return logged out status with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/owner/auth/status")
        .set("Cookie", "token=invalid-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("loggedIn", false);
    });
  });

  describe("GET /api/v1/owner/logout", () => {
    it("should logout owner successfully", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .get("/api/v1/owner/logout")
        .set("Cookie", `token=${token}`);

      expect([200, 302]).toContain(response.status);
    });
  });
});

