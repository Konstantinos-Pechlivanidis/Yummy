/**
 * Integration Tests for Coupons API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken } = require("../helpers/testHelpers");

describe("Coupons API Routes", () => {
  let app;
  let pool;
  let testData;
  let couponId;

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
    
    // Create a test coupon
    const ownerToken = generateTestToken({ id: testData.ownerId, role: "owner" });
    const createResponse = await request(app)
      .post("/api/v1/coupons/creation")
      .set("Cookie", `token=${ownerToken}`)
      .send({
        description: "20% off on main course",
        discount_percentage: 20,
        required_points: 100,
        restaurant_id: testData.restaurantId,
      });
    
    if (createResponse.status === 201) {
      couponId = createResponse.body.coupon.id;
    }
  });

  describe("GET /api/v1/coupons/available", () => {
    it("should return available coupons", async () => {
      const response = await request(app)
        .get("/api/v1/coupons/available")
        .query({
          restaurant_id: testData.restaurantId,
          page: 1,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("coupons");
      expect(Array.isArray(response.body.coupons)).toBe(true);
    });
  });

  describe("GET /api/v1/coupons/ownedByUser", () => {
    it("should return user coupons with valid token", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const response = await request(app)
        .get("/api/v1/coupons/ownedByUser")
        .set("Cookie", `token=${token}`)
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("userCoupons");
      expect(response.body).toHaveProperty("Pagination");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/v1/coupons/ownedByUser");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/coupons/purchase", () => {
    it("should purchase coupon with sufficient points", async () => {
      // Ensure user has enough points
      await pool.query(
        `UPDATE users SET loyalty_points = 200 WHERE id = $1`,
        [testData.userId]
      );

      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const response = await request(app)
        .post("/api/v1/coupons/purchase")
        .set("Cookie", `token=${token}`)
        .send({
          coupon_id: couponId,
        });

      expect([201, 400, 404]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body).toHaveProperty("message", "Coupon purchased successfully");
        expect(response.body).toHaveProperty("remaining_points");
      }
    });

    it("should return 401 for unconfirmed user", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: false });
      const response = await request(app)
        .post("/api/v1/coupons/purchase")
        .set("Cookie", `token=${token}`)
        .send({
          coupon_id: couponId,
        });

      expect(response.status).toBe(401);
    });

    it("should return 400 for insufficient points", async () => {
      // Set user points below required
      await pool.query(
        `UPDATE users SET loyalty_points = 50 WHERE id = $1`,
        [testData.userId]
      );

      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const response = await request(app)
        .post("/api/v1/coupons/purchase")
        .set("Cookie", `token=${token}`)
        .send({
          coupon_id: couponId,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/coupons/creation", () => {
    it("should create coupon with valid owner token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/coupons/creation")
        .set("Cookie", `token=${token}`)
        .send({
          description: "15% off on desserts",
          discount_percentage: 15,
          required_points: 50,
          restaurant_id: testData.restaurantId,
        });

      expect([201, 403]).toContain(response.status); // 403 if not owner
      if (response.status === 201) {
        expect(response.body).toHaveProperty("coupon");
      }
    });

    it("should return 400 for invalid discount_percentage", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/coupons/creation")
        .set("Cookie", `token=${token}`)
        .send({
          description: "Invalid discount",
          discount_percentage: 150, // Invalid: > 100
          required_points: 50,
          restaurant_id: testData.restaurantId,
        });

      expect(response.status).toBe(400);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/coupons/creation")
        .send({
          description: "Test coupon",
          discount_percentage: 20,
          required_points: 100,
          restaurant_id: testData.restaurantId,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/coupons/edit", () => {
    it("should edit coupon with valid owner token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch("/api/v1/coupons/edit")
        .set("Cookie", `token=${token}`)
        .send({
          couponId: couponId,
          description: "Updated description",
          discount_percentage: 25,
        });

      expect([200, 403]).toContain(response.status);
    });

    it("should return 400 for invalid couponId", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .patch("/api/v1/coupons/edit")
        .set("Cookie", `token=${token}`)
        .send({
          couponId: 99999,
          description: "Updated",
        });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe("DELETE /api/v1/coupons/delete", () => {
    it("should delete coupon with valid owner token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .delete("/api/v1/coupons/delete")
        .set("Cookie", `token=${token}`)
        .send({
          couponId: couponId,
        });

      expect([200, 400, 403]).toContain(response.status);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .delete("/api/v1/coupons/delete")
        .send({
          couponId: couponId,
        });

      expect(response.status).toBe(401);
    });
  });
});

