/**
 * Unit Tests for Coupons Controller
 */
const {
  getUserCoupons,
  purchaseCoupon,
  createCoupon,
  editCoupon,
} = require("../../../controllers/couponsController");
const {
  createMockRequest,
  createMockResponse,
  createMockPool,
  createTestCoupon,
  createTestUser,
} = require("../../helpers/testHelpers");

jest.mock("../../../utils/jwtHelper", () => ({
  verifyTokenFromCookie: jest.fn(),
  clearTokenCookie: jest.fn(),
}));

jest.mock("../../../queries/couponsQueries", () => ({
  fetchUserCouponsQuery: "SELECT * FROM purchased_coupons...",
  purchaseCouponQuery: "INSERT INTO purchased_coupons...",
  createCouponQuery: "INSERT INTO coupons...",
  verifyRestaurantOwnership: "SELECT * FROM restaurants...",
  getCouponWithRestaurant: "SELECT * FROM coupons...",
}));

jest.mock("../../../queries/userQueries", () => ({
  getConfirmedUserStatus: "SELECT confirmed_user FROM users...",
  updateUserPointsQuery: "UPDATE users SET loyalty_points...",
  fetchUserPoints: "SELECT loyalty_points FROM users...",
}));

describe("Coupons Controller Unit Tests", () => {
  let mockPool;
  let mockRes;

  beforeEach(() => {
    mockPool = createMockPool();
    mockRes = createMockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserCoupons", () => {
    it("should return user coupons with pagination", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        query: { page: "1", pageSize: "10" },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 1 });

      mockPool.setQueryResult("SELECT * FROM purchased_coupons...", {
        rows: [createTestCoupon()],
      });
      mockPool.setQueryResult("SELECT COUNT(*) FROM purchased_coupons...", {
        rows: [{ count: "1" }],
      });

      await getUserCoupons(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userCoupons: expect.any(Array),
          Pagination: expect.objectContaining({
            currentPage: 1,
          }),
        })
      );
    });
  });

  describe("purchaseCoupon", () => {
    it("should purchase coupon with sufficient points", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: { coupon_id: 1 },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 1 });

      // User is confirmed
      mockPool.setQueryResult("SELECT confirmed_user FROM users...", {
        rows: [{ confirmed_user: true }],
      });

      // Coupon exists
      mockPool.setQueryResult("SELECT required_points FROM coupons...", {
        rows: [{ required_points: 100 }],
      });

      // User has enough points
      mockPool.setQueryResult("SELECT loyalty_points FROM users WHERE id = $1 FOR UPDATE", {
        rows: [{ loyalty_points: 200 }],
      });

      // No duplicate purchase
      mockPool.setQueryResult("SELECT 1 FROM purchased_coupons WHERE user_id = $1 AND coupon_id = $2", {
        rows: [],
      });

      // Purchase succeeds
      mockPool.setQueryResult("INSERT INTO purchased_coupons...", {
        rows: [createTestCoupon()],
      });

      await purchaseCoupon(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 401 for unconfirmed user", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: { coupon_id: 1 },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 1 });

      mockPool.setQueryResult("SELECT confirmed_user FROM users...", {
        rows: [{ confirmed_user: false }],
      });

      await purchaseCoupon(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 for insufficient points", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: { coupon_id: 1 },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 1 });

      mockPool.setQueryResult("SELECT confirmed_user FROM users...", {
        rows: [{ confirmed_user: true }],
      });

      mockPool.setQueryResult("SELECT required_points FROM coupons...", {
        rows: [{ required_points: 100 }],
      });

      mockPool.setQueryResult("SELECT loyalty_points FROM users WHERE id = $1 FOR UPDATE", {
        rows: [{ loyalty_points: 50 }], // Insufficient
      });

      await purchaseCoupon(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("createCoupon", () => {
    it("should create coupon with valid owner token", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: {
          description: "20% off",
          discount_percentage: 20,
          required_points: 100,
          restaurant_id: 1,
        },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 2 });

      mockPool.setQueryResult("SELECT * FROM restaurants...", {
        rows: [{ id: 1, owner_id: 2 }], // Owner owns restaurant
      });

      mockPool.setQueryResult("INSERT INTO coupons...", {
        rows: [createTestCoupon()],
      });

      await createCoupon(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 403 if owner doesn't own restaurant", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: {
          description: "20% off",
          discount_percentage: 20,
          required_points: 100,
          restaurant_id: 1,
        },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 2 });

      mockPool.setQueryResult("SELECT * FROM restaurants...", {
        rows: [], // Owner doesn't own restaurant
      });

      await createCoupon(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});

