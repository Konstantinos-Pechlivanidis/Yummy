# 🍽️ Yummy - Restaurant Reservation API

Yummy is a production-ready RESTful API built with Express.js designed for managing restaurant reservations, menus, and promotional offers.  
It offers secure, role-based access for **users**, **restaurant owners**, and **admins**, with complete authentication and authorization flows.

---

## 🌟 Features

- **User Authentication**: JWT (via HTTP-only cookies), Google OAuth, and Facebook OAuth
- **Role-Based Access Control**: Distinct routes for users, restaurant owners, and admins
- **Restaurant Management**: Owners can manage menus, special offers, coupons, and reservations
- **Reservation System**: Users can make and cancel bookings; owners can manage them
- **Loyalty Points & Coupons**: Users earn points and can purchase discount coupons
- **Rate Limiting**: Protects API from abuse with request throttling
- **Input Validation & Sanitization**: Comprehensive validation and XSS protection
- **Structured Logging**: Winston-based logging with rotation
- **Caching**: Redis integration for improved performance
- **Error Tracking**: Sentry integration for production monitoring
- **Comprehensive Testing**: 83.6% test coverage with unit and integration tests

---

## 🛠 Technologies Used

- **Backend**: Node.js 18+, Express.js 4.x
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT, Google OAuth (`passport-google-oauth20`), Facebook OAuth (`passport-facebook`)
- **Validation**: Joi
- **Security**: bcrypt.js, helmet, cors, rate-limiter-flexible, input sanitization
- **Logging**: Winston with daily rotation
- **Caching**: Redis (optional, with in-memory fallback)
- **Monitoring**: Sentry (optional)
- **Testing**: Jest, Supertest
- **Email**: Nodemailer (Gmail SMTP)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/AthanasiosOikonomou/Yummy.git
cd Yummy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=1d

# Database Configuration
PGHOST=your_postgres_host
PGDATABASE=your_database_name
PGUSER=your_database_user
PGPASSWORD=your_database_password

# Server Configuration
NODE_ENV=development
FRONT_END_URL=http://localhost:3000
envPORT=5000

# Email Configuration (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/user/auth/google/callback

# Facebook OAuth (Optional)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/v1/user/auth/facebook/callback

