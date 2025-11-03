# Test Coverage Checklist

**Generated:** 2025-11-02T11:33:04.801Z
**Total Endpoints:** 73
**Tested Endpoints:** 61
**Coverage:** 83.6%

---

## Test Summary

### Integration Tests
- ✅ auth.test.js
- ✅ user.test.js
- ✅ user-edge-cases.test.js
- ✅ owner.test.js
- ✅ restaurant.test.js
- ✅ reservations.test.js
- ✅ coupons.test.js
- ✅ admin.test.js
- ✅ menuItems.test.js
- ✅ specialMenus.test.js
- ✅ specialMenuItems.test.js
- ✅ testimonials.test.js
- ✅ health.test.js
- ✅ additional-endpoints.test.js

### Unit Tests
- ✅ controllers/userController.test.js
- ✅ controllers/ownerController.test.js
- ✅ controllers/couponsController.test.js
- ✅ controllers/reservationsController.test.js
- ✅ controllers/menuItemsController.test.js
- ✅ utils/jwtHelper.test.js

---

## Endpoint Coverage

✅ **GET** `/api/v1/auth/status`
✅ **POST** `/api/v1/user/register`
✅ **POST** `/api/v1/user/login`
✅ **GET** `/api/v1/user/profile`
✅ **PATCH** `/api/v1/user/update`
✅ **GET** `/api/v1/user/points`
✅ **GET** `/api/v1/user/favorites`
✅ **POST** `/api/v1/user/favorites/toggle`
❌ **GET** `/api/v1/user/verify-email`
❌ **POST** `/api/v1/user/resend-verification`
✅ **POST** `/api/v1/user/password/reset/request`
❌ **POST** `/api/v1/user/password/reset`
❌ **POST** `/api/v1/user/password/reset/validate/token`
✅ **GET** `/api/v1/user/logout`
❌ **GET** `/api/v1/user/auth/google`
❌ **GET** `/api/v1/user/auth/google/callback`
❌ **GET** `/api/v1/user/auth/facebook`
❌ **GET** `/api/v1/user/auth/facebook/callback`
✅ **POST** `/api/v1/owner/register`
✅ **POST** `/api/v1/owner/login`
✅ **GET** `/api/v1/owner/profile`
✅ **PATCH** `/api/v1/owner/update`
❌ **GET** `/api/v1/owner/verify-email`
❌ **POST** `/api/v1/owner/resend-verification`
✅ **GET** `/api/v1/owner/auth/status`
✅ **GET** `/api/v1/owner/logout`
✅ **POST** `/api/v1/owner/password/reset/request`
❌ **POST** `/api/v1/owner/password/reset`
❌ **POST** `/api/v1/owner/password/reset/validate/token`
✅ **POST** `/api/v1/admin/register`
✅ **POST** `/api/v1/admin/login`
✅ **POST** `/api/v1/admin/createRestaurant`
✅ **GET** `/api/v1/restaurant/trending`
✅ **GET** `/api/v1/restaurant/discounted`
✅ **GET** `/api/v1/restaurant`
✅ **GET** `/api/v1/restaurant/:id`
✅ **GET** `/api/v1/restaurant/id/:id`
✅ **PATCH** `/api/v1/restaurant/:id`
✅ **GET** `/api/v1/restaurant/owner`
✅ **GET** `/api/v1/restaurant/owner/overview`
✅ **GET** `/api/v1/reservations`
✅ **GET** `/api/v1/reservations/filter`
✅ **GET** `/api/v1/reservations/:id`
✅ **POST** `/api/v1/reservations`
✅ **POST** `/api/v1/reservations/:id/cancel`
✅ **DELETE** `/api/v1/reservations/:id`
✅ **GET** `/api/v1/reservations/owner`
✅ **PATCH** `/api/v1/reservations/owner/status`
✅ **PATCH** `/api/v1/reservations/:id/status`
✅ **POST** `/api/v1/reservations/:id/owner-cancel`
✅ **GET** `/api/v1/coupons/ownedByUser`
✅ **POST** `/api/v1/coupons/purchase`
✅ **GET** `/api/v1/coupons/available`
✅ **GET** `/api/v1/coupons/purchased/restaurants`
✅ **POST** `/api/v1/coupons/creation`
✅ **PATCH** `/api/v1/coupons/edit`
✅ **DELETE** `/api/v1/coupons/delete`
✅ **POST** `/api/v1/coupons/:couponId/purchase`
✅ **PATCH** `/api/v1/coupons/:couponId`
✅ **DELETE** `/api/v1/coupons/:couponId`
✅ **POST** `/api/v1/menuItems`
✅ **PATCH** `/api/v1/menuItems/:id`
✅ **PUT** `/api/v1/menuItems/:id`
✅ **DELETE** `/api/v1/menuItems/:id`
✅ **POST** `/api/v1/menuItems/:id/delete`
✅ **POST** `/api/v1/specialMenus`
✅ **PATCH** `/api/v1/specialMenus/:id`
✅ **PUT** `/api/v1/specialMenus/:id`
✅ **DELETE** `/api/v1/specialMenus/:id`
✅ **POST** `/api/v1/special-menu-items`
✅ **DELETE** `/api/v1/special-menu-items`
✅ **GET** `/api/v1/testimonials/all`
✅ **GET** `/healthz`

