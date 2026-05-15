/**
 * Redis Configuration
 * Handles Redis connection and caching operations
 * Provides high-performance caching layer for frequently accessed data
 */

const Redis = require("ioredis");

/**
 * Redis client instance
 * Configured for optimal performance and reliability
 */
let redisClient = null;

/**
 * Initialize Redis connection
 * Connects to Redis server with retry strategy
 * @returns {Redis} Redis client instance
 */
const initializeRedis = () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on("connect", () => {
      console.log("Redis connected successfully");
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis reconnecting...");
    });

    return redisClient;
  } catch (error) {
    console.error("Redis initialization error:", error);
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis|null} Redis client or null if not initialized
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * Close Redis connection gracefully
 * Used during application shutdown
 * @returns {Promise<void>}
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log("Redis connection closed");
  }
};

/**
 * Cache key prefixes for organized data storage
 * Enables efficient pattern-based invalidation
 */
const CACHE_PREFIXES = {
  REQUEST: "request:",
  USER: "user:",
  LEVEL: "level:",
  LEVELS_ALL: "levels:all",
  QUESTION: "question:",
  QUESTIONS_LEVEL: "questions:level:",
  LEADERBOARD: "leaderboard:",
  CONFIG: "config:app",
};

/**
 * Cache TTL values in seconds
 * Different TTLs based on data volatility
 */
const CACHE_TTL = {
  SHORT: 60, // 1 minute for frequently changing data
  MEDIUM: 300, // 5 minutes for moderately stable data
  LONG: 3600, // 1 hour for stable data
  VERY_LONG: 86400, // 24 hours for rarely changing data
};

/**
 * Set cache value with expiration
 * Automatically serializes objects to JSON
 * @param {string} key Cache key
 * @param {*} value Value to cache (auto-serialized)
 * @param {number} ttl Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
const setCache = async (key, value, ttl = CACHE_TTL.MEDIUM) => {
  if (!redisClient) return false;

  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error("Redis setCache error:", error);
    return false;
  }
};

/**
 * Get cache value
 * Automatically deserializes JSON to object
 * @param {string} key Cache key
 * @returns {Promise<*|null>} Cached value or null
 */
const getCache = async (key) => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error("Redis getCache error:", error);
    return null;
  }
};

/**
 * Delete cache entry
 * @param {string} key Cache key
 * @returns {Promise<boolean>} Success status
 */
const deleteCache = async (key) => {
  if (!redisClient) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error("Redis deleteCache error:", error);
    return false;
  }
};

/**
 * Delete multiple cache entries matching pattern
 * Uses SCAN for safe pattern matching in production
 * @param {string} pattern Redis key pattern (e.g., 'user:*')
 * @returns {Promise<number>} Number of keys deleted
 */
/**
 * Generic cache getter
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null
 */
const getCachedData = async (key) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      console.warn("Redis not available for getCachedData");
      return null;
    }

    const cached = await redisClient.get(key);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error);
    return null;
  }
};

/**
 * Generic cache setter
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} Success status
 */
const cacheData = async (key, data, ttl = 300) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      console.warn("Redis not available for cacheData");
      return false;
    }

    await redisClient.setEx(key, ttl, JSON.stringify(data));
    console.log(`Cached data with key: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error(`Redis cache error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete cache by pattern (supports wildcards)
 * @param {string} pattern - Redis key pattern (e.g., 'questions:all:*')
 * @returns {Promise<boolean>} Success status
 */
const deleteCachePattern = async (pattern) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      console.warn("Redis not available for deleteCachePattern");
      return false;
    }

    // Use SCAN to find matching keys
    const keys = [];
    let cursor = "0";

    do {
      const result = await redisClient.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = Array.isArray(result) ? result[0] : result.cursor;
      keys.push(...(Array.isArray(result) ? result[1] : result.keys));
    } while (cursor !== "0");

    if (keys.length === 0) {
      console.log(`No keys found for pattern: ${pattern}`);
      return true;
    }

    // Delete all matching keys
    await redisClient.del(...keys);
    console.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
    return true;
  } catch (error) {
    console.error(`Redis delete pattern error for ${pattern}:`, error);
    return false;
  }
};

/**
 * Invalidate request-level cache entries created by cacheMiddleware.
 * @param {string} pathPattern API path prefix, e.g. '/api/levels'
 * @returns {Promise<boolean>} Success status
 */
const invalidateRequestCache = async (pathPattern) => {
  const normalizedPath = pathPattern.startsWith("/")
    ? pathPattern
    : `/${pathPattern}`;

  return await deleteCachePattern(
    `${CACHE_PREFIXES.REQUEST}${normalizedPath}*`
  );
};

/**
 * Cache user data
 * @param {string} userId User MongoDB ID
 * @param {Object} userData User object
 * @returns {Promise<boolean>}
 */
