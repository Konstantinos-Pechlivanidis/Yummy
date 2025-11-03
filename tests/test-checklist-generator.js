/**
 * Test Checklist Generator
 * Generates a comprehensive report of tested endpoints
 */

const fs = require("fs");
const path = require("path");

const testFiles = {
  integration: [
    { file: "auth.test.js", routes: ["/api/v1/auth/status"] },
    { file: "user.test.js", routes: [
      "/api/v1/user/register",
      "/api/v1/user/login",
      "/api/v1/user/profile",
      "/api/v1/user/update",
      "/api/v1/user/points",
      "/api/v1/user/favorites",
      "/api/v1/user/favorites/toggle",
      "/api/v1/user/password/reset/request",
      "/api/v1/user/logout",
    ]},
    { file: "user-edge-cases.test.js", routes: [
      "/api/v1/user/* (edge cases)",
    ]},
    { file: "owner.test.js", routes: [
      "/api/v1/owner/register",
      "/api/v1/owner/login",
      "/api/v1/owner/profile",
      "/api/v1/owner/update",
      "/api/v1/owner/password/reset/request",
      "/api/v1/owner/auth/status",
      "/api/v1/owner/logout",
    ]},
    { file: "restaurant.test.js", routes: [
      "/api/v1/restaurant/trending",
      "/api/v1/restaurant/discounted",
      "/api/v1/restaurant",
      "/api/v1/restaurant/:id",
      "/api/v1/restaurant/owner",
      "/api/v1/restaurant/:id (PATCH)",
    ]},
    { file: "reservations.test.js", routes: [
      "/api/v1/reservations (POST)",
      "/api/v1/reservations (GET)",
      "/api/v1/reservations/filter",
      "/api/v1/reservations/:id",
      "/api/v1/reservations/:id/cancel",
      "/api/v1/reservations/owner",
      "/api/v1/reservations/owner/status",
    ]},
    { file: "coupons.test.js", routes: [
      "/api/v1/coupons/available",
      "/api/v1/coupons/ownedByUser",
      "/api/v1/coupons/purchase",
      "/api/v1/coupons/creation",
      "/api/v1/coupons/edit",
      "/api/v1/coupons/delete",
    ]},
    { file: "admin.test.js", routes: [
      "/api/v1/admin/register",
      "/api/v1/admin/login",
      "/api/v1/admin/createRestaurant",
    ]},
    { file: "menuItems.test.js", routes: [
      "/api/v1/menuItems (POST)",
      "/api/v1/menuItems/:id (PATCH)",
      "/api/v1/menuItems/:id (DELETE)",
    ]},
    { file: "specialMenus.test.js", routes: [
      "/api/v1/specialMenus (POST)",
      "/api/v1/specialMenus/:id (PATCH)",
      "/api/v1/specialMenus/:id (PUT)",
      "/api/v1/specialMenus/:id (DELETE)",
    ]},
    { file: "specialMenuItems.test.js", routes: [
      "/api/v1/special-menu-items (POST)",
      "/api/v1/special-menu-items (DELETE)",
    ]},
    { file: "testimonials.test.js", routes: [
      "/api/v1/testimonials/all",
    ]},
    { file: "health.test.js", routes: [
      "/healthz",
    ]},
    { file: "additional-endpoints.test.js", routes: [
      "/api/v1/restaurant/id/:id",
      "/api/v1/restaurant/owner/overview",
      "/api/v1/reservations/:id (DELETE)",
      "/api/v1/coupons/purchased/restaurants",
      "/api/v1/coupons/:couponId/purchase",
      "/api/v1/coupons/:couponId (PATCH)",
      "/api/v1/coupons/:couponId (DELETE)",
      "/api/v1/menuItems/:id (PUT)",
      "/api/v1/menuItems/:id/delete",
      "/api/v1/reservations/:id/status",
      "/api/v1/reservations/:id/owner-cancel",
      "/api/v1/specialMenus/:id/delete",
    ]},
  ],
  unit: [
    { file: "controllers/userController.test.js", functions: [
      "registerUser",
      "loginUser",
      "getUserProfile",
      "getUserPoints",
      "updateUserDetails",
    ]},
    { file: "controllers/ownerController.test.js", functions: [
      "registerOwner",
      "loginOwner",
      "getOwnerProfile",
      "updateOwnerDetails",
    ]},
    { file: "controllers/couponsController.test.js", functions: [
      "getUserCoupons",
      "purchaseCoupon",
      "createCoupon",
      "editCoupon",
    ]},
    { file: "controllers/reservationsController.test.js", functions: [
      "getUserReservations",
      "createReservation",
      "cancelReservation",
    ]},
    { file: "controllers/menuItemsController.test.js", functions: [
      "createMenuItem",
      "updateMenuItem",
      "deleteMenuItem",
    ]},
    { file: "utils/jwtHelper.test.js", functions: [
      "generateToken",
      "verifyTokenFromCookie",
      "setTokenCookie",
      "clearTokenCookie",
    ]},
  ],
};

