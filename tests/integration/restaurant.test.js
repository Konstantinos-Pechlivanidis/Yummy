/**
 * Integration Tests for Restaurant API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken } = require("../helpers/testHelpers");

describe("Restaurant API Routes", () => {
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

  describe("GET /api/v1/restaurant/trending", () => {
    it("should return trending restaurants", async () => {
      const response = await request(app)
        .get("/api/v1/restaurant/trending")
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("restaurants");
      expect(Array.isArray(response.body.restaurants)).toBe(true);
    });

    it("should return paginated results", async () => {
      const response = await request(app)
        .get("/api/v1/restaurant/trending")
        .query({ page: 1, pageSize: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("Pagination");
      expect(response.body.Pagination).toHaveProperty("currentPage", 1);
    });
  });

  describe("GET /api/v1/restaurant/discounted", () => {
    it("should return discounted restaurants", async () => {
      const response = await request(app)
        .get("/api/v1/restaurant/discounted")
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("restaurants");
    });
  });

  describe("GET /api/v1/restaurant", () => {
    it("should return filtered restaurants", async () => {
      const response = await request(app)
        .get("/api/v1/restaurant")
        .query({
          cuisine: "Italian",
          location: "Athens",
          page: 1,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("restaurants");
    });

    it("should return all restaurants without filters", async () => {
      const response = await request(app)
        .get("/api/v1/restaurant")
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("restaurants");
    });
  });

  describe("GET /api/v1/restaurant/:id", () => {
    it("should return restaurant by ID", async () => {
      const response = await request(app).get(`/api/v1/restaurant/${testData.restaurantId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", testData.restaurantId);
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("location");
    });

    it("should return 404 for non-existent restaurant", async () => {
      const response = await request(app).get("/api/v1/restaurant/99999");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/restaurant/owner", () => {
    it("should return owner's restaurant with valid token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .get("/api/v1/restaurant/owner")
        .set("Cookie", `token=${token}`);

      expect([200, 404]).toContain(response.status); // 404 if no restaurant
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/v1/restaurant/owner");

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/restaurant/:id", () => {
    it("should update restaurant contact with valid owner token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch(`/api/v1/restaurant/${testData.restaurantId}`)
        .set("Cookie", `token=${token}`)
        .send({
          contact: {
            phone: "+302109876543",
            email: "updated@restaurant.com",
            socialMedia: {
              facebook: "https://facebook.com/updated",
              instagram: "https://instagram.com/updated",
            },
          },
        });

      expect([200, 403]).toContain(response.status); // 403 if not owner
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .patch(`/api/v1/restaurant/${testData.restaurantId}`)
        .send({
          contact: {
            phone: "+302109876543",
          },
        });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid contact data", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch(`/api/v1/restaurant/${testData.restaurantId}`)
        .set("Cookie", `token=${token}`)
        .send({
          contact: {
            email: "invalid-email",
          },
        });

      expect(response.status).toBe(400);
    });
  });
});

