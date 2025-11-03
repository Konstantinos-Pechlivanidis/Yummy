# Setup Instructions

## 1. Dependencies Installed ✅

All required packages have been installed via `npm install`.

## 2. Environment Variables Configuration

Your current `.env` file uses the following format:

```env
# JWT
JWT_SECRET=your_jwt_secret_here

# Database
PGHOST=your_database_host_here
PGDATABASE=your_database_name_here
PGUSER=your_database_user_here
PGPASSWORD=your_database_password_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/user/auth/google/callback

# Environment
NODE_ENV=development
FRONT_END_URL=http://localhost:3000  # Frontend URL (different from API port)
PORT=5000

# Gmail (mail sender)
EMAIL_USER=your_email_here
EMAIL_PASS=your_email_app_password_here

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_client_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5000/user/auth/facebook/callback
```

**Important Note:** The code uses `envPORT` instead of `PORT`. Please add this line to your `.env`:

```env
envPORT=5000
```

Or change `PORT` to `envPORT` in your `.env` file.

## 3. Postman Collection ✅

A comprehensive Postman collection has been created at:
- **Location:** `docs/postman-collection.json`

### Importing the Collection:

1. Open Postman
2. Click **Import** button
3. Select `docs/postman-collection.json`
4. The collection will include:
   - All API endpoints organized by category
   - Request examples with sample JSON
   - Response examples (success and error)
   - Authentication flow examples
   - Pre-configured variables (baseUrl, apiVersion)

### Using the Collection:

1. **Set Base URL:**
   - Collection variables are pre-configured
   - Default: `http://localhost:5000`
   - Update if your server runs on a different port

2. **Authentication:**
   - Register or Login first
   - Token is stored in HTTP-only cookie
   - For Postman, enable cookie handling:
     - Go to **Settings** → **General**
     - Enable **"Automatically follow redirects"**
     - Use Postman's cookie manager

3. **Testing Endpoints:**
   - Start with User Management → Register User
   - Login to get authentication cookie
   - Test protected endpoints

## 4. API Documentation ✅

Complete API documentation has been created at:
- **Location:** `docs/api-documentation.md`

### Documentation Includes:

- ✅ All endpoint paths and HTTP methods
- ✅ Request body structures with validation rules
- ✅ Query parameters and path parameters
- ✅ Example JSON requests and responses
- ✅ HTTP status codes for all scenarios
- ✅ Error response formats
- ✅ Authentication and authorization requirements
- ✅ Rate limiting information
- ✅ Caching details
- ✅ Date/time format specifications
- ✅ Pagination format

### Quick Reference:

- **Base URL:** `http://localhost:5000`
- **API Version:** `v1`
- **Full Path:** `/api/v1`

### Key Endpoints:

**Authentication:**
- `POST /api/v1/user/register` - Register user
- `POST /api/v1/user/login` - Login user
- `GET /api/v1/user/profile` - Get profile

**Restaurants:**
- `GET /api/v1/restaurant` - List restaurants
- `GET /api/v1/restaurant/trending` - Trending restaurants
- `GET /api/v1/restaurant/:id` - Restaurant details

**Reservations:**
- `POST /api/v1/reservations` - Create reservation
- `GET /api/v1/reservations` - User reservations

**Coupons:**
- `POST /api/v1/coupons/purchase` - Purchase coupon
- `GET /api/v1/coupons/ownedByUser` - User coupons

## 5. Code Fixes ✅

### Fixed Missing Import

The `cacheMiddleware` import was missing in `routes/api/v1/restaurant.js`. This has been fixed:

```javascript
const { cacheMiddleware } = require("../../../utils/cache");
```

## Next Steps

1. **Start the Server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

2. **Test the API:**
   - Import Postman collection
   - Start with health check: `GET /healthz`
   - Register a user account
   - Test various endpoints

3. **Review Documentation:**
   - Open `docs/api-documentation.md`
   - Reference it when integrating frontend

4. **Configure Environment:**
   - Ensure `.env` file has all required variables
   - Add `envPORT=5000` if using `PORT` currently
   - Verify database connection
   - Test email sending

## Troubleshooting

### Port Configuration Issue

If you see errors about port configuration:
- The code expects `envPORT` in environment variables
- Your `.env` uses `PORT`
- **Solution:** Add `envPORT=5000` to `.env` or rename `PORT` to `envPORT`

### Authentication Not Working

- Ensure cookies are enabled in your client
- Check that JWT_SECRET is set and at least 32 characters
- Verify token is being sent in cookies (not headers)

### Database Connection Errors

- Verify PostgreSQL credentials in `.env`
- Check database server is running
- Test connection: `psql -h PGHOST -U PGUSER -d PGDATABASE`

### CORS Issues

- Ensure `FRONT_END_URL` matches your frontend URL exactly
- Check CORS configuration in `server.js`

---

**All tasks completed successfully! ✅**

