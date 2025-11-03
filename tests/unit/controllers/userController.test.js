/**
 * Unit Tests for User Controller
 */
const {
  registerUser,
  loginUser,
  updateUserDetails,
  getUserProfile,
  getUserPoints,
} = require("../../../controllers/userController");
const {
  createMockRequest,
  createMockResponse,
  createMockPool,
  createTestUser,
  hashPassword,
} = require("../../helpers/testHelpers");

// Mock dependencies
jest.mock("../../../utils/sendVerificationEmail", () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve()),
  sendResetPasswordEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../../utils/jwtHelper", () => ({
  generateToken: jest.fn(() => "mock-token"),
  setTokenCookie: jest.fn(),
  clearTokenCookie: jest.fn(),
  verifyTokenFromCookie: jest.fn(),
}));

jest.mock("../../../queries/userQueries", () => ({
  getUserByEmail: "SELECT * FROM users WHERE email = $1",
  getUserById: "SELECT * FROM users WHERE id = $1",
  insertUser: "INSERT INTO users...",
  updateUser: "UPDATE users...",
  fetchUserPoints: "SELECT loyalty_points FROM users WHERE id = $1",
}));

describe("User Controller Unit Tests", () => {
  let mockPool;
  let mockRes;

  beforeEach(() => {
    mockPool = createMockPool();
    mockRes = createMockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const mockReq = createMockRequest({
        body: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "customer",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1", { rows: [] });
      mockPool.setQueryResult("INSERT INTO users...", {
        rows: [createTestUser({ id: 1, email: "test@example.com" })],
      });

      await registerUser(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Registration successful",
          user: expect.objectContaining({
            email: "test@example.com",
          }),
        })
      );
    });

    it("should return 400 if user already exists", async () => {
      const mockReq = createMockRequest({
        body: {
          name: "Test User",
          email: "existing@example.com",
          password: "password123",
          role: "customer",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1", {
        rows: [createTestUser({ email: "existing@example.com" })],
      });

      await registerUser(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "User already exists",
        })
      );
    });

    it("should return 400 for validation errors", async () => {
      const mockReq = createMockRequest({
        body: {
          name: "AB", // Too short
          email: "invalid-email",
          password: "123", // Too short
          role: "customer",
        },
      });

      await registerUser(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe("loginUser", () => {
    it("should login user with valid credentials", async () => {
      const hashedPassword = await hashPassword("password123");
      const mockReq = createMockRequest({
        body: {
          email: "test@example.com",
          password: "password123",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1", {
        rows: [createTestUser({ password: hashedPassword, email: "test@example.com" })],
      });

      await loginUser(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
        })
      );
    });

    it("should return 400 for invalid credentials", async () => {
      const mockReq = createMockRequest({
        body: {
          email: "test@example.com",
          password: "wrongpassword",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1", {
        rows: [createTestUser({ password: await hashPassword("password123") })],
      });

      await loginUser(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getUserProfile", () => {
    it("should return user profile", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
      });

      // Mock verifyTokenFromCookie to return user
      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 1 });

      mockPool.setQueryResult("SELECT * FROM users WHERE id = $1", {
        rows: [createTestUser({ id: 1 })],
      });

      await getUserProfile(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
        })
      );
    });
  });

  describe("getUserPoints", () => {
    it("should return user points", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 1 });

      mockPool.setQueryResult("SELECT loyalty_points FROM users WHERE id = $1", {
        rows: [{ loyalty_points: 150 }],
      });

      await getUserPoints(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          loyalty_points: 150,
        })
      );
    });
  });
});

