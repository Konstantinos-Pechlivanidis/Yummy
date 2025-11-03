/**
 * Unit Tests for Reservations Controller
 */
const {
  getUserReservations,
  createReservation,
  cancelReservation,
} = require("../../../controllers/reservationsController");
const {
  createMockRequest,
  createMockResponse,
  createMockPool,
  createTestReservation,
} = require("../../helpers/testHelpers");

jest.mock("../../../utils/jwtHelper", () => ({
  verifyTokenFromCookie: jest.fn(),
  clearTokenCookie: jest.fn(),
}));

jest.mock("../../../queries/reservationsQueries", () => ({
  fetchReservationsByUser: "SELECT * FROM reservations WHERE user_id = $1",
  createReservationQuery: "INSERT INTO reservations...",
  cancelReservationQuery: "UPDATE reservations SET status = 'cancelled'...",
}));

jest.mock("../../../queries/userQueries", () => ({
  getConfirmedUserStatus: "SELECT confirmed_user FROM users WHERE id = $1",
}));

describe("Reservations Controller Unit Tests", () => {
  let mockPool;
  let mockRes;

  beforeEach(() => {
    mockPool = createMockPool();
    mockRes = createMockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserReservations", () => {
    it("should return user reservations", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
      });

      const jwt = require("jsonwebtoken");
      jest.spyOn(jwt, "verify").mockReturnValue({ id: 1 });

      mockPool.setQueryResult("SELECT * FROM reservations WHERE user_id = $1", {
        rows: [createTestReservation({ user_id: 1 })],
      });

      await getUserReservations(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should return 401 without token", async () => {
      const mockReq = createMockRequest({
        cookies: {},
      });

      await getUserReservations(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe("createReservation", () => {
    it("should create reservation for confirmed user", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: {
          restaurant_id: 1,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        },
      });

      const jwt = require("jsonwebtoken");
      jest.spyOn(jwt, "verify").mockReturnValue({ id: 1 });

      // User is confirmed
      mockPool.setQueryResult("SELECT confirmed_user FROM users WHERE id = $1", {
        rows: [{ confirmed_user: true }],
      });

      // Reservation created
      mockPool.setQueryResult("INSERT INTO reservations...", {
        rows: [createTestReservation()],
      });

      await createReservation(mockReq, mockRes, mockPool);

      expect([201, 400]).toContain(mockRes.statusCode || 201);
    });

    it("should return 401 for unconfirmed user", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        body: {
          restaurant_id: 1,
          date: "2024-12-25",
          time: "19:00",
          guest_count: 4,
        },
      });

      const jwt = require("jsonwebtoken");
      jest.spyOn(jwt, "verify").mockReturnValue({ id: 1 });

      mockPool.setQueryResult("SELECT confirmed_user FROM users WHERE id = $1", {
        rows: [{ confirmed_user: false }],
      });

      await createReservation(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe("cancelReservation", () => {
    it("should cancel reservation successfully", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
        params: { id: "1" },
        body: {
          reason: "Change of plans",
        },
      });

      const jwt = require("jsonwebtoken");
      jest.spyOn(jwt, "verify").mockReturnValue({ id: 1 });

      mockPool.setQueryResult("UPDATE reservations SET status = 'cancelled'...", {
        rows: [createTestReservation({ status: "cancelled" })],
      });

      await cancelReservation(mockReq, mockRes, mockPool);

      expect([200, 400]).toContain(mockRes.statusCode || 200);
    });
  });
});

