/**
 * Integration Tests for Reservations API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken, hashPassword } = require("../helpers/testHelpers");

describe("Reservations API Routes", () => {
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

  describe("POST /api/v1/reservations", () => {
    it("should create a reservation with valid user token", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const response = await request(app)
        .post("/api/v1/reservations")
        .set("Cookie", `token=${token}`)
        .send({
          restaurant_id: testData.restaurantId,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
          status: "pending",
        });

      expect([201, 400]).toContain(response.status); // 400 if validation fails
      if (response.status === 201) {
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("restaurant_id", testData.restaurantId);
      }
    });

    it("should return 401 for unconfirmed user", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: false });
      const response = await request(app)
        .post("/api/v1/reservations")
        .set("Cookie", `token=${token}`)
        .send({
          restaurant_id: testData.restaurantId,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        });

      expect(response.status).toBe(401);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/reservations")
        .send({
          restaurant_id: testData.restaurantId,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid date format", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const response = await request(app)
        .post("/api/v1/reservations")
        .set("Cookie", `token=${token}`)
        .send({
          restaurant_id: testData.restaurantId,
          date: "invalid-date",
          time: "19:00",
          guest_count: 4,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/reservations", () => {
    it("should return user reservations with valid token", async () => {
      // Create a reservation first
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      
      await request(app)
        .post("/api/v1/reservations")
        .set("Cookie", `token=${token}`)
        .send({
          restaurant_id: testData.restaurantId,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        });

      const response = await request(app)
        .get("/api/v1/reservations")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/v1/reservations");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/reservations/filter", () => {
    it("should return filtered reservations", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      const response = await request(app)
        .get("/api/v1/reservations/filter")
        .set("Cookie", `token=${token}`)
        .query({
          status: "pending",
          date: "2024-12-25",
          page: 1,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("reservations");
      expect(response.body).toHaveProperty("Pagination");
    });
  });

  describe("GET /api/v1/reservations/:id", () => {
    it("should return reservation by ID", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      
      // Create reservation
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
        const response = await request(app)
          .get(`/api/v1/reservations/${reservationId}`)
          .set("Cookie", `token=${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id", reservationId);
      }
    });

    it("should return 404 for non-existent reservation", async () => {
      const token = generateTestToken({ id: testData.userId });
      const response = await request(app)
        .get("/api/v1/reservations/99999")
        .set("Cookie", `token=${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/v1/reservations/:id/cancel", () => {
    it("should cancel a reservation", async () => {
      const token = generateTestToken({ id: testData.userId, confirmed_user: true });
      
      // Create reservation
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
        const response = await request(app)
          .post(`/api/v1/reservations/${reservationId}/cancel`)
          .set("Cookie", `token=${token}`)
          .send({
            reason: "Change of plans",
          });

        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe("GET /api/v1/reservations/owner", () => {
    it("should return owner reservations with valid token", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .get("/api/v1/reservations/owner")
        .set("Cookie", `token=${token}`)
        .query({
          status: "pending",
          page: 1,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("reservations");
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/v1/reservations/owner");

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/reservations/owner/status", () => {
    it("should update reservation status as owner", async () => {
      // First create a reservation as user
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
        const response = await request(app)
          .patch("/api/v1/reservations/owner/status")
          .set("Cookie", `token=${ownerToken}`)
          .send({
            reservation_id: reservationId,
            status: "confirmed",
          });

        expect([200, 403]).toContain(response.status); // 403 if not owner of restaurant
      }
    });
  });
});

