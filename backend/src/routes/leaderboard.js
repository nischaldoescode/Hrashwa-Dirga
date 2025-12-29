/**
 * Leaderboard Routes
 * Provides read-only leaderboard access for both users and admins
 * 
 * User routes: Require Firebase authentication
 * Admin routes: Use admin session cookie
 */

const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getUserRank,
  getTopUsers,
} = require('../controllers/leaderboardController');
const { authMiddleware } = require('../middleware/auth');
const { adminAuthMiddleware } = require('../middleware/adminAuth');
const { validateLeaderboard } = require('../utils/validators');
const { cacheFor } = require('../middleware/cacheMiddleware');

/**
 * Admin routes - use admin authentication
 * These routes are accessed from the admin panel
 */
router.get('/admin', adminAuthMiddleware, cacheFor(60), validateLeaderboard, getLeaderboard);
router.get('/admin/top-users', adminAuthMiddleware, cacheFor(60), getTopUsers);

/**
 * User routes - use Firebase authentication
 * These routes are accessed from the mobile app
 */
router.get('/', authMiddleware, cacheFor(60), validateLeaderboard, getLeaderboard);
router.get('/my-rank', authMiddleware, getUserRank);
router.get('/top-users', authMiddleware, cacheFor(60), getTopUsers);

module.exports = router;