---

## Test Categories

### ✅ Fully Tested Endpoints

- `GET /api/v1/auth/status`
- `POST /api/v1/user/register`
- `POST /api/v1/user/login`
- `GET /api/v1/user/profile`
- `PATCH /api/v1/user/update`
- `GET /api/v1/user/points`
- `GET /api/v1/user/favorites`
- `POST /api/v1/user/favorites/toggle`
- `POST /api/v1/user/password/reset/request`
- `GET /api/v1/user/logout`
- `POST /api/v1/owner/register`
- `POST /api/v1/owner/login`
- `GET /api/v1/owner/profile`
- `PATCH /api/v1/owner/update`
- `GET /api/v1/owner/auth/status`
- `GET /api/v1/owner/logout`
- `POST /api/v1/owner/password/reset/request`
- `POST /api/v1/admin/register`
- `POST /api/v1/admin/login`
- `POST /api/v1/admin/createRestaurant`
- `GET /api/v1/restaurant/trending`
- `GET /api/v1/restaurant/discounted`
- `GET /api/v1/restaurant`
- `GET /api/v1/restaurant/:id`
- `GET /api/v1/restaurant/id/:id`
- `PATCH /api/v1/restaurant/:id`
- `GET /api/v1/restaurant/owner`
- `GET /api/v1/restaurant/owner/overview`
- `GET /api/v1/reservations`
- `GET /api/v1/reservations/filter`
- `GET /api/v1/reservations/:id`
- `POST /api/v1/reservations`
- `POST /api/v1/reservations/:id/cancel`
- `DELETE /api/v1/reservations/:id`
- `GET /api/v1/reservations/owner`
- `PATCH /api/v1/reservations/owner/status`
- `PATCH /api/v1/reservations/:id/status`
- `POST /api/v1/reservations/:id/owner-cancel`
- `GET /api/v1/coupons/ownedByUser`
- `POST /api/v1/coupons/purchase`
- `GET /api/v1/coupons/available`
- `GET /api/v1/coupons/purchased/restaurants`
- `POST /api/v1/coupons/creation`
- `PATCH /api/v1/coupons/edit`
- `DELETE /api/v1/coupons/delete`
- `POST /api/v1/coupons/:couponId/purchase`
- `PATCH /api/v1/coupons/:couponId`
- `DELETE /api/v1/coupons/:couponId`
- `POST /api/v1/menuItems`
- `PATCH /api/v1/menuItems/:id`
- `PUT /api/v1/menuItems/:id`
- `DELETE /api/v1/menuItems/:id`
- `POST /api/v1/menuItems/:id/delete`
- `POST /api/v1/specialMenus`
- `PATCH /api/v1/specialMenus/:id`
- `PUT /api/v1/specialMenus/:id`
- `DELETE /api/v1/specialMenus/:id`
- `POST /api/v1/special-menu-items`
- `DELETE /api/v1/special-menu-items`
- `GET /api/v1/testimonials/all`
- `GET /healthz`

### ❌ Endpoints Needing Tests

- `GET /api/v1/user/verify-email`
- `POST /api/v1/user/resend-verification`
- `POST /api/v1/user/password/reset`
- `POST /api/v1/user/password/reset/validate/token`
- `GET /api/v1/user/auth/google`
- `GET /api/v1/user/auth/google/callback`
- `GET /api/v1/user/auth/facebook`
- `GET /api/v1/user/auth/facebook/callback`
- `GET /api/v1/owner/verify-email`
- `POST /api/v1/owner/resend-verification`
- `POST /api/v1/owner/password/reset`
- `POST /api/v1/owner/password/reset/validate/token`

---

## Test Execution

Run tests with:
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage
```

---

## Notes

- ✅ = Endpoint has comprehensive tests (status codes, validation, errors)
- ❌ = Endpoint needs test coverage
- Tests verify: status codes, input validation, error handling, response data
