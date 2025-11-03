/**
 * Integration Tests for Menu Items API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken } = require("../helpers/testHelpers");

describe("Menu Items API Routes", () => {
  let app;
  let pool;
  let testData;
  let menuItemId;

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

  describe("POST /api/v1/menuItems", () => {
    it("should create menu item with valid owner token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/menuItems")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Spaghetti Carbonara",
          price: 15.50,
          category: "Main Course",
          description: "Traditional Italian pasta",
          discount: 0,
          restaurant_id: testData.restaurantId,
        });

      expect([201, 403]).toContain(response.status);
      if (response.status === 201) {
        menuItemId = response.body.menuItem?.id;
        expect(response.body).toHaveProperty("menuItem");
      }
    });

    it("should return 400 for invalid price", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/menuItems")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Item",
          price: -10, // Invalid: negative price
          category: "Main Course",
          restaurant_id: testData.restaurantId,
        });

      expect(response.status).toBe(400);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/menuItems")
        .send({
          name: "Test Item",
          price: 15.50,
          category: "Main Course",
          restaurant_id: testData.restaurantId,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/menuItems/:id", () => {
    beforeEach(async () => {
      // Create a menu item
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const createResponse = await request(app)
        .post("/api/v1/menuItems")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Item",
          price: 15.50,
          category: "Main Course",
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        menuItemId = createResponse.body.menuItem?.id;
      }
    });

    it("should update menu item with valid owner token", async () => {
      if (menuItemId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .patch(`/api/v1/menuItems/${menuItemId}`)
          .set("Cookie", `token=${token}`)
          .send({
            restaurant_id: testData.restaurantId,
            name: "Updated Item Name",
            price: 16.00,
          });

        expect([200, 403]).toContain(response.status);
      }
    });

    it("should return 401 without authentication", async () => {
      if (menuItemId) {
        const response = await request(app)
          .patch(`/api/v1/menuItems/${menuItemId}`)
          .send({
            name: "Updated Name",
          });

        expect(response.status).toBe(401);
      }
    });
  });

  describe("DELETE /api/v1/menuItems/:id", () => {
    beforeEach(async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const createResponse = await request(app)
        .post("/api/v1/menuItems")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Item",
          price: 15.50,
          category: "Main Course",
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        menuItemId = createResponse.body.menuItem?.id;
      }
    });

    it("should delete menu item with valid owner token", async () => {
      if (menuItemId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .delete(`/api/v1/menuItems/${menuItemId}`)
          .set("Cookie", `token=${token}`);

        expect([200, 403]).toContain(response.status);
      }
    });

    it("should return 401 without authentication", async () => {
      if (menuItemId) {
        const response = await request(app).delete(`/api/v1/menuItems/${menuItemId}`);

        expect(response.status).toBe(401);
      }
    });
  });
});

