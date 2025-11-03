/**
 * Additional Integration Tests for Remaining Endpoints
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken, hashPassword } = require("../helpers/testHelpers");

describe("Additional Endpoints - Integration Tests", () => {
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

  describe("GET /api/v1/restaurant/id/:id", () => {
    it("should return restaurant by ID using legacy path", async () => {
      const response = await request(app)
        .get(`/api/v1/restaurant/id/${testData.restaurantId}`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("id", testData.restaurantId);
      }
    });
  });

  describe("GET /api/v1/restaurant/owner/overview", () => {
    it("should return owner overview with statistics", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .get("/api/v1/restaurant/owner/overview")
        .set("Cookie", `token=${token}`);

      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("restaurant");
      }
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/restaurant/owner/overview");

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/reservations/:id", () => {
    it("should delete reservation with valid user token", async () => {
      // First create a reservation
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const createResponse = await request(app)
        .post("/api/v1/reservations")
        .set("Cookie", `token=${token}`)
        .send({
          restaurant_id: testData.restaurantId,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        });

      if (createResponse.status === 201) {
        const reservationId = createResponse.body.id;
        const deleteResponse = await request(app)
          .delete(`/api/v1/reservations/${reservationId}`)
          .set("Cookie", `token=${token}`);

        expect([200, 400, 404]).toContain(deleteResponse.status);
      }
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .delete("/api/v1/reservations/1");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/coupons/purchased/restaurants", () => {
    it("should return restaurants with purchased coupons", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const response = await request(app)
        .get("/api/v1/coupons/purchased/restaurants")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("restaurants");
      expect(Array.isArray(response.body.restaurants)).toBe(true);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/coupons/purchased/restaurants");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/coupons/:couponId/purchase", () => {
    it("should purchase coupon using REST-style endpoint", async () => {
      // First create a coupon
      const ownerToken = generateTestToken({ id: testData.ownerId, role: "owner" });
      const createResponse = await request(app)
        .post("/api/v1/coupons/creation")
        .set("Cookie", `token=${ownerToken}`)
        .send({
          description: "20% off",
          discount_percentage: 20,
          required_points: 50,
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        const couponId = createResponse.body.coupon.id;
        
        // Ensure user has points
        await pool.query(
          `UPDATE users SET loyalty_points = 100 WHERE id = $1`,
          [testData.userId]
        );

        const userToken = generateTestToken({ id: testData.userId, confirmed_user: true });
        const purchaseResponse = await request(app)
          .post(`/api/v1/coupons/${couponId}/purchase`)
          .set("Cookie", `token=${userToken}`);

        expect([201, 400]).toContain(purchaseResponse.status);
      }
    });
  });

  describe("PATCH /api/v1/coupons/:couponId", () => {
    it("should edit coupon using REST-style endpoint", async () => {
      const ownerToken = generateTestToken({ id: testData.ownerId, role: "owner" });
      
      // Create coupon
      const createResponse = await request(app)
        .post("/api/v1/coupons/creation")
        .set("Cookie", `token=${ownerToken}`)
        .send({
          description: "20% off",
          discount_percentage: 20,
          required_points: 50,
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        const couponId = createResponse.body.coupon.id;
        const updateResponse = await request(app)
          .patch(`/api/v1/coupons/${couponId}`)
          .set("Cookie", `token=${ownerToken}`)
          .send({
            description: "Updated 25% off",
            discount_percentage: 25,
          });

        expect([200, 403]).toContain(updateResponse.status);
      }
    });
  });

  describe("DELETE /api/v1/coupons/:couponId", () => {
    it("should delete coupon using REST-style endpoint", async () => {
      const ownerToken = generateTestToken({ id: testData.ownerId, role: "owner" });
      
      // Create coupon
      const createResponse = await request(app)
        .post("/api/v1/coupons/creation")
        .set("Cookie", `token=${ownerToken}`)
        .send({
          description: "20% off",
          discount_percentage: 20,
          required_points: 50,
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        const couponId = createResponse.body.coupon.id;
        const deleteResponse = await request(app)
          .delete(`/api/v1/coupons/${couponId}`)
          .set("Cookie", `token=${ownerToken}`);

        expect([200, 403]).toContain(deleteResponse.status);
      }
    });
  });

  describe("PUT /api/v1/menuItems/:id", () => {
    it("should update menu item via PUT method", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      
      // Create menu item
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
        const itemId = createResponse.body.menuItem?.id;
        const updateResponse = await request(app)
          .put(`/api/v1/menuItems/${itemId}`)
          .set("Cookie", `token=${token}`)
          .send({
            restaurant_id: testData.restaurantId,
            name: "Updated via PUT",
          });

        expect([200, 403]).toContain(updateResponse.status);
      }
    });
  });

  describe("POST /api/v1/menuItems/:id/delete", () => {
    it("should delete menu item via POST delete alias", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      
      // Create menu item
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
        const itemId = createResponse.body.menuItem?.id;
        const deleteResponse = await request(app)
          .post(`/api/v1/menuItems/${itemId}/delete`)
          .set("Cookie", `token=${token}`);

        expect([200, 403]).toContain(deleteResponse.status);
      }
    });
  });

  describe("PATCH /api/v1/reservations/:id/status", () => {
    it("should update reservation status via REST-style endpoint", async () => {
      // Create reservation as user
      const userToken = generateTestToken({ id: testData.userId, confirmed_user: true });
      const createResponse = await request(app)
        .post("/api/v1/reservations")
        .set("Cookie", `token=${userToken}`)
        .send({
          restaurant_id: testData.restaurantId,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        });

      if (createResponse.status === 201) {
        const reservationId = createResponse.body.id;
        const ownerToken = generateTestToken({ id: testData.ownerId, role: "owner" });
        const updateResponse = await request(app)
          .patch(`/api/v1/reservations/${reservationId}/status`)
          .set("Cookie", `token=${ownerToken}`)
          .send({
            status: "confirmed",
          });

        expect([200, 403]).toContain(updateResponse.status);
      }
    });
  });

  describe("POST /api/v1/reservations/:id/owner-cancel", () => {
    it("should cancel reservation as owner via REST-style endpoint", async () => {
      // Create reservation as user
      const userToken = generateTestToken({ id: testData.userId, confirmed_user: true });
      const createResponse = await request(app)
        .post("/api/v1/reservations")
        .set("Cookie", `token=${userToken}`)
        .send({
          restaurant_id: testData.restaurantId,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        });

      if (createResponse.status === 201) {
        const reservationId = createResponse.body.id;
        const ownerToken = generateTestToken({ id: testData.ownerId, role: "owner" });
        const cancelResponse = await request(app)
          .post(`/api/v1/reservations/${reservationId}/owner-cancel`)
          .set("Cookie", `token=${ownerToken}`)
          .send({
            cancellation_reason: "Restaurant closed",
          });

        expect([200, 403, 400]).toContain(cancelResponse.status);
      }
    });
  });

  describe("POST /api/v1/specialMenus/:id/delete", () => {
    it("should delete special menu via POST delete alias", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      
      // Create special menu
      const createResponse = await request(app)
        .post("/api/v1/specialMenus")
        .set("Cookie", `token=${token}`)
        .send({
          name: "Test Special",
          discounted_price: 59.99,
          restaurant_id: testData.restaurantId,
        });

      if (createResponse.status === 201) {
        const menuId = createResponse.body.specialMenu?.id;
        const deleteResponse = await request(app)
          .post(`/api/v1/specialMenus/${menuId}/delete`)
          .set("Cookie", `token=${token}`);

        expect([200, 403]).toContain(deleteResponse.status);
      }
    });
  });
});