const cacheUser = async (userId, userData) => {
  const key = `${CACHE_PREFIXES.USER}${userId}`;
  return await setCache(key, userData, CACHE_TTL.MEDIUM);
};

/**
 * Get cached user data
 * @param {string} userId User MongoDB ID
 * @returns {Promise<Object|null>}
 */
const getCachedUser = async (userId) => {
  const key = `${CACHE_PREFIXES.USER}${userId}`;
  return await getCache(key);
};

/**
 * Invalidate user cache
 * @param {string} userId User MongoDB ID
 * @returns {Promise<boolean>}
 */
const invalidateUserCache = async (userId) => {
  const key = `${CACHE_PREFIXES.USER}${userId}`;
  return await deleteCache(key);
};

/**
 * Cache all published levels
 * @param {Array} levels Array of level objects
 * @returns {Promise<boolean>}
 */
const cacheLevels = async (levels) => {
  return await setCache(CACHE_PREFIXES.LEVELS_ALL, levels, CACHE_TTL.LONG);
};

/**
 * Get cached levels
 * @returns {Promise<Array|null>}
 */
const getCachedLevels = async () => {
  return await getCache(CACHE_PREFIXES.LEVELS_ALL);
};

/**
 * Invalidate levels cache
 * @returns {Promise<boolean>}
 */
const invalidateLevelsCache = async () => {
  await Promise.all([
    deleteCache(CACHE_PREFIXES.LEVELS_ALL),
    deleteCachePattern(`${CACHE_PREFIXES.LEVEL}*`),
    invalidateRequestCache("/api/levels"),
  ]);
  return true;
};

/**
 * Cache questions for specific level
 * @param {string} levelId Level MongoDB ID
 * @param {Array} questions Array of question objects
 * @returns {Promise<boolean>}
 */
const cacheQuestions = async (levelId, questions) => {
  const key = `${CACHE_PREFIXES.QUESTIONS_LEVEL}${levelId}`;
  return await setCache(key, questions, CACHE_TTL.LONG);
};

/**
 * Get cached questions for level
 * @param {string} levelId Level MongoDB ID
 * @returns {Promise<Array|null>}
 */
const getCachedQuestions = async (levelId) => {
  const key = `${CACHE_PREFIXES.QUESTIONS_LEVEL}${levelId}`;
  return await getCache(key);
};

/**
 * Invalidate questions cache for level
 * @param {string} levelId Level MongoDB ID
 * @returns {Promise<boolean>}
 */
const invalidateQuestionsCache = async (levelId) => {
  const key = `${CACHE_PREFIXES.QUESTIONS_LEVEL}${levelId}`;
  await Promise.all([
    deleteCache(key),
    invalidateRequestCache("/api/questions"),
    invalidateRequestCache(`/api/levels/${levelId}/questions`),
  ]);
  return true;
};

/**
 * Cache leaderboard data
 * @param {Array} leaderboard Array of leaderboard entries
 * @returns {Promise<boolean>}
 */
const cacheLeaderboard = async (leaderboard) => {
  return await setCache(
    CACHE_PREFIXES.LEADERBOARD,
    leaderboard,
    CACHE_TTL.SHORT
  );
};

/**
 * Get cached leaderboard
 * @returns {Promise<Array|null>}
 */
const getCachedLeaderboard = async () => {
  return await getCache(CACHE_PREFIXES.LEADERBOARD);
};

/**
 * Invalidate leaderboard cache
 * @returns {Promise<boolean>}
 */
const invalidateLeaderboardCache = async () => {
  return await deleteCache(CACHE_PREFIXES.LEADERBOARD);
};

/**
 * Cache app configuration
 * @param {Object} config App configuration object
 * @returns {Promise<boolean>}
 */
const cacheAppConfig = async (config) => {
  return await setCache(CACHE_PREFIXES.CONFIG, config, CACHE_TTL.VERY_LONG);
};

/**
 * Get cached app configuration
 * @returns {Promise<Object|null>}
 */
const getCachedAppConfig = async () => {
  return await getCache(CACHE_PREFIXES.CONFIG);
};

/**
 * Invalidate app config cache
 * @returns {Promise<boolean>}
 */
const invalidateAppConfigCache = async () => {
  return await deleteCache(CACHE_PREFIXES.CONFIG);
};

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedis,
  CACHE_PREFIXES,
  CACHE_TTL,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  invalidateRequestCache,
  cacheUser,
  getCachedUser,
  invalidateUserCache,
  cacheLevels,
  getCachedLevels,
  invalidateLevelsCache,
  cacheQuestions,
  getCachedQuestions,
  invalidateQuestionsCache,
  cacheLeaderboard,
  getCachedLeaderboard,
  invalidateLeaderboardCache,
  cacheAppConfig,
  getCachedAppConfig,
  invalidateAppConfigCache,
  getCachedData, // ADD THIS
  cacheData, // ADD THIS
};
