const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");
const passportGoogle = require("../../../middleware/authGoogle");
const passportFacebook = require("../../../middleware/authFacebook");

const {
  registerUser,
  loginUser,
  updateUserDetails,
  getUserProfile,
  googleAuthCallback,
  facebookAuthCallback,
  checkAuthStatus,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  getUserPoints,
  getFavorites,
  toggleFavoriteController,
  requestResetPassword,
  resetPassword,
  checkResetPasswordToken,
} = require("../../../controllers/userController");

module.exports = (pool) => {
  const router = express.Router();

  // **Email & Password Authentication**
  router.post("/register", asyncHandler((req, res) => registerUser(req, res, pool)));
  router.post("/password/reset/request", asyncHandler((req, res) =>
    requestResetPassword(req, res, pool)
  ));
  router.post("/password/reset", asyncHandler((req, res) => resetPassword(req, res, pool)));
  router.post("/password/reset/validate/token", asyncHandler((req, res) =>
    checkResetPasswordToken(req, res, pool)
  ));

  router.post("/login", asyncHandler((req, res) => loginUser(req, res, pool)));
  router.patch("/update", asyncHandler((req, res) => updateUserDetails(req, res, pool)));
  router.get("/profile", asyncHandler((req, res) => getUserProfile(req, res, pool)));
  router.get("/verify-email", asyncHandler((req, res) => verifyEmail(req, res, pool)));
  router.get("/points", asyncHandler((req, res) => getUserPoints(req, res, pool)));
  router.get("/favorites", asyncHandler((req, res) => getFavorites(req, res, pool)));
  router.post("/favorites/toggle", asyncHandler((req, res) =>
    toggleFavoriteController(req, res, pool)
  ));

  router.post("/resend-verification", asyncHandler((req, res) =>
    resendVerificationEmail(req, res, pool)
  ));

  // **Google Authentication**
  router.get(
    "/auth/google",
    passportGoogle.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: true,
    })
  );

  router.get("/auth/google/callback", asyncHandler((req, res) =>
    googleAuthCallback(req, res, pool)
  ));

  // **Facebook Authentication**
  router.get(
    "/auth/facebook",
    passportFacebook.authenticate("facebook", { scope: ["email"] })
  );

  router.get("/auth/facebook/callback", asyncHandler((req, res) =>
    facebookAuthCallback(req, res, pool)
  ));

  // **Authentication Status & Logout**
  router.get("/auth/status", checkAuthStatus);
  router.get("/logout", logoutUser);

  return router;
};
