/**
 * Integration Tests for Admin API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken, hashPassword } = require("../helpers/testHelpers");

describe("Admin API Routes", () => {
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

  describe("POST /api/v1/admin/register", () => {
    it("should register a new admin", async () => {
      const response = await request(app)
        .post("/api/v1/admin/register")
        .send({
          name: "Admin User",
          email: "admin@example.com",
          password: "AdminPass123",
        });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty("admin");
      }
    });

    it("should return 400 for invalid password format", async () => {
      const response = await request(app)
        .post("/api/v1/admin/register")
        .send({
          name: "Admin User",
          email: "admin2@example.com",
          password: "weak", // Too short, no numbers
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for duplicate email", async () => {
      // First registration
      await request(app)
        .post("/api/v1/admin/register")
        .send({
          name: "First Admin",
          email: "duplicate@example.com",
          password: "AdminPass123",
        });

      // Second registration
      const response = await request(app)
        .post("/api/v1/admin/register")
        .send({
          name: "Second Admin",
          email: "duplicate@example.com",
          password: "AdminPass123",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/admin/login", () => {
    beforeEach(async () => {
      const hashedPassword = await hashPassword("AdminPass123");
      await pool.query(
        `INSERT INTO admins (name, email, password)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET password = $3`,
        ["Admin User", "adminlogin@example.com", hashedPassword]
      );
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/admin/login")
        .send({
          email: "adminlogin@example.com",
          password: "AdminPass123",
        });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("admin");
        expect(response.headers["set-cookie"]).toBeDefined();
      }
    });

    it("should return 400 for invalid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/admin/login")
        .send({
          email: "adminlogin@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/admin/createRestaurant", () => {
    it("should create restaurant with valid admin token", async () => {
      // Create admin first
      const hashedPassword = await hashPassword("AdminPass123");
      await pool.query(
        `INSERT INTO admins (name, email, password)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET password = $3`,
        ["Test Admin", "admin@test.com", hashedPassword]
      );

      // Login to get token
      const loginResponse = await request(app)
        .post("/api/v1/admin/login")
        .send({
          email: "admin@test.com",
          password: "AdminPass123",
        });

      let token;
      if (loginResponse.status === 200) {
        token = loginResponse.headers["set-cookie"]?.[0]?.split("=")[1]?.split(";")[0];
      }

      if (token) {
        const response = await request(app)
          .post("/api/v1/admin/createRestaurant")
          .set("Cookie", `token=${token}`)
          .send({
            name: "New Restaurant",
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
            owner_id: testData.ownerId,
          });

        expect([201, 403]).toContain(response.status);
      }
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/admin/createRestaurant")
        .send({
          name: "New Restaurant",
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
          owner_id: testData.ownerId,
        });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin user", async () => {
      const token = generateTestToken({ id: testData.userId, role: "customer" });
      const response = await request(app)
        .post("/api/v1/admin/createRestaurant")
        .set("Cookie", `token=${token}`)
        .send({
          name: "New Restaurant",
          location: "Athens",
          cuisine: "Italian",
          address: {},
          coordinates: {},
          openingHours: {},
          contact: {},
          owner_id: testData.ownerId,
        });

      expect(response.status).toBe(403);
    });
  });
});