# Optional: Monitoring & Caching
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# REDIS_URL=redis://localhost:6379
# LOG_LEVEL=info
```

**Note:** The application uses `envPORT` for the server port. You can also set `PORT`, but `envPORT` takes precedence.

See `docs/SETUP_INSTRUCTIONS.md` for detailed configuration instructions.

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will validate environment variables on startup and exit if any required variables are missing.

---

## 🔗 API Endpoints

### Base URL
All endpoints are prefixed with `/api/v1`.

### 📚 Complete Documentation

For detailed API documentation with request/response examples, see:
- **[API Documentation](./docs/api-documentation.md)** - Complete endpoint reference
- **[Postman Collection](./docs/postman-collection.json)** - Import into Postman for testing

### Quick Reference

#### 🔐 Authentication
- `GET /api/v1/auth/status` - Check authentication status

#### 👤 User Management
- `POST /api/v1/user/register` - Register new user
- `POST /api/v1/user/login` - Login user
- `GET /api/v1/user/profile` - Get user profile
- `PATCH /api/v1/user/update` - Update user profile
- `GET /api/v1/user/points` - Get loyalty points
- `GET /api/v1/user/favorites` - Get favorite restaurants
- `POST /api/v1/user/favorites/toggle` - Toggle favorite restaurant
- `GET /api/v1/user/logout` - Logout user

#### 👨‍🍳 Owner Management
- `POST /api/v1/owner/register` - Register new owner
- `POST /api/v1/owner/login` - Login owner
- `GET /api/v1/owner/profile` - Get owner profile
- `PATCH /api/v1/owner/update` - Update owner profile

#### 🛡️ Admin Management
- `POST /api/v1/admin/register` - Register new admin
- `POST /api/v1/admin/login` - Login admin
- `POST /api/v1/admin/createRestaurant` - Create restaurant (admin only)

#### 🍽️ Restaurant Management
- `GET /api/v1/restaurant` - Get filtered restaurants
- `GET /api/v1/restaurant/trending` - Get trending restaurants
- `GET /api/v1/restaurant/discounted` - Get discounted restaurants
- `GET /api/v1/restaurant/:id` - Get restaurant by ID
- `GET /api/v1/restaurant/owner` - Get owner's restaurant
- `GET /api/v1/restaurant/owner/overview` - Get owner overview with statistics
- `PATCH /api/v1/restaurant/:id` - Update restaurant contact (owner only)

#### 📅 Reservations
- `GET /api/v1/reservations` - Get user reservations
- `GET /api/v1/reservations/filter` - Get filtered reservations
- `GET /api/v1/reservations/:id` - Get reservation by ID
- `POST /api/v1/reservations` - Create reservation
- `POST /api/v1/reservations/:id/cancel` - Cancel reservation
- `DELETE /api/v1/reservations/:id` - Delete reservation
- `GET /api/v1/reservations/owner` - Get owner reservations
- `PATCH /api/v1/reservations/owner/status` - Update reservation status (owner)

#### 🎟️ Coupons
- `GET /api/v1/coupons/available` - Get available coupons
- `GET /api/v1/coupons/ownedByUser` - Get user's purchased coupons
- `POST /api/v1/coupons/purchase` - Purchase coupon
- `GET /api/v1/coupons/purchased/restaurants` - Get restaurants with purchased coupons
- `POST /api/v1/coupons/creation` - Create coupon (owner)
- `PATCH /api/v1/coupons/edit` - Edit coupon (owner)
- `DELETE /api/v1/coupons/delete` - Delete coupon (owner)

#### 🍲 Menu Items
- `POST /api/v1/menuItems` - Create menu item (owner)
- `PATCH /api/v1/menuItems/:id` - Update menu item (owner)
- `DELETE /api/v1/menuItems/:id` - Delete menu item (owner)

#### 🎯 Special Menus
- `POST /api/v1/specialMenus` - Create special menu (owner)
- `PATCH /api/v1/specialMenus/:id` - Update special menu (owner)
- `DELETE /api/v1/specialMenus/:id` - Delete special menu (owner)
- `POST /api/v1/special-menu-items` - Link menu item to special menu
- `DELETE /api/v1/special-menu-items` - Remove menu item link

#### 💬 Testimonials
- `GET /api/v1/testimonials/all` - Get all testimonials

#### ❤️ Health Check
- `GET /healthz` - Health check with database connectivity test

---

## 🧪 Testing

### Run Tests

```bash
# All tests with coverage
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Generate test checklist
npm run test:checklist
```

### Test Coverage

- **Current Coverage**: 83.6% (61/73 endpoints)
- **Test Files**: 20 files (14 integration, 6 unit)
- **Test Cases**: 250+

See [Testing Documentation](./tests/README.md) and [Test Checklist](./docs/TEST_CHECKLIST.md) for details.

---

## 📚 Documentation

### Getting Started
- **[Setup Instructions](./docs/SETUP_INSTRUCTIONS.md)** - Detailed setup guide
- **[API Documentation](./docs/api-documentation.md)** - Complete API reference
- **[Postman Collection](./docs/postman-collection.json)** - Ready-to-use API collection

### Production
- **[Production Deployment Guide](./docs/DEPLOYMENT.md)** - Step-by-step deployment
- **[Production Readiness](./README_PRODUCTION.md)** - Production features overview
- **[Production Checklist](./PRODUCTION_CHECKLIST.md)** - Deployment checklist

### Testing
- **[Testing Guide](./tests/README.md)** - Testing documentation
- **[Test Checklist](./docs/TEST_CHECKLIST.md)** - Test coverage report
- **[Testing Summary](./docs/TESTING_FINAL_REPORT.md)** - Testing implementation summary

---

## 🏗 Architecture

```
├── config/          # Configuration files (database, env validation)
├── controllers/     # Business logic handlers
├── middleware/      # Express middleware (auth, rate limiting, etc.)
├── routes/          # API route definitions
├── queries/         # Database query functions
├── utils/           # Utility functions (logger, JWT, sanitizer, cache, sentry)
├── validators/      # Input validation schemas (Joi)
├── tests/           # Test files (unit + integration)
└── docs/            # Documentation
```

---

## 🔒 Security Features

- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ Input validation with Joi
- ✅ Input sanitization (XSS protection)
- ✅ SQL injection protection (parameterized queries)
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Environment variable validation
- ✅ Request ID tracking

---

## 📊 Production Features

- ✅ **Structured Logging**: Winston with daily rotation
- ✅ **Error Tracking**: Sentry integration
- ✅ **Caching**: Redis with in-memory fallback
- ✅ **Monitoring**: Health check endpoint
- ✅ **Database Pooling**: Optimized connection management
- ✅ **CI/CD**: GitHub Actions pipeline
- ✅ **Testing**: Comprehensive test suite (83.6% coverage)

---

## 🚀 Deployment

See [Production Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

### Quick Deploy with PM2

```bash
npm ci --production
npm test  # Ensure all tests pass
pm2 start server.js --name yummy-api
pm2 save
pm2 startup
```

---

## 🏗 Middleware

- **Authentication**: `cookieJWTAuth.js` - JWT token verification
- **Rate Limiting**: `rateLimiter.js` - Request throttling
- **Error Handling**: `asyncHandler.js` - Centralized async error handling
- **Request Tracking**: `requestId.js` - Unique request ID generation
- **Input Sanitization**: Automatic request body sanitization
- **Logging**: Winston-based structured logging
- **Security**: Helmet, CORS, input validation

---

## 📈 Performance

- ✅ Response compression
- ✅ Redis caching for public endpoints
- ✅ Database connection pooling
- ✅ Pagination for list endpoints
- ✅ Efficient database queries
- ✅ Rate limiting

---

## 🔄 CI/CD

Automated testing and deployment via GitHub Actions:
- ✅ Automated testing on push/PR
- ✅ Security scanning (npm audit)
- ✅ Code coverage reporting
- ✅ Database service container for testing

---

## 📝 License

[Your License]

---

## 👥 Contributors

Developed by Athanasios Oikonomou

---

## 📞 Support

For issues, questions, or contributions:
- Review [API Documentation](./docs/api-documentation.md)
- Check [Setup Instructions](./docs/SETUP_INSTRUCTIONS.md)
- See [Testing Guide](./tests/README.md)

---

**Status:** ✅ **Production Ready**  
**Test Coverage:** 83.6%  
**API Version:** v1  
**Last Updated:** 2024