const allRoutes = [
  // Authentication
  { method: "GET", path: "/api/v1/auth/status", tested: true },
  
  // User
  { method: "POST", path: "/api/v1/user/register", tested: true },
  { method: "POST", path: "/api/v1/user/login", tested: true },
  { method: "GET", path: "/api/v1/user/profile", tested: true },
  { method: "PATCH", path: "/api/v1/user/update", tested: true },
  { method: "GET", path: "/api/v1/user/points", tested: true },
  { method: "GET", path: "/api/v1/user/favorites", tested: true },
  { method: "POST", path: "/api/v1/user/favorites/toggle", tested: true },
  { method: "GET", path: "/api/v1/user/verify-email", tested: false },
  { method: "POST", path: "/api/v1/user/resend-verification", tested: false },
  { method: "POST", path: "/api/v1/user/password/reset/request", tested: true },
  { method: "POST", path: "/api/v1/user/password/reset", tested: false },
  { method: "POST", path: "/api/v1/user/password/reset/validate/token", tested: false },
  { method: "GET", path: "/api/v1/user/logout", tested: true },
  { method: "GET", path: "/api/v1/user/auth/google", tested: false },
  { method: "GET", path: "/api/v1/user/auth/google/callback", tested: false },
  { method: "GET", path: "/api/v1/user/auth/facebook", tested: false },
  { method: "GET", path: "/api/v1/user/auth/facebook/callback", tested: false },
  
  // Owner
  { method: "POST", path: "/api/v1/owner/register", tested: true },
  { method: "POST", path: "/api/v1/owner/login", tested: true },
  { method: "GET", path: "/api/v1/owner/profile", tested: true },
  { method: "PATCH", path: "/api/v1/owner/update", tested: true },
  { method: "GET", path: "/api/v1/owner/verify-email", tested: false },
  { method: "POST", path: "/api/v1/owner/resend-verification", tested: false },
  { method: "GET", path: "/api/v1/owner/auth/status", tested: true },
  { method: "GET", path: "/api/v1/owner/logout", tested: true },
  { method: "POST", path: "/api/v1/owner/password/reset/request", tested: true },
  { method: "POST", path: "/api/v1/owner/password/reset", tested: false },
  { method: "POST", path: "/api/v1/owner/password/reset/validate/token", tested: false },
  
  // Admin
  { method: "POST", path: "/api/v1/admin/register", tested: true },
  { method: "POST", path: "/api/v1/admin/login", tested: true },
  { method: "POST", path: "/api/v1/admin/createRestaurant", tested: true },
  
  // Restaurant
  { method: "GET", path: "/api/v1/restaurant/trending", tested: true },
  { method: "GET", path: "/api/v1/restaurant/discounted", tested: true },
  { method: "GET", path: "/api/v1/restaurant", tested: true },
  { method: "GET", path: "/api/v1/restaurant/:id", tested: true },
  { method: "GET", path: "/api/v1/restaurant/id/:id", tested: true },
  { method: "PATCH", path: "/api/v1/restaurant/:id", tested: true },
  { method: "GET", path: "/api/v1/restaurant/owner", tested: true },
  { method: "GET", path: "/api/v1/restaurant/owner/overview", tested: true },
  
  // Reservations
  { method: "GET", path: "/api/v1/reservations", tested: true },
  { method: "GET", path: "/api/v1/reservations/filter", tested: true },
  { method: "GET", path: "/api/v1/reservations/:id", tested: true },
  { method: "POST", path: "/api/v1/reservations", tested: true },
  { method: "POST", path: "/api/v1/reservations/:id/cancel", tested: true },
  { method: "DELETE", path: "/api/v1/reservations/:id", tested: true },
  { method: "GET", path: "/api/v1/reservations/owner", tested: true },
  { method: "PATCH", path: "/api/v1/reservations/owner/status", tested: true },
  { method: "PATCH", path: "/api/v1/reservations/:id/status", tested: true },
  { method: "POST", path: "/api/v1/reservations/:id/owner-cancel", tested: true },
  
  // Coupons
  { method: "GET", path: "/api/v1/coupons/ownedByUser", tested: true },
  { method: "POST", path: "/api/v1/coupons/purchase", tested: true },
  { method: "GET", path: "/api/v1/coupons/available", tested: true },
  { method: "GET", path: "/api/v1/coupons/purchased/restaurants", tested: true },
  { method: "POST", path: "/api/v1/coupons/creation", tested: true },
  { method: "PATCH", path: "/api/v1/coupons/edit", tested: true },
  { method: "DELETE", path: "/api/v1/coupons/delete", tested: true },
  { method: "POST", path: "/api/v1/coupons/:couponId/purchase", tested: true },
  { method: "PATCH", path: "/api/v1/coupons/:couponId", tested: true },
  { method: "DELETE", path: "/api/v1/coupons/:couponId", tested: true },
  
  // Menu Items
  { method: "POST", path: "/api/v1/menuItems", tested: true },
  { method: "PATCH", path: "/api/v1/menuItems/:id", tested: true },
  { method: "PUT", path: "/api/v1/menuItems/:id", tested: true },
  { method: "DELETE", path: "/api/v1/menuItems/:id", tested: true },
  { method: "POST", path: "/api/v1/menuItems/:id/delete", tested: true },
  
  // Special Menus
  { method: "POST", path: "/api/v1/specialMenus", tested: true },
  { method: "PATCH", path: "/api/v1/specialMenus/:id", tested: true },
  { method: "PUT", path: "/api/v1/specialMenus/:id", tested: true },
  { method: "DELETE", path: "/api/v1/specialMenus/:id", tested: true },
  
  // Special Menu Items
  { method: "POST", path: "/api/v1/special-menu-items", tested: true },
  { method: "DELETE", path: "/api/v1/special-menu-items", tested: true },
  
  // Testimonials
  { method: "GET", path: "/api/v1/testimonials/all", tested: true },
  
  // Health Check
  { method: "GET", path: "/healthz", tested: true },
];

