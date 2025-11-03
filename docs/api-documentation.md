# Yummy API Documentation

**Base URL:** `http://localhost:5000` (development)  
**API Version:** `v1`  
**Full Base Path:** `/api/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Owner Management](#owner-management)
4. [Admin Management](#admin-management)
5. [Restaurant Management](#restaurant-management)
6. [Reservations](#reservations)
7. [Coupons](#coupons)
8. [Menu Items](#menu-items)
9. [Special Menus](#special-menus)
10. [Testimonials](#testimonials)
11. [Health Check](#health-check)

---

## Authentication

All authenticated endpoints use **HTTP-only cookies** for JWT token storage. The token is automatically included in requests by the browser/client.

### Authentication Flow

1. **Register** or **Login** → Server sets `token` cookie
2. Subsequent requests automatically include cookie
3. **Logout** → Cookie is cleared

### Authentication Status

**Endpoint:** `GET /api/v1/auth/status`

Check authentication status for any user type (user, owner, admin).

**Headers:** None required (cookie sent automatically)

**Response (200 OK):**
```json
{
  "loggedIn": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "confirmed_user": true
  }
}
```

**Response (200 OK - Not Authenticated):**
```json
{
  "loggedIn": false,
  "user": null
}
```

---

## User Management

### Register User

**Endpoint:** `POST /api/v1/user/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "customer",
  "newsletter_subscribed": true
}
```

**Validation Rules:**
- `name`: Required, string, min 3, max 100 characters
- `email`: Required, valid email format
- `password`: Required, min 8 characters (if no `google_id` or `facebook_id`)
- `phone`: Optional, max 50 characters
- `role`: Required, string
- `newsletter_subscribed`: Optional, boolean

**Success Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "customer",
    "confirmed_user": false
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or user already exists
- `500 Internal Server Error`: Server error

**Note:** Token is set in HTTP-only cookie automatically.

---

### Login User

**Endpoint:** `POST /api/v1/user/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "customer",
    "confirmed_user": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid credentials or validation error
- `500 Internal Server Error`: Server error

---

### Get User Profile

**Endpoint:** `GET /api/v1/user/profile`

Get authenticated user's profile.

**Headers:** Authentication cookie (automatically included)

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "role": "customer",
  "confirmed_user": true,
  "profile_image": null
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token

---

### Update User Profile

**Endpoint:** `PATCH /api/v1/user/update`

Update user profile. All fields are optional.

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "newemail@example.com",
  "phone": "+9876543210",
  "password": "newpassword123"
}
```

**Validation Rules:**
- `name`: Optional, string, min 1, max 100 characters
- `email`: Optional, valid email format, max 255 characters
- `password`: Optional, min 8 characters
- `phone`: Optional, max 50 characters

**Success Response (200 OK):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "name": "John Updated",
    "email": "newemail@example.com",
    "phone": "+9876543210"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid or missing token

---

### Get User Points

**Endpoint:** `GET /api/v1/user/points`

Get user's loyalty points.

**Success Response (200 OK):**
```json
{
  "user_id": 1,
  "loyalty_points": 150
}
```

---

### Get User Favorites

**Endpoint:** `GET /api/v1/user/favorites`

Get paginated list of favorite restaurants.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Success Response (200 OK):**
```json
{
  "user_id": 1,
  "favoriteRestaurants": [
    {
      "id": 1,
      "name": "Restaurant Name",
      "location": "City",
      "cuisine": "Italian"
    }
  ],
  "Pagination": {
    "currentPage": 1,
    "recordsOnCurrentPage": 5,
    "viewedRecords": 5,
    "remainingRecords": 0,
    "total": 5
  }
}
```

---

### Toggle Favorite Restaurant

**Endpoint:** `POST /api/v1/user/favorites/toggle`

Add or remove restaurant from favorites.

**Request Body:**
```json
{
  "restaurant_id": 1
}
```

**Success Response (201 Created - Added):**
```json
{
  "added": true
}
```

**Success Response (200 OK - Removed):**
```json
{
  "removed": true
}
```

---

### Verify Email

**Endpoint:** `GET /api/v1/user/verify-email`

Verify user email using token from verification email.

**Query Parameters:**
- `token` (required): JWT token from verification email

**Success Response:** Redirects to frontend success page

**Error Responses:**
- `400 Bad Request`: Invalid or expired token

---

### Resend Verification Email

**Endpoint:** `POST /api/v1/user/resend-verification`

Resend email verification link.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Verification email sent"
}
```

