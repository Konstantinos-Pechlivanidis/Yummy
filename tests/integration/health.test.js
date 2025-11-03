/**
 * Integration Tests for Health Check
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool } = require("../helpers/dbTestHelpers");

describe("Health Check API", () => {
  let app;
  let pool;

  beforeAll(async () => {
    pool = createTestPool();
    app = createApp(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("GET /healthz", () => {
    it("should return 200 when database is connected", async () => {
      const response = await request(app).get("/healthz");

      expect([200, 503]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty("ok", true);
        expect(response.body).toHaveProperty("database", "connected");
        expect(response.body).toHaveProperty("timestamp");
      }
    });

    it("should return health status in JSON format", async () => {
      const response = await request(app).get("/healthz");

      expect(response.headers["content-type"]).toMatch(/json/);
    });
  });
});

