/**
 * Redis Cache Middleware
 * Implements request-level caching for GET endpoints
 * Reduces database load and improves response times
 */

const { getCache, setCache, CACHE_TTL } = require('../config/redis');

/**
 * Cache middleware factory
 * Creates middleware that caches GET request responses
 * @param {number} ttl Cache time-to-live in seconds
 * @returns {Function} Express middleware function
 */
const cacheMiddleware = (ttl = CACHE_TTL.MEDIUM) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from request URL and query parameters
    const cacheKey = `request:${req.originalUrl}`;

    try {
      // Attempt to retrieve from cache
      const cachedResponse = await getCache(cacheKey);

      if (cachedResponse) {
        // Cache hit - return cached response with indicator
        console.log(`Cache HIT: ${cacheKey}`);
        
        // Add cached flag to the response without destructuring
        // This preserves the original response structure
        return res.json({
          ...cachedResponse,
          cached: true,
        });
      }

      // Cache miss - continue to controller
      console.log(`Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache response before sending
      res.json = function(data) {
        // Cache only the response data without the cached flag
        // This ensures consistency between cached and non-cached responses
        const dataToCache = { ...data };
        delete dataToCache.cached; // Remove cached flag before caching
        
        setCache(cacheKey, dataToCache, ttl).catch(err => {
          console.error('Cache set error:', err);
        });

        // Return response with cached: false indicator
        return originalJson({
          ...data,
          cached: false,
        });
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // On cache error, bypass cache and continue to controller
      next();
    }
  };
};

/**
 * Create cache middleware with specific TTL
 * @param {number} seconds TTL in seconds
 * @returns {Function} Middleware
 */
const cacheFor = (seconds) => cacheMiddleware(seconds);

module.exports = {
  cacheMiddleware,
  cacheFor,
};