---

### Request Password Reset

**Endpoint:** `POST /api/v1/user/password/reset/request`

Request password reset email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

---

### Reset Password

**Endpoint:** `POST /api/v1/user/password/reset`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired token
- `400 Bad Request`: Password validation failed

---

### Validate Password Reset Token

**Endpoint:** `POST /api/v1/user/password/reset/validate/token`

Validate if password reset token is valid.

**Request Body:**
```json
{
  "token": "reset_token_from_email"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Token is valid"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired token

---

### Logout

**Endpoint:** `GET /api/v1/user/logout`

Logout user (clears authentication cookie).

**Success Response:** Redirects to home page

---

## Owner Management

### Register Owner

**Endpoint:** `POST /api/v1/owner/register`

Register a new restaurant owner.

**Request Body:**
```json
{
  "name": "Restaurant Owner",
  "email": "owner@restaurant.com",
  "password": "ownerpass123",
  "phone": "+1234567890",
  "role": "owner",
  "newsletter_subscribed": false
}
```

**Validation:** Same as user registration

**Success Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "Restaurant Owner",
    "email": "owner@restaurant.com",
    "role": "owner"
  }
}
```

---

### Login Owner

**Endpoint:** `POST /api/v1/owner/login`

Login as restaurant owner.

**Request Body:**
```json
{
  "email": "owner@restaurant.com",
  "password": "ownerpass123"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Restaurant Owner",
    "email": "owner@restaurant.com",
    "role": "owner"
  }
}
```

---

### Get Owner Profile

**Endpoint:** `GET /api/v1/owner/profile`

Get authenticated owner's profile.

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "Restaurant Owner",
  "email": "owner@restaurant.com",
  "phone": "+1234567890",
  "role": "owner",
  "confirmed_user": true
}
```

---

### Update Owner Profile

**Endpoint:** `PATCH /api/v1/owner/update`

Update owner profile.

**Request Body:**
```json
{
  "name": "Updated Owner Name",
  "phone": "+9876543210"
}
```

**Validation:** Same as user update

---

## Admin Management

### Register Admin

**Endpoint:** `POST /api/v1/admin/register`

Register a new admin user.

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@yummy.com",
  "password": "AdminPass123"
}
```

**Validation Rules:**
- `name`: Required, string, min 3, max 50 characters
- `email`: Required, valid email format
- `password`: Required, min 8 characters, must contain at least one letter and one number

**Success Response (201 Created):**
```json
{
  "message": "Admin registered successfully",
  "admin": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@yummy.com"
  }
}
```

---

### Login Admin

**Endpoint:** `POST /api/v1/admin/login`

Login as admin.

**Request Body:**
```json
{
  "email": "admin@yummy.com",
  "password": "AdminPass123"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "admin": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@yummy.com",
    "role": "admin"
  }
}
```

---

### Create Restaurant (Admin)

**Endpoint:** `POST /api/v1/admin/createRestaurant`

Create a new restaurant. **Admin only.**

**Request Body:**
```json
{
  "name": "New Restaurant",
  "location": "Athens",
  "cuisine": "Italian",
  "address": {
    "street": "Main Street",
    "number": "123",
    "postalCode": "10431",
    "area": "City Center"
  },
  "coordinates": {
    "lat": 37.9838,
    "lng": 23.7275
  },
  "openingHours": {
    "open": "11:00",
    "close": "23:00"
  },
  "contact": {
    "phone": "+302101234567",
    "email": "restaurant@example.com",
    "socialMedia": {
      "facebook": "https://facebook.com/restaurant",
      "instagram": "https://instagram.com/restaurant"
    }
  },
  "owner_id": 1
}
```

**Validation Rules:**
- `name`: Required, string, min 3, max 100 characters
- `location`: Required, string, min 3, max 100 characters
- `cuisine`: Required, string, min 2, max 50 characters
- `address`: Required object with `street`, `number`, `postalCode`, `area`
- `coordinates`: Required object with `lat` (number) and `lng` (number)
- `openingHours`: Required object with `open` and `close` (HH:mm format)
- `contact`: Required object with `phone`, `email`, `socialMedia`
- `owner_id`: Required, integer

