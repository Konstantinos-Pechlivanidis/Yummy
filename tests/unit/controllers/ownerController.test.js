/**
 * Unit Tests for Owner Controller
 */
const {
  registerOwner,
  loginOwner,
  updateOwnerDetails,
  getOwnerProfile,
} = require("../../../controllers/ownerController");
const {
  createMockRequest,
  createMockResponse,
  createMockPool,
  createTestOwner,
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

jest.mock("../../../queries/ownerQueries", () => ({
  getOwnerByEmail: "SELECT * FROM users WHERE email = $1 AND role = 'owner'",
  getOwnerById: "SELECT * FROM users WHERE id = $1 AND role = 'owner'",
  insertOwner: "INSERT INTO users...",
  updateOwner: jest.fn((fields) => `UPDATE users SET ${fields} WHERE id = $${fields.split(',').length + 1}`),
  updateOwnerPassword: "UPDATE users SET password = $1...",
}));

describe("Owner Controller Unit Tests", () => {
  let mockPool;
  let mockRes;

  beforeEach(() => {
    mockPool = createMockPool();
    mockRes = createMockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerOwner", () => {
    it("should register a new owner successfully", async () => {
      const mockReq = createMockRequest({
        body: {
          name: "Test Owner",
          email: "owner@example.com",
          password: "ownerpass123",
          role: "owner",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1 AND role = 'owner'", { rows: [] });
      mockPool.setQueryResult("INSERT INTO users...", {
        rows: [createTestOwner({ id: 2, email: "owner@example.com" })],
      });

      await registerOwner(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("registered"),
        })
      );
    });

    it("should return 400 if owner already exists", async () => {
      const mockReq = createMockRequest({
        body: {
          name: "Test Owner",
          email: "existing@example.com",
          password: "ownerpass123",
          role: "owner",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1 AND role = 'owner'", {
        rows: [createTestOwner({ email: "existing@example.com" })],
      });

      await registerOwner(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Owner already exists",
        })
      );
    });

    it("should return 400 for validation errors", async () => {
      const mockReq = createMockRequest({
        body: {
          name: "AB", // Too short
          email: "invalid-email",
          password: "123", // Too short
          role: "owner",
        },
      });

      await registerOwner(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe("loginOwner", () => {
    it("should login owner with valid credentials", async () => {
      const hashedPassword = await hashPassword("ownerpass123");
      const mockReq = createMockRequest({
        body: {
          email: "owner@example.com",
          password: "ownerpass123",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1 AND role = 'owner'", {
        rows: [createTestOwner({ password: hashedPassword, email: "owner@example.com" })],
      });

      await loginOwner(mockReq, mockRes, mockPool);

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
          email: "owner@example.com",
          password: "wrongpassword",
        },
      });

      mockPool.setQueryResult("SELECT * FROM users WHERE email = $1 AND role = 'owner'", {
        rows: [createTestOwner({ password: await hashPassword("ownerpass123") })],
      });

      await loginOwner(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getOwnerProfile", () => {
    it("should return owner profile", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 2 });

      mockPool.setQueryResult("SELECT * FROM users WHERE id = $1 AND role = 'owner'", {
        rows: [createTestOwner({ id: 2 })],
      });

      await getOwnerProfile(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          role: "owner",
        })
      );
    });

    it("should return 404 for non-existent owner", async () => {
      const mockReq = createMockRequest({
        cookies: { token: "valid-token" },
      });

      const { verifyTokenFromCookie } = require("../../../utils/jwtHelper");
      verifyTokenFromCookie.mockReturnValue({ id: 99999 });

      mockPool.setQueryResult("SELECT * FROM users WHERE id = $1 AND role = 'owner'", {
        rows: [],
      });

      await getOwnerProfile(mockReq, mockRes, mockPool);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

