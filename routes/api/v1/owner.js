const express = require("express");
const asyncHandler = require("../../../middleware/asyncHandler");
const passportGoogle = require("../../../middleware/authGoogle");
const passportFacebook = require("../../../middleware/authFacebook");

const {
  registerOwner,
  checkAuthStatus,
  logoutOwner,
  requestResetPasswordOwner,
  resetPasswordOwner,
  checkResetPasswordTokenOwner,
  loginOwner,
  updateOwnerDetails,
  getOwnerProfile,
  verifyOwnerEmail,
  resendVerificationEmailToOwner,
} = require("../../../controllers/ownerController");

module.exports = (pool) => {
  const router = express.Router();

  // **Email & Password Authentication**
  router.post("/register", asyncHandler((req, res) => registerOwner(req, res, pool)));
  router.post("/password/reset/request", asyncHandler((req, res) =>
    requestResetPasswordOwner(req, res, pool)
  ));
  router.post("/password/reset", asyncHandler((req, res) =>
    resetPasswordOwner(req, res, pool)
  ));
  router.post("/password/reset/validate/token", asyncHandler((req, res) =>
    checkResetPasswordTokenOwner(req, res, pool)
  ));

  router.post("/login", asyncHandler((req, res) => loginOwner(req, res, pool)));
  router.patch("/update", asyncHandler((req, res) => updateOwnerDetails(req, res, pool)));
  router.get("/profile", asyncHandler((req, res) => getOwnerProfile(req, res, pool)));
  router.get("/verify-email", asyncHandler((req, res) => verifyOwnerEmail(req, res, pool)));
  router.post("/resend-verification", asyncHandler((req, res) =>
    resendVerificationEmailToOwner(req, res, pool)
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
  router.get("/logout", logoutOwner);

  return router;
};
