/**
 * Unit Tests for Menu Items Controller
 */
const {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../../../controllers/menuItemsController");
const {
  createMockRequest,
  createMockResponse,
  createMockPool,
} = require("../../helpers/testHelpers");

jest.mock("../../../utils/jwtHelper", () => ({
  verifyTokenFromCookie: jest.fn(),
  clearTokenCookie: jest.fn(),
}));

jest.mock("../../../queries/menuItemsQueries", () => ({
  createMenuItemQuery: "INSERT INTO menu_items...",
  updateMenuItemQuery: "UPDATE menu_items...",
  deleteMenuItemQuery: "DELETE FROM menu_items...",
  verifyMenuItemOwnership: "SELECT * FROM menu_items...",
}));

describe("Menu Items Controller Unit Tests", () => {
  let mockPool;
  let mockRes;

  beforeEach(() => {
    mockPool = createMockPool();
    mockRes = createMockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createMenuItem", () => {
    it("should create menu item with valid owner token", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: {
          name: "Test Item",
          price: 15.50,
          category: "Main Course",
          restaurant_id: 1,
        },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 2, role: "owner" });

      mockPool.setQueryResult("SELECT * FROM menu_items...", {
        rows: [{ restaurant_id: 1 }],
      });

      mockPool.setQueryResult("INSERT INTO menu_items...", {
        rows: [{ id: 1, name: "Test Item", price: 15.50 }],
      });

      await createMenuItem(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 401 without authentication", async () => {
      const mockReq = createMockRequest({
        cookies: {},
        body: {
          name: "Test Item",
          price: 15.50,
          category: "Main Course",
          restaurant_id: 1,
        },
      });

      await createMenuItem(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe("updateMenuItem", () => {
    it("should update menu item with valid owner token", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        params: { id: "1" },
        body: {
          restaurant_id: 1,
          name: "Updated Item",
        },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 2, role: "owner" });

      mockPool.setQueryResult("SELECT * FROM menu_items...", {
        rows: [{ id: 1, restaurant_id: 1 }],
      });

      mockPool.setQueryResult("UPDATE menu_items...", {
        rows: [{ id: 1, name: "Updated Item" }],
      });

      await updateMenuItem(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteMenuItem", () => {
    it("should delete menu item with valid owner token", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        params: { id: "1" },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 2, role: "owner" });

      mockPool.setQueryResult("SELECT * FROM menu_items...", {
        rows: [{ id: 1, restaurant_id: 1 }],
      });

      mockPool.setQueryResult("DELETE FROM menu_items...", {
        rows: [],
      });

      await deleteMenuItem(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});