**Success Response (201 Created):**
```json
{
  "message": "Restaurant created successfully",
  "restaurant": {
    "id": 1,
    "name": "New Restaurant",
    "location": "Athens",
    "cuisine": "Italian"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: No token provided
- `403 Forbidden`: Not an admin
- `400 Bad Request`: Validation error

---

## Restaurant Management

### Get Trending Restaurants

**Endpoint:** `GET /api/v1/restaurant/trending`

Get trending restaurants ordered by rating.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Success Response (200 OK):**
```json
{
  "restaurants": [...],
  "Pagination": {
    "currentPage": 1,
    "recordsOnCurrentPage": 10,
    "total": 50
  }
}
```

**Note:** This endpoint is cached for 15 minutes.

---

### Get Discounted Restaurants

**Endpoint:** `GET /api/v1/restaurant/discounted`

Get restaurants with special menus/discounts.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Success Response (200 OK):**
```json
{
  "restaurants": [...],
  "Pagination": {...}
}
```

**Note:** This endpoint is cached for 15 minutes.

---

### Get Filtered Restaurants

**Endpoint:** `GET /api/v1/restaurant`

Get filtered list of restaurants with pagination.

**Query Parameters:**
- `cuisine` (optional): Filter by cuisine type
- `location` (optional): Filter by location
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Example:** `/api/v1/restaurant?cuisine=Italian&location=Athens&page=1&pageSize=10`

**Success Response (200 OK):**
```json
{
  "restaurants": [...],
  "Pagination": {...}
}
```

**Note:** This endpoint is cached for 15 minutes.

---

### Get Restaurant by ID

**Endpoint:** `GET /api/v1/restaurant/:id`

Get restaurant details by ID.

**Path Parameters:**
- `id` (required): Restaurant ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "Restaurant Name",
  "location": "Athens",
  "cuisine": "Italian",
  "address": {...},
  "coordinates": {...},
  "openingHours": {...},
  "contact": {...},
  "rating": 4.5,
  "total_reviews": 120
}
```

**Note:** This endpoint is cached for 15 minutes.

---

### Update Restaurant Contact

**Endpoint:** `PATCH /api/v1/restaurant/:id`

Update restaurant contact information. **Owner only.**

**Path Parameters:**
- `id` (required): Restaurant ID

**Request Body:**
```json
{
  "contact": {
    "phone": "+302109876543",
    "email": "newemail@restaurant.com",
    "socialMedia": {
      "facebook": "https://facebook.com/new",
      "instagram": "https://instagram.com/new"
    }
  }
}
```

**Validation Rules:**
- `contact`: Required object
- `contact.phone`: Optional, max 50 characters
- `contact.email`: Optional, valid email format
- `contact.socialMedia`: Optional object with `facebook` and `instagram` (URI format)

**Success Response (200 OK):**
```json
{
  "message": "Restaurant updated successfully",
  "restaurant": {...}
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner of this restaurant
- `400 Bad Request`: Validation error

---

### Get Owner Restaurant

**Endpoint:** `GET /api/v1/restaurant/owner`

Get restaurant details for authenticated owner.

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "Restaurant Name",
  ...
}
```

**Error Responses:**
- `404 Not Found`: Owner has no restaurant
- `401 Unauthorized`: Invalid or missing token

---

### Get Owner Overview

**Endpoint:** `GET /api/v1/restaurant/owner/overview`

Get owner dashboard overview with statistics.

**Success Response (200 OK):**
```json
{
  "restaurant": {...},
  "statistics": {
    "total_reservations": 150,
    "pending_reservations": 5,
    "total_revenue": 15000.00
  }
}
```

---

## Reservations

### Get User Reservations

**Endpoint:** `GET /api/v1/reservations`

