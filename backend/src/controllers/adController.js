/**
 * Ad Controller
 * Handles ad reward validation and tracking
 */

const User = require('../models/User');
const { invalidateUserCache } = require('../config/redis');

/**
 * Get ad reward status
 * Returns whether user can claim reward and how many remaining
 * @route GET /api/ads/reward-status
 */
const getAdRewardStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const status = user.canClaimAdReward();
    
    return res.status(200).json({
      success: true,
      data: {
        canClaim: status.canClaim,
        remaining: status.remaining,
        coinsPerAd: user.dailyAdRewards.coinsPerAd,
        maxRewardsPerDay: user.dailyAdRewards.maxRewardsPerDay,
        adsWatchedToday: user.dailyAdRewards.adsWatchedToday,
        rewardsClaimedToday: user.dailyAdRewards.rewardsClaimedToday,
      },
    });
  } catch (error) {
    console.error('Get ad reward status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ad reward status',
    });
  }
};

/**
 * Claim ad reward
 * Validates ad watch and gives coins if eligible
 * @route POST /api/ads/claim-reward
 */
const claimAdReward = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if can claim before processing
    const canClaim = user.canClaimAdReward();
    
    if (!canClaim.canClaim) {
      return res.status(400).json({
        success: false,
        message: 'Daily ad reward limit reached. Come back tomorrow!',
        data: {
          rewardGiven: false,
          rewardsRemaining: 0,
        },
      });
    }
    
    // Process the ad watch and claim
    const result = await user.watchAdAndClaim();
    
    // Invalidate user cache
    await invalidateUserCache(user._id.toString());
    
    return res.status(200).json({
      success: true,
      message: result.rewardGiven 
        ? `You earned ${result.coinsEarned} coins!` 
        : 'Ad watched. Daily reward limit reached.',
      data: result,
    });
  } catch (error) {
    console.error('Claim ad reward error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to claim ad reward',
    });
  }
};

module.exports = {
  getAdRewardStatus,
  claimAdReward,
};