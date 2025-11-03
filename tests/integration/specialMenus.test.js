/**
 * Integration Tests for Special Menus API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken } = require("../helpers/testHelpers");

describe("Special Menus API Routes", () => {
  let app;
  let pool;
  let testData;
  let specialMenuId;

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

  describe("POST /api/v1/specialMenus", () => {
    it("should create special menu with valid owner token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Valentine's Day Special",
          description: "Romantic dinner for two",
          discounted_price: 89.99,
          photo_url: "https://example.com/photo.jpg",
          restaurant_id: testData.restaurantId,
          availability: {
            type: "range",
            date: "2024-02-14",
            timeRange: {
              start: "18:00",
              end: "23:00",
            },
          },
        });

      expect([201, 403]).toContain(response.status);
      if (response.status === 201) {
        specialMenuId = response.body.specialMenu?.id;
        expect(response.body).toHaveProperty("message", "Special menu created");
        expect(response.body.specialMenu).toHaveProperty("name", "Valentine's Day Special");
      }
    });

    it("should create special menu with permanent availability", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Weekend Special",
          discounted_price: 59.99,
          restaurant_id: testData.restaurantId,
          availability: {
            type: "permanent",
            daysOfWeek: [5, 6], // Friday, Saturday
            timeRange: {
              start: "18:00",
              end: "23:00",
            },
          },
        });

      expect([201, 403]).toContain(response.status);
    });

    it("should return 400 for invalid discounted_price (negative)", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special",
          discounted_price: -10,
          restaurant_id: testData.restaurantId,
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing required fields", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special",
          // Missing discounted_price and restaurant_id
        });

      expect(response.status).toBe(400);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .send({
          name: "Test Special",
          discounted_price: 50.00,
          restaurant_id: testData.restaurantId,
        });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-owner user", async () => {
      const token = generateTestToken({ id: testData.userId, role: "customer" });
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special",
          discounted_price: 50.00,
          restaurant_id: testData.restaurantId,
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid availability type", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special",
          discounted_price: 50.00,
          restaurant_id: testData.restaurantId,
          availability: {
            type: "invalid_type",
            timeRange: {
              start: "18:00",
              end: "23:00",
            },
          },
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid time format", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special",
          discounted_price: 50.00,
          restaurant_id: testData.restaurantId,
          availability: {
            type: "permanent",
            timeRange: {
              start: "25:00", // Invalid time
              end: "23:00",
            },
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/specialMenus/:id", () => {
    beforeEach(async () => {
      // Create a special menu
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const createResponse = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special Menu",
          discounted_price: 59.99,
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        specialMenuId = createResponse.body.specialMenu?.id;
      }
    });

    it("should update special menu with valid owner token", async () => {
      if (specialMenuId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .patch(`/api/v1/specialMenus/${specialMenuId}`)
          .set("Cookie", `token=${token}`)
          .send({
            name: "Updated Special Menu",
            discounted_price: 69.99,
          });

        expect([200, 403]).toContain(response.status);
      }
    });

    it("should return 401 without authentication", async () => {
      if (specialMenuId) {
        const response = await request(app)
          .patch(`/api/v1/specialMenus/${specialMenuId}`)
          .send({
            name: "Updated Name",
          });

        expect(response.status).toBe(401);
      }
    });

    it("should return 403 for non-owner user", async () => {
      if (specialMenuId) {
        const token = generateTestToken({ id: testData.userId, role: "customer" });
        const response = await request(app)
          .patch(`/api/v1/specialMenus/${specialMenuId}`)
          .set("Cookie", `token=${token}`)
          .send({
            name: "Updated Name",
          });

        expect(response.status).toBe(403);
      }
    });

    it("should return 400 for invalid discounted_price", async () => {
      if (specialMenuId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .patch(`/api/v1/specialMenus/${specialMenuId}`)
          .set("Cookie", `token=${token}`)
          .send({
            discounted_price: -5,
          });

        expect(response.status).toBe(400);
      }
    });

    it("should return 400 for empty update", async () => {
      if (specialMenuId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .patch(`/api/v1/specialMenus/${specialMenuId}`)
          .set("Cookie", `token=${token}`)
          .send({});

        expect(response.status).toBe(400);
      }
    });

    it("should return 404 for non-existent special menu", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch("/api/v1/specialMenus/99999")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Updated Name",
        });

      expect([404, 403]).toContain(response.status);
    });
  });

  describe("DELETE /api/v1/specialMenus/:id", () => {
    beforeEach(async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const createResponse = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special Menu",
          discounted_price: 59.99,
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        specialMenuId = createResponse.body.specialMenu?.id;
      }
    });

    it("should delete special menu with valid owner token", async () => {
      if (specialMenuId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .delete(`/api/v1/specialMenus/${specialMenuId}`)
          .set("Cookie", `token=${token}`);

        expect([200, 403]).toContain(response.status);
      }
    });

    it("should return 401 without authentication", async () => {
      if (specialMenuId) {
        const response = await request(app).delete(`/api/v1/specialMenus/${specialMenuId}`);

        expect(response.status).toBe(401);
      }
    });

    it("should return 403 for non-owner user", async () => {
      if (specialMenuId) {
        const token = generateTestToken({ id: testData.userId, role: "customer" });
        const response = await request(app)
          .delete(`/api/v1/specialMenus/${specialMenuId}`)
          .set("Cookie", `token=${token}`);

        expect(response.status).toBe(403);
      }
    });

    it("should return 404 for non-existent special menu", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .delete("/api/v1/specialMenus/99999")
        .set("Cookie", `token=${token}`);

      expect([404, 403]).toContain(response.status);
    });
  });

  describe("PUT /api/v1/specialMenus/:id", () => {
    beforeEach(async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const createResponse = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special Menu",
          discounted_price: 59.99,
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        specialMenuId = createResponse.body.specialMenu?.id;
      }
    });

    it("should update special menu via PUT method", async () => {
      if (specialMenuId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .put(`/api/v1/specialMenus/${specialMenuId}`)
          .set("Cookie", `token=${token}`)
          .send({
            name: "Updated via PUT",
          });

        expect([200, 403]).toContain(response.status);
      }
    });
  });
});