Get all reservations for authenticated user.

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "restaurant_id": 1,
    "date": "2024-01-20",
    "time": "19:00",
    "guest_count": 4,
    "status": "confirmed",
    "restaurant_name": "Restaurant Name"
  }
]
```

---

### Get Filtered Reservations

**Endpoint:** `GET /api/v1/reservations/filter`

Get filtered and paginated reservations for user.

**Query Parameters:**
- `status` (optional): `pending`, `confirmed`, `completed`, `cancelled`
- `date` (optional): Filter by date (YYYY-MM-DD format)
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Example:** `/api/v1/reservations/filter?status=confirmed&date=2024-01-15&page=1&pageSize=10`

**Success Response (200 OK):**
```json
{
  "reservations": [...],
  "Pagination": {
    "currentPage": 1,
    "recordsOnCurrentPage": 10,
    "total": 25
  }
}
```

---

### Get Reservation by ID

**Endpoint:** `GET /api/v1/reservations/:id`

Get single reservation by ID (user scope).

**Path Parameters:**
- `id` (required): Reservation ID

**Success Response (200 OK):**
```json
{
  "id": 1,
  "restaurant_id": 1,
  "date": "2024-01-20",
  "time": "19:00",
  "guest_count": 4,
  "status": "confirmed",
  "special_menu_id": null,
  "coupon_id": null,
  "reservation_notes": "Window seat preferred"
}
```

**Error Responses:**
- `404 Not Found`: Reservation not found or doesn't belong to user
- `401 Unauthorized`: Invalid or missing token

---

### Create Reservation

**Endpoint:** `POST /api/v1/reservations`

Create a new reservation. **User must be confirmed.**

**Request Body:**
```json
{
  "restaurant_id": 1,
  "date": "2024-01-20",
  "time": "19:00",
  "guest_count": 4,
  "status": "pending",
  "special_menu_id": null,
  "coupon_id": null,
  "reservation_notes": "Window seat preferred"
}
```

**Validation Rules:**
- `restaurant_id`: Required, integer
- `date`: Required, date format (YYYY-MM-DD)
- `time`: Required, time format (HH:mm)
- `guest_count`: Required, integer, positive
- `status`: Optional, defaults to "pending"
- `special_menu_id`: Optional, integer
- `coupon_id`: Optional, integer (coupon must be purchased and available)
- `reservation_notes`: Optional, string

**Success Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "restaurant_id": 1,
  "date": "2024-01-20",
  "time": "19:00",
  "guest_count": 4,
  "status": "pending"
}
```

**Error Responses:**
- `401 Unauthorized`: User not confirmed or invalid token
- `400 Bad Request`: Invalid coupon or special menu
- `400 Bad Request`: Coupon is not available or has already been used
- `400 Bad Request`: Special menu or coupon does not belong to the selected restaurant

---

### Cancel Reservation

**Endpoint:** `POST /api/v1/reservations/:id/cancel`

Cancel a reservation (user).

