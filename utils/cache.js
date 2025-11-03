/**
 * Redis Caching Layer
 * Provides caching functionality with Redis or in-memory fallback
 */
const logger = require("./logger");

let redisClient = null;
let memoryCache = new Map();
const TTL = 3600; // Default TTL: 1 hour

/**
 * Initialize Redis client
 */
const initRedis = async () => {
  try {
    const redis = require("redis");
    const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } = process.env;

    if (!REDIS_HOST) {
      logger.warn("Redis not configured, using in-memory cache");
      return;
    }

    redisClient = redis.createClient({
      socket: {
        host: REDIS_HOST || "localhost",
        port: REDIS_PORT || 6379,
      },
      password: REDIS_PASSWORD || undefined,
      database: REDIS_DB || 0,
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error", { error: err.message });
    });

    redisClient.on("connect", () => {
      logger.info("Redis connected successfully");
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn("Failed to initialize Redis, using in-memory cache", {
      error: error.message,
    });
    redisClient = null;
  }
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached value or null
 */
const get = async (key) => {
  try {
    if (redisClient) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      // In-memory fallback
      const item = memoryCache.get(key);
      if (!item) return null;

      // Check if expired
      if (Date.now() > item.expiry) {
        memoryCache.delete(key);
        return null;
      }

      return item.value;
    }
  } catch (error) {
    logger.error("Cache get error", { key, error: error.message });
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 * @returns {Promise<boolean>} Success status
 */
const set = async (key, value, ttl = TTL) => {
  try {
    if (redisClient) {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } else {
      // In-memory fallback
      memoryCache.set(key, {
        value,
        expiry: Date.now() + ttl * 1000,
      });
      return true;
    }
  } catch (error) {
    logger.error("Cache set error", { key, error: error.message });
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
const del = async (key) => {
  try {
    if (redisClient) {
      await redisClient.del(key);
      return true;
    } else {
      memoryCache.delete(key);
      return true;
    }
  } catch (error) {
    logger.error("Cache delete error", { key, error: error.message });
    return false;
  }
};

/**
 * Delete multiple keys by pattern
 * @param {string} pattern - Key pattern (e.g., "user:*")
 * @returns {Promise<number>} Number of keys deleted
 */
const delByPattern = async (pattern) => {
  try {
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return keys.length;
    } else {
      // In-memory fallback
      let count = 0;
      for (const key of memoryCache.keys()) {
        if (key.match(pattern.replace("*", ".*"))) {
          memoryCache.delete(key);
          count++;
        }
      }
      return count;
    }
  } catch (error) {
    logger.error("Cache delete by pattern error", { pattern, error: error.message });
    return 0;
  }
};

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = TTL) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl || req.url}`;
    const cached = await get(cacheKey);

    if (cached) {
      logger.debug("Cache hit", { key: cacheKey });
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to cache the response
    res.json = function (data) {
      set(cacheKey, data, ttl).catch((err) => {
        logger.error("Failed to cache response", { key: cacheKey, error: err.message });
      });
      return originalJson(data);
    };

    next();
  };
};

/**
 * Invalidate cache for specific patterns
 * Useful for cache invalidation after updates
 */
const invalidateCache = {
  user: async (userId) => {
    await delByPattern(`user:${userId}*`);
    await delByPattern(`cache:/api/v1/user/*`);
  },
  restaurant: async (restaurantId) => {
    await del(`restaurant:${restaurantId}`);
    await delByPattern(`cache:/api/v1/restaurant/*`);
    await delByPattern(`cache:/api/v1/restaurant/${restaurantId}*`);
  },
  reservation: async (userId, reservationId) => {
    await delByPattern(`reservation:${userId}*`);
    await delByPattern(`cache:/api/v1/reservations/*`);
  },
};

module.exports = {
  initRedis,
  get,
  set,
  del,
  delByPattern,
  cacheMiddleware,
  invalidateCache,
};

