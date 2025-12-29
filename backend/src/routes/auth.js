const express = require('express');
const router = express.Router();
const {
  googleSignIn,
  getProfile,
  logout,
  refreshCoins,
  checkAuth,
  getDailyClaimStatus,
  claimDailyCoins,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/google-signin', googleSignIn);
router.get('/profile', authMiddleware, getProfile);
router.post('/logout', logout);
router.post('/refresh-coins', authMiddleware, refreshCoins);
router.get('/check', authMiddleware, checkAuth);
router.get('/daily-claim-status', authMiddleware, getDailyClaimStatus);
router.post('/claim-daily-coins', authMiddleware, claimDailyCoins);

module.exports = router;