function generateChecklist() {
  const tested = allRoutes.filter((r) => r.tested).length;
  const total = allRoutes.length;
  const coverage = ((tested / total) * 100).toFixed(1);

  const markdown = `# Test Coverage Checklist

**Generated:** ${new Date().toISOString()}
**Total Endpoints:** ${total}
**Tested Endpoints:** ${tested}
**Coverage:** ${coverage}%

---

## Test Summary

### Integration Tests
${testFiles.integration.map((tf) => `- ✅ ${tf.file}`).join("\n")}

### Unit Tests
${testFiles.unit.map((tf) => `- ✅ ${tf.file}`).join("\n")}

---

## Endpoint Coverage

${allRoutes
  .map(
    (route) =>
      `${route.tested ? "✅" : "❌"} **${route.method}** \`${route.path}\``
  )
  .join("\n")}

---

## Test Categories

### ✅ Fully Tested Endpoints

${allRoutes
  .filter((r) => r.tested)
  .map((r) => `- \`${r.method} ${r.path}\``)
  .join("\n")}

### ❌ Endpoints Needing Tests

${allRoutes
  .filter((r) => !r.tested)
  .map((r) => `- \`${r.method} ${r.path}\``)
  .join("\n")}

---

## Test Execution

Run tests with:
\`\`\`bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage
\`\`\`

---

## Notes

- ✅ = Endpoint has comprehensive tests (status codes, validation, errors)
- ❌ = Endpoint needs test coverage
- Tests verify: status codes, input validation, error handling, response data
`;

  return markdown;
}

// Generate and save checklist
const checklist = generateChecklist();
fs.writeFileSync(
  path.join(__dirname, "../docs/TEST_CHECKLIST.md"),
  checklist
);

console.log("✅ Test checklist generated at docs/TEST_CHECKLIST.md");
console.log(`📊 Coverage: ${((allRoutes.filter((r) => r.tested).length / allRoutes.length) * 100).toFixed(1)}%`);

module.exports = { generateChecklist, allRoutes };

