/**
 * Ad Routes
 * Handles ad reward API endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getAdRewardStatus,
  claimAdReward,
} = require('../controllers/adController');
const { authMiddleware } = require('../middleware/auth');

// Get current ad reward status
router.get('/reward-status', authMiddleware, getAdRewardStatus);

// Claim ad reward after watching
router.post('/claim-reward', authMiddleware, claimAdReward);

module.exports = router;