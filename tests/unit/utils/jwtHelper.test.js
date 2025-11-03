/**
 * Unit Tests for JWT Helper
 */
const {
  generateToken,
  verifyTokenFromCookie,
  setTokenCookie,
  clearTokenCookie,
} = require("../../../utils/jwtHelper");

describe("JWT Helper", () => {
  const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "customer",
    confirmed_user: true,
  };

  const mockReq = {
    cookies: {},
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const token = generateToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe("verifyTokenFromCookie", () => {
    it("should return null when no token is present", () => {
      const result = verifyTokenFromCookie(mockReq);
      expect(result).toBeNull();
    });

    it("should verify and decode a valid token", () => {
      const token = generateToken(mockUser);
      mockReq.cookies.token = token;

      const decoded = verifyTokenFromCookie(mockReq);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it("should return null for invalid token", () => {
      mockReq.cookies.token = "invalid.token.here";
      const result = verifyTokenFromCookie(mockReq);
      expect(result).toBeNull();
    });
  });

  describe("setTokenCookie", () => {
    it("should set cookie with correct options", () => {
      const token = generateToken(mockUser);
      setTokenCookie(mockRes, token);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "token",
        token,
        expect.objectContaining({
          httpOnly: true,
          path: "/",
          sameSite: "Lax",
        })
      );
    });
  });

  describe("clearTokenCookie", () => {
    it("should clear the token cookie", () => {
      clearTokenCookie(mockRes);
      expect(mockRes.clearCookie).toHaveBeenCalledWith("token");
    });
  });
});

