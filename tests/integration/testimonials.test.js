/**
 * Integration Tests for Testimonials API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");

describe("Testimonials API Routes", () => {
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

  describe("GET /api/v1/testimonials/all", () => {
    it("should return paginated testimonials", async () => {
      const response = await request(app)
        .get("/api/v1/testimonials/all")
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("testimonials");
      expect(Array.isArray(response.body.testimonials)).toBe(true);
    });

    it("should return testimonials without authentication", async () => {
      const response = await request(app).get("/api/v1/testimonials/all");

      expect(response.status).toBe(200);
    });

    it("should handle pagination correctly", async () => {
      const response = await request(app)
        .get("/api/v1/testimonials/all")
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(200);
      if (response.body.Pagination) {
        expect(response.body.Pagination).toHaveProperty("currentPage");
      }
    });
  });
});