**Path Parameters:**
- `id` (required): Reservation ID

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Reservation cancelled successfully"
}
```

---

### Delete Reservation

**Endpoint:** `DELETE /api/v1/reservations/:id`

Delete a reservation (user).

**Path Parameters:**
- `id` (required): Reservation ID

**Success Response (200 OK):**
```json
{
  "message": "Reservation deleted successfully"
}
```

---

### Get Owner Filtered Reservations

**Endpoint:** `GET /api/v1/reservations/owner`

Get filtered reservations for owner across their restaurants.

**Query Parameters:**
- `status` (optional): `pending`, `confirmed`, `cancelled`, `seated`, `completed`
- `date` (optional): Filter by date (YYYY-MM-DD format)
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Success Response (200 OK):**
```json
{
  "reservations": [...],
  "Pagination": {...}
}
```

---

### Update Reservation Status (Owner)

**Endpoint:** `PATCH /api/v1/reservations/owner/status`

Update reservation status as owner.

**Request Body:**
```json
{
  "reservation_id": 1,
  "status": "confirmed",
  "cancellation_reason": null
}
```

**Validation Rules:**
- `reservation_id`: Required, integer
- `status`: Required, one of: `pending`, `confirmed`, `cancelled`, `seated`, `completed`
- `cancellation_reason`: Required if `status` is `cancelled`, otherwise optional

**Success Response (200 OK):**
```json
{
  "message": "Reservation updated successfully",
  "reservation": {...}
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status transition
- `403 Forbidden`: Not the owner of the restaurant
- `400 Bad Request`: Cancellation reason required when cancelling

---

## Coupons

### Get User Coupons

**Endpoint:** `GET /api/v1/coupons/ownedByUser`

Get paginated list of coupons owned by authenticated user.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Success Response (200 OK):**
```json
{
  "userCoupons": [
    {
      "id": 1,
      "coupon_id": 1,
      "description": "20% off on main course",
      "discount_percentage": 20,
      "status": "available",
      "restaurant_name": "Restaurant Name"
    }
  ],
  "Pagination": {
    "currentPage": 1,
    "recordsOnCurrentPage": 10,
    "viewedRecords": 10,
    "remainingRecords": 5,
    "total": 15
  }
}
```

---

### Purchase Coupon

**Endpoint:** `POST /api/v1/coupons/purchase`

Purchase a coupon using loyalty points. **User must be confirmed.**

**Request Body:**
```json
{
  "coupon_id": 1
}
```

**Success Response (201 Created):**
```json
{
  "message": "Coupon purchased successfully",
  "coupon": {
    "id": 1,
    "user_id": 1,
    "coupon_id": 1,
    "status": "available"
  },
  "remaining_points": 50
}
```

**Error Responses:**
- `401 Unauthorized`: User not confirmed
- `400 Bad Request`: Insufficient points
- `404 Not Found`: Coupon not found
- `409 Conflict`: Coupon already purchased

---

### Get Available Coupons

**Endpoint:** `GET /api/v1/coupons/available`

Get available coupons for a restaurant (not yet purchased by user).

**Query Parameters:**
- `restaurant_id` (required): Restaurant ID
- `page` (optional): Page number, default: 1
- `pageSize` (optional): Items per page, default: 10

**Success Response (200 OK):**
```json
{
  "coupons": [
    {
      "id": 1,
      "description": "20% off on main course",
      "discount_percentage": 20,
      "required_points": 100,
      "restaurant_id": 1
    }
  ],
  "Pagination": {...}
}
```

---

### Get Restaurants with Purchased Coupons

**Endpoint:** `GET /api/v1/coupons/purchased/restaurants`

Get restaurants where user has purchased coupons.

**Success Response (200 OK):**
```json
{
  "restaurants": [
    {
      "id": 1,
      "name": "Restaurant Name",
      "location": "Athens"
    }
  ]
}
```

---

### Create Coupon (Owner)

**Endpoint:** `POST /api/v1/coupons/creation`

Create a new coupon. **Owner only.**

**Request Body:**
```json
{
  "description": "20% off on main course",
  "discount_percentage": 20,
  "required_points": 100,
  "restaurant_id": 1
}
```

**Validation Rules:**
- `description`: Required, string, min 3, max 255 characters
- `discount_percentage`: Required, number, min 1, max 100
- `required_points`: Required, number, min 0
- `restaurant_id`: Required, integer

**Success Response (201 Created):**
```json
{
  "message": "Coupon created successfully",
  "coupon": {
    "id": 1,
    "description": "20% off on main course",
    "discount_percentage": 20,
    "required_points": 100,
    "restaurant_id": 1
  }
}
```

**Error Responses:**
- `403 Forbidden`: Not the owner of this restaurant
- `400 Bad Request`: Validation error

---

### Edit Coupon (Owner)

**Endpoint:** `PATCH /api/v1/coupons/edit`

Edit coupon. At least one field required.

**Request Body:**
```json
{
  "couponId": 1,
  "description": "Updated description",
  "discount_percentage": 25,
  "required_points": 150
}
```

**Validation Rules:**
- `couponId`: Required, integer
- `description`: Optional, string, min 3, max 255 characters
- `discount_percentage`: Optional, number, min 1, max 100
- `required_points`: Optional, number, min 0
- At least one of `description`, `discount_percentage`, or `required_points` must be provided

**Success Response (200 OK):**
```json
{
  "message": "Coupon updated successfully",
  "coupon": {...}
}
```

---

### Delete Coupon (Owner)

**Endpoint:** `DELETE /api/v1/coupons/delete`

Delete coupon. Cannot delete if there are unused/locked purchases.

**Request Body:**
```json
{
  "couponId": 1
}
```

**Success Response (200 OK):**
```json
{
  "message": "Coupon deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot delete coupon: there are unused or locked purchases
- `403 Forbidden`: Not the owner of this coupon

---

## Menu Items

### Create Menu Item

**Endpoint:** `POST /api/v1/menuItems`

Create a new menu item. **Owner only.**

**Request Body:**
```json
{
  "name": "Spaghetti Carbonara",
  "price": 15.50,
  "category": "Main Course",
  "description": "Traditional Italian pasta",
  "discount": 0,
  "restaurant_id": 1
}
```

**Validation Rules:**
- `name`: Required, string, min 1, max 255 characters
- `price`: Required, number, positive, 2 decimal precision
- `category`: Required, string, min 1, max 50 characters
- `description`: Optional, string
- `discount`: Optional, integer, min 0, max 100, default: 0
- `restaurant_id`: Required, integer

**Success Response (201 Created):**
```json
{
  "message": "Menu item created successfully",
  "menuItem": {
    "id": 1,
    "name": "Spaghetti Carbonara",
    "price": 15.50,
    "category": "Main Course",
    "restaurant_id": 1
  }
}
```

---

### Update Menu Item

**Endpoint:** `PATCH /api/v1/menuItems/:id`

Update menu item. **Owner only.**

**Path Parameters:**
- `id` (required): Menu item ID

**Request Body:**
```json
{
  "restaurant_id": 1,
  "name": "Updated Name",
  "price": 16.00,
  "discount": 10
}
```

**Validation:** Same as create, but all fields optional. At least one field required.

**Success Response (200 OK):**
```json
{
  "message": "Menu item updated successfully",
  "menuItem": {...}
}
```

---

### Delete Menu Item

**Endpoint:** `DELETE /api/v1/menuItems/:id`

Delete menu item. **Owner only.**

**Path Parameters:**
- `id` (required): Menu item ID

**Success Response (200 OK):**
```json
{
  "message": "Menu item deleted successfully"
}
```

---

## Special Menus

### Create Special Menu

**Endpoint:** `POST /api/v1/specialMenus`

Create a special menu. **Owner only.**

**Request Body:**
```json
{
  "name": "Valentine's Day Special",
  "description": "Romantic dinner for two",
  "discounted_price": 89.99,
  "photo_url": "https://example.com/photo.jpg",
  "restaurant_id": 1,
  "availability": {
    "type": "range",
    "date": "2024-02-14",
    "timeRange": {
      "start": "18:00",
      "end": "23:00"
    }
  }
}
```

**Validation Rules:**
- `name`: Required, string, max 255 characters
- `description`: Optional, string
- `discounted_price`: Required, number, min 0, 2 decimal precision
- `photo_url`: Optional, URI format
- `restaurant_id`: Required, integer
- `availability`: Optional object with types:
  - `permanent`: `{ type: "permanent", daysOfWeek: [0,1,2], timeRange: { start: "HH:mm", end: "HH:mm" } }`
  - `daysOfWeek`: `{ type: "daysOfWeek", daysOfWeek: [0,1,2], timeRange: { start: "HH:mm", end: "HH:mm" } }`
  - `range`: `{ type: "range", date: "YYYY-MM-DD", timeRange: { start: "HH:mm", end: "HH:mm" } }`

**Success Response (201 Created):**
```json
{
  "message": "Special menu created",
  "specialMenu": {
    "id": 1,
    "name": "Valentine's Day Special",
    "discounted_price": 89.99,
    "original_price": 120.00,
    "discount_percentage": 25
  }
}
```

**Note:** `original_price` and `discount_percentage` are computed server-side from linked menu items.

---

### Update Special Menu

**Endpoint:** `PATCH /api/v1/specialMenus/:id`

Update special menu. **Owner only.**

**Path Parameters:**
- `id` (required): Special menu ID

**Request Body:**
```json
{
  "name": "Updated Special Menu",
  "discounted_price": 99.99,
  "availability": {
    "type": "permanent",
    "daysOfWeek": [5, 6],
    "timeRange": {
      "start": "19:00",
      "end": "23:00"
    }
  }
}
```

**Validation:** Same as create, but all fields optional. At least one field required.

---

### Delete Special Menu

**Endpoint:** `DELETE /api/v1/specialMenus/:id`

Delete special menu. **Owner only.**

**Path Parameters:**
- `id` (required): Special menu ID

**Success Response (200 OK):**
```json
{
  "message": "Special menu deleted successfully"
}
```

---

### Create Special Menu Item Link

**Endpoint:** `POST /api/v1/special-menu-items`

Link a menu item to a special menu.

**Request Body:**
```json
{
  "special_menu_id": 1,
  "menu_item_id": 5
}
```

**Success Response (201 Created):**
```json
{
  "message": "Menu item linked to special menu successfully"
}
```

---

### Delete Special Menu Item Link

**Endpoint:** `DELETE /api/v1/special-menu-items`

Remove link between special menu and menu item.

**Request Body:**
```json
{
  "special_menu_id": 1,
  "menu_item_id": 5
}
```

**Success Response (200 OK):**
```json
{
  "message": "Link removed successfully"
}
```

---

## Testimonials

### Get All Testimonials

**Endpoint:** `GET /api/v1/testimonials/all`

Get paginated list of testimonials.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 10

**Success Response (200 OK):**
```json
{
  "testimonials": [
    {
      "id": 1,
      "user_name": "John Doe",
      "restaurant_name": "Restaurant Name",
      "rating": 5,
      "comment": "Great food and service!"
    }
  ],
  "Pagination": {...}
}
```

---

## Health Check

### Health Check

**Endpoint:** `GET /healthz`

Health check endpoint with database connectivity test.

**Success Response (200 OK):**
```json
{
  "ok": true,
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (503 Service Unavailable):**
```json
{
  "ok": false,
  "database": "disconnected",
  "error": "Database connection failed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "message": "Detailed error message",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized - Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden - Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "requestId": "unique-request-id",
  "message": "Error details (development only)"
}
```

---

## Authentication & Authorization

### Authentication Methods

1. **Cookie-based JWT** (Default)
   - Token stored in HTTP-only cookie named `token`
   - Automatically included in browser requests
   - For Postman/API clients, enable cookie handling

2. **OAuth 2.0** (Google & Facebook)
   - Redirect-based flow
   - Endpoints: `/api/v1/user/auth/google` and `/api/v1/user/auth/facebook`
   - Callback URLs configured in environment variables

### Authorization Levels

- **Public**: No authentication required
- **User**: Requires user authentication (role: `customer`)
- **Owner**: Requires owner authentication (role: `owner`)
- **Admin**: Requires admin authentication (role: `admin`)

### Protected Endpoints

All endpoints except the following require authentication:
- `POST /api/v1/user/register`
- `POST /api/v1/user/login`
- `POST /api/v1/owner/register`
- `POST /api/v1/owner/login`
- `POST /api/v1/admin/register`
- `POST /api/v1/admin/login`
- `GET /api/v1/restaurant/*` (public read endpoints)
- `GET /api/v1/testimonials/all`
- `GET /healthz`

---

## Rate Limiting

All endpoints are protected by rate limiting middleware. Default limits:
- **Window**: 15 minutes
- **Max requests**: 100 requests per window per IP

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when window resets

---

## Request/Response Format

### Content-Type
All requests with body must use: `Content-Type: application/json`

### Date/Time Formats
- **Date**: `YYYY-MM-DD` (e.g., `2024-01-20`)
- **Time**: `HH:mm` (24-hour format, e.g., `19:00`)
- **DateTime**: ISO 8601 format (e.g., `2024-01-20T19:00:00.000Z`)

### Pagination
Paginated responses include pagination metadata:
```json
{
  "Pagination": {
    "currentPage": 1,
    "recordsOnCurrentPage": 10,
    "viewedRecords": 10,
    "remainingRecords": 5,
    "total": 15
  }
}
```

---

## Caching

Public read endpoints are cached for performance:
- Restaurant listings: 15 minutes (900 seconds)
- Restaurant details: 15 minutes
- Cache can be invalidated by updating related resources

---

## Versioning

Current API version: **v1**

API version is included in the path: `/api/v1/...`

Future versions will be added as `/api/v2/...`, etc.

---

## Support

For API support or questions:
- Check error messages in responses
- Review request/response examples in this documentation
- Verify authentication token is valid
- Ensure required fields are provided and properly formatted

---

**Last Updated:** January 2024  
**API Version:** 1.0.0

