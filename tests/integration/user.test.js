/**
 * Integration Tests for User API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData, withTransaction } = require("../helpers/dbTestHelpers");
const { generateTestToken, createTestUser, hashPassword } = require("../helpers/testHelpers");

describe("User API Routes", () => {
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

  describe("POST /api/v1/user/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "New User",
          email: "newuser@example.com",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Registration successful");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email", "newuser@example.com");
      expect(response.body.user).toHaveProperty("role", "customer");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 for invalid name (too short)", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "AB",
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for password too short", async () => {
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "123",
          role: "customer",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for duplicate email", async () => {
      // First registration
      await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "First User",
          email: "duplicate@example.com",
          password: "password123",
          role: "customer",
        });

      // Second registration with same email
      const response = await request(app)
        .post("/api/v1/user/register")
        .send({
          name: "Second User",
          email: "duplicate@example.com",
          password: "password123",
          role: "customer",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "User already exists");
    });
  });

  describe("POST /api/v1/user/login", () => {
    beforeEach(async () => {
      const hashedPassword = await hashPassword("password123");
      await pool.query(
        `INSERT INTO users (name, email, password, role, confirmed_user)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password = $3`,
        ["Login Test User", "login@example.com", hashedPassword, "customer", true]
      );
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/user/login")
        .send({
          email: "login@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("user");
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/user/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid password", async () => {
      const response = await request(app)
        .post("/api/v1/user/login")
        .send({
          email: "login@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/user/profile", () => {
    it("should return user profile with valid token", async () => {
      const token = generateTestToken({ id: testData.userId });
      const response = await request(app)
        .get("/api/v1/user/profile")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
      expect(response.body).toHaveProperty("name");
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/v1/user/profile");

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/user/profile")
        .set("Cookie", "token=invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/user/update", () => {
    it("should update user profile with valid token", async () => {
      const token = generateTestToken({ id: testData.userId });
      const response = await request(app)
        .patch("/api/v1/user/update")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Updated Name",
          phone: "+9876543210",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "User updated successfully");
      expect(response.body.user).toHaveProperty("name", "Updated Name");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .patch("/api/v1/user/update")
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/user/points", () => {
    it("should return user points with valid token", async () => {
      const token = generateTestToken({ id: testData.userId });
      const response = await request(app)
        .get("/api/v1/user/points")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user_id");
      expect(response.body).toHaveProperty("loyalty_points");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/v1/user/points");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/user/favorites", () => {
    it("should return favorites list with valid token", async () => {
      // Add a favorite first
      const token = generateTestToken({ id: testData.userId });
      
      await request(app)
        .post("/api/v1/user/favorites/toggle")
        .set("Cookie", `token=${token}`)
        .send({ restaurant_id: testData.restaurantId });

      const response = await request(app)
        .get("/api/v1/user/favorites")
        .set("Cookie", `token=${token}`)
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("favoriteRestaurants");
      expect(response.body).toHaveProperty("Pagination");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/v1/user/favorites");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/user/favorites/toggle", () => {
    it("should add restaurant to favorites", async () => {
      const token = generateTestToken({ id: testData.userId });
      const response = await request(app)
        .post("/api/v1/user/favorites/toggle")
        .set("Cookie", `token=${token}`)
        .send({ restaurant_id: testData.restaurantId });

      expect([201, 200]).toContain(response.status);
      expect(response.body).toHaveProperty("added");
    });

    it("should return 400 for invalid restaurant_id", async () => {
      const token = generateTestToken({ id: testData.userId });
      const response = await request(app)
        .post("/api/v1/user/favorites/toggle")
        .set("Cookie", `token=${token}`)
        .send({ restaurant_id: 99999 });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/user/password/reset/request", () => {
    it("should send password reset email for valid user", async () => {
      const response = await request(app)
        .post("/api/v1/user/password/reset/request")
        .send({
          email: "test@example.com",
        });

      // Should return 200 even if email doesn't exist (security best practice)
      expect([200, 201]).toContain(response.status);
    });
  });

  describe("GET /api/v1/user/logout", () => {
    it("should logout user successfully", async () => {
      const token = generateTestToken();
      const response = await request(app)
        .get("/api/v1/user/logout")
        .set("Cookie", `token=${token}`);

      expect([200, 302]).toContain(response.status);
    });
  });
});

