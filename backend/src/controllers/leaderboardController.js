/**
 * Leaderboard Controller
 * Handles leaderboard data with Redis caching
 */

const User = require("../models/User");
const {
  cacheLeaderboard,
  getCachedLeaderboard,
  invalidateLeaderboardCache,
  CACHE_PREFIXES,
  CACHE_TTL,
  getCache,
  setCache,
} = require("../config/redis");

/**
 * Get global leaderboard
 * Returns top users with Redis caching
 * @route GET /api/leaderboard
 */
const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    // Attempt to retrieve from Redis
    const cachedLeaderboard = await getCachedLeaderboard();

    if (cachedLeaderboard) {
      // Apply limit to cached data
      const limitedData = cachedLeaderboard.slice(0, limit);
      return res.status(200).json({
        success: true,
        data: {
          leaderboard: limitedData,
        },
        cached: true,
      });
    }

    // Cache miss - fetch from database
    const country = req.query.country || null;
    const leaderboard = await User.getLeaderboard(limit, country);

    // Cache the full result (or a reasonable max like 500)
    const cacheLimit = Math.min(limit, 500);
    const dataToCache = await User.getLeaderboard(cacheLimit, country);
    await cacheLeaderboard(dataToCache);

    return res.status(200).json({
      success: true,
      data: {
        leaderboard: leaderboard,
      },
      cached: false,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
};

/**
 * Get user rank
 * Calculates current user's position
 * @route GET /api/leaderboard/my-rank
 */
const getUserRank = async (req, res) => {
  try {
    const user = req.user;

    const rank = await User.getUserRank(user._id);

    return res.status(200).json({
      success: true,
      data: {
        rank: rank,
        totalScore: user.totalScore,
      },
    });
  } catch (error) {
    console.error("Get user rank error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user rank",
    });
  }
};

/**
 * Get top N users
 * Quick access to top performers
 * @route GET /api/leaderboard/top-users
 */
const getTopUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Try to get from cached leaderboard first
    const cachedLeaderboard = await getCachedLeaderboard();

    if (cachedLeaderboard && cachedLeaderboard.length >= limit) {
      const topUsers = cachedLeaderboard.slice(0, limit);
      return res.status(200).json({
        success: true,
        data: {
          topUsers: topUsers,
        },
        cached: true,
      });
    }

    // Fetch from database
    const topUsers = await User.find({ isActive: true })
      .select("displayName photoURL totalScore email")
      .sort({ totalScore: -1 })
      .limit(limit)
      .lean();

    const usersWithRank = topUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    return res.status(200).json({
      success: true,
      data: {
        topUsers: usersWithRank,
      },
      cached: false,
    });
  } catch (error) {
    console.error("Get top users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch top users",
    });
  }
};

module.exports = {
  getLeaderboard,
  getUserRank,
  getTopUsers,
};
