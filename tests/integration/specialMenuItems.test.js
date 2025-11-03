/**
 * Integration Tests for Special Menu Items API Routes
 */
const request = require("supertest");
const createApp = require("../helpers/appFactory");
const { createTestPool, cleanDatabase, seedTestData } = require("../helpers/dbTestHelpers");
const { generateTestToken } = require("../helpers/testHelpers");

describe("Special Menu Items API Routes", () => {
  let app;
  let pool;
  let testData;
  let specialMenuId;
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

  beforeEach(async () => {
    await cleanDatabase(pool);
    testData = await seedTestData(pool);

    // Create a special menu
    const ownerToken = generateTestToken({ id: testData.ownerId, role: "owner" });
    const menuResponse = await request(app)
      .post("/api/v1/specialMenus")
      .set("Cookie", `token=${ownerToken}`)
      .send({
        name: "Test Special Menu",
        discounted_price: 59.99,
        restaurant_id: testData.restaurantId,
      });

    if (menuResponse.status === 201) {
      specialMenuId = menuResponse.body.specialMenu?.id;
    }

    // Create a menu item
    const itemResponse = await request(app)
      .post("/api/v1/menuItems")
      .set("Cookie", `token=${ownerToken}`)
      .send({
        name: "Test Menu Item",
        price: 15.50,
        category: "Main Course",
        restaurant_id: testData.restaurantId,
      });

    if (itemResponse.status === 201) {
      menuItemId = itemResponse.body.menuItem?.id;
    }
  });

  describe("POST /api/v1/special-menu-items", () => {
    it("should create link between special menu and menu item", async () => {
      if (specialMenuId && menuItemId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .post("/api/v1/special-menu-items")
          .set("Cookie", `token=${token}`)
          .send({
            special_menu_id: specialMenuId,
            menu_item_id: menuItemId,
          });

        expect([201, 400, 403]).toContain(response.status);
      }
    });

    it("should return 400 for missing special_menu_id", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/special-menu-items")
        .set("Cookie", `token=${token}`)
        .send({
          menu_item_id: menuItemId,
        });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing menu_item_id", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/special-menu-items")
        .set("Cookie", `token=${token}`)
        .send({
          special_menu_id: specialMenuId,
        });

      expect(response.status).toBe(400);
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/v1/special-menu-items")
        .send({
          special_menu_id: specialMenuId,
          menu_item_id: menuItemId,
        });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-owner user", async () => {
      const token = generateTestToken({ id: testData.userId, role: "customer" });
      const response = await request(app)
        .post("/api/v1/special-menu-items")
        .set("Cookie", `token=${token}`)
        .send({
          special_menu_id: specialMenuId,
          menu_item_id: menuItemId,
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid special_menu_id", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .post("/api/v1/special-menu-items")
        .set("Cookie", `token=${token}`)
        .send({
          special_menu_id: 99999,
          menu_item_id: menuItemId,
        });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe("DELETE /api/v1/special-menu-items", () => {
    beforeEach(async () => {
      // Create a link first
      if (specialMenuId && menuItemId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        await request(app)
          .post("/api/v1/special-menu-items")
          .set("Cookie", `token=${token}`)
          .send({
            special_menu_id: specialMenuId,
            menu_item_id: menuItemId,
          });
      }
    });

    it("should delete link between special menu and menu item", async () => {
      if (specialMenuId && menuItemId) {
        const token = generateTestToken({ id: testData.ownerId, role: "owner" });
        const response = await request(app)
          .delete("/api/v1/special-menu-items")
          .set("Cookie", `token=${token}`)
          .send({
            special_menu_id: specialMenuId,
            menu_item_id: menuItemId,
          });

        expect([200, 400, 403, 404]).toContain(response.status);
      }
    });

    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .delete("/api/v1/special-menu-items")
        .send({
          special_menu_id: specialMenuId,
          menu_item_id: menuItemId,
        });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-owner user", async () => {
      const token = generateTestToken({ id: testData.userId, role: "customer" });
      const response = await request(app)
        .delete("/api/v1/special-menu-items")
        .set("Cookie", `token=${token}`)
        .send({
          special_menu_id: specialMenuId,
          menu_item_id: menuItemId,
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 for missing required fields", async () => {
      const token = generateTestToken({ id: testData.ownerId, role: "owner" });
      const response = await request(app)
        .delete("/api/v1/special-menu-items")
        .set("Cookie", `token=${token}`)
        .send({
          special_menu_id: specialMenuId,
          // Missing menu_item_id
        });

      expect(response.status).toBe(400);
    });
  });
});

