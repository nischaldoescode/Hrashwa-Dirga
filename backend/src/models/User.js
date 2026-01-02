/**
 * User Model
 * Represents a user in the Hrashwa-Dirga game system
 * Handles user authentication, progress tracking, coin management, and scoring
 * Each user is linked to Firebase Authentication via firebaseUid
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Firebase UID for authentication linkage
    // This is the primary key that links our MongoDB user to Firebase Auth user
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // User's email address from Google Sign-in
    // Used for identification and potential notifications
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // User's display name from Google profile
    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    // User's profile photo URL from Google account
    photoURL: {
      type: String,
      default: null,
    },

    // Total coins available for purchasing hints
    // Day 1: 10 coins, Subsequent days: 15 coins daily
    coins: {
      type: Number,
      default: 10,
      min: 0,
    },

    // Timestamp of when coins were last awarded
    // Used to determine if user should receive daily 15 coins
    lastCoinAwardDate: {
      type: Date,
      default: Date.now,
    },
    // Daily coin claim tracking
    dailyCoinClaim: {
      // Current consecutive day streak (1, 2, 3, etc.)
      currentStreak: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Last date when user claimed their daily coins
      lastClaimDate: {
        type: Date,
        default: null,
      },
      // Total lifetime claims
      totalClaims: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Whether coins are available to claim right now
      canClaim: {
        type: Boolean,
        default: true,
      },
    },
    dailyHintUsage: {
      lastHintDate: { type: Date, default: null },
      hintsUsedToday: { type: Number, default: 0 },
      maxHintsPerDay: { type: Number, default: 1 },
    },
    dailyAdRewards: {
      lastAdDate: { type: Date, default: null },
      adsWatchedToday: { type: Number, default: 0 },
      rewardsClaimedToday: { type: Number, default: 0 },
      maxRewardsPerDay: { type: Number, default: 2 },
      coinsPerAd: { type: Number, default: 3 },
    },

    // Current level number the user is playing (1-based indexing)
    currentLevel: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Array of level IDs that user has completed
    // Used to determine which levels are unlocked
    completedLevels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Level",
      },
    ],

    // Detailed record of each question attempted by user
    completedQuestions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedAnswer: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        hintsUsed: {
          type: Number,
          default: 0,
          min: 0,
          max: 2, // Maximum 2 hints per question (3 options - 1 correct = 2 removable)
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Total score accumulated by user for leaderboard ranking
    // Score calculation: Base 10 points per correct answer - (3 points per hint used)
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Account status flag for admin to enable/disable users
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

/**
 * Compound index for leaderboard queries
 * Optimizes sorting by totalScore in descending order
 */
userSchema.index({ totalScore: -1, createdAt: 1 });

/**
 * Index for active user queries
 */
userSchema.index({ isActive: 1 });

/**
 * Check if user can get reward for watching ad
 * @returns {Object} Status object with canClaim and remaining info
 */
userSchema.methods.canClaimAdReward = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastAdDate = this.dailyAdRewards.lastAdDate
    ? new Date(this.dailyAdRewards.lastAdDate)
    : null;

  if (!lastAdDate) {
    // First ad ever
    return {
      canClaim: true,
      remaining: this.dailyAdRewards.maxRewardsPerDay,
      coinsToEarn: this.dailyAdRewards.coinsPerAd,
    };
  }

  lastAdDate.setHours(0, 0, 0, 0);

  // Different day - reset counter
  if (today.getTime() !== lastAdDate.getTime()) {
    return {
      canClaim: true,
      remaining: this.dailyAdRewards.maxRewardsPerDay,
      coinsToEarn: this.dailyAdRewards.coinsPerAd,
    };
  }

  // Same day - check if rewards remaining
  const remaining =
    this.dailyAdRewards.maxRewardsPerDay -
    this.dailyAdRewards.rewardsClaimedToday;

  return {
    canClaim: remaining > 0,
    remaining: remaining,
    coinsToEarn: remaining > 0 ? this.dailyAdRewards.coinsPerAd : 0,
  };
};

/**
 * Record ad watch and give reward if eligible
 * @returns {Promise<Object>} Reward result
 */
userSchema.methods.watchAdAndClaim = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastAdDate = this.dailyAdRewards.lastAdDate
    ? new Date(this.dailyAdRewards.lastAdDate)
    : null;

  let rewardGiven = false;
  let coinsEarned = 0;

  if (!lastAdDate) {
    // First ad ever
    this.dailyAdRewards.lastAdDate = today;
    this.dailyAdRewards.adsWatchedToday = 1;
    this.dailyAdRewards.rewardsClaimedToday = 1;
    this.coins += this.dailyAdRewards.coinsPerAd;
    rewardGiven = true;
    coinsEarned = this.dailyAdRewards.coinsPerAd;
  } else {
    lastAdDate.setHours(0, 0, 0, 0);

    if (today.getTime() !== lastAdDate.getTime()) {
      // New day - reset counters
      this.dailyAdRewards.lastAdDate = today;
      this.dailyAdRewards.adsWatchedToday = 1;
      this.dailyAdRewards.rewardsClaimedToday = 1;
      this.coins += this.dailyAdRewards.coinsPerAd;
      rewardGiven = true;
      coinsEarned = this.dailyAdRewards.coinsPerAd;
    } else {
      // Same day - increment watch count
      this.dailyAdRewards.adsWatchedToday += 1;

      // Give reward only if under limit
      if (
        this.dailyAdRewards.rewardsClaimedToday <
        this.dailyAdRewards.maxRewardsPerDay
      ) {
        this.dailyAdRewards.rewardsClaimedToday += 1;
        this.coins += this.dailyAdRewards.coinsPerAd;
        rewardGiven = true;
        coinsEarned = this.dailyAdRewards.coinsPerAd;
      }
    }
  }

  await this.save();

  return {
    rewardGiven,
    coinsEarned,
    newBalance: this.coins,
    adsWatchedToday: this.dailyAdRewards.adsWatchedToday,
    rewardsRemaining:
      this.dailyAdRewards.maxRewardsPerDay -
      this.dailyAdRewards.rewardsClaimedToday,
  };
};

/**
 * Check if user can use hint today
 * @returns {boolean} True if user has hints remaining
 */
userSchema.methods.canUseHintToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastHintDate = this.dailyHintUsage.lastHintDate
    ? new Date(this.dailyHintUsage.lastHintDate)
    : null;

  if (!lastHintDate) {
    // Never used hint before
    return true;
  }

  lastHintDate.setHours(0, 0, 0, 0);

  // If last hint was on a different day, reset counter
  if (today.getTime() !== lastHintDate.getTime()) {
    return true;
  }

  // Check if user has hints remaining today
  return (
    this.dailyHintUsage.hintsUsedToday < this.dailyHintUsage.maxHintsPerDay
  );
};

/**
 * Record hint usage for today
 * @returns {Promise<void>}
 */
userSchema.methods.recordHintUsage = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastHintDate = this.dailyHintUsage.lastHintDate
    ? new Date(this.dailyHintUsage.lastHintDate)
    : null;

  if (!lastHintDate) {
    // First hint ever
    this.dailyHintUsage.lastHintDate = today;
    this.dailyHintUsage.hintsUsedToday = 1;
  } else {
    lastHintDate.setHours(0, 0, 0, 0);

    if (today.getTime() !== lastHintDate.getTime()) {
      // New day - reset counter
      this.dailyHintUsage.lastHintDate = today;
      this.dailyHintUsage.hintsUsedToday = 1;
    } else {
      // Same day - increment counter
      this.dailyHintUsage.hintsUsedToday += 1;
    }
  }

  await this.save();
};

/**
 * Check if daily coins can be claimed
 * Compares last claim date with current date
 * @returns {Object} Claim eligibility status and streak info
 */
userSchema.methods.checkDailyClaimStatus = function () {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day

  // New user - first time claiming
  if (!this.dailyCoinClaim.lastClaimDate) {
    return {
      canClaim: true,
      isFirstClaim: true,
      currentStreak: 0,
      daysUntilNextClaim: 0,
      coinsToAward: 10, // First day bonus
    };
  }

  const lastClaim = new Date(this.dailyCoinClaim.lastClaimDate);
  lastClaim.setHours(0, 0, 0, 0);

  const daysSinceLastClaim = Math.floor(
    (now - lastClaim) / (1000 * 60 * 60 * 24)
  );

  // Already claimed today
  if (daysSinceLastClaim === 0) {
    return {
      canClaim: false,
      isFirstClaim: false,
      currentStreak: this.dailyCoinClaim.currentStreak,
      daysUntilNextClaim: 1,
      coinsToAward: 0,
      message: "Already claimed today. Come back tomorrow!",
    };
  }

  // Can claim - exactly 1 day passed (streak continues)
  if (daysSinceLastClaim === 1) {
    return {
      canClaim: true,
      isFirstClaim: false,
      currentStreak: this.dailyCoinClaim.currentStreak,
      streakContinues: true,
      daysUntilNextClaim: 0,
      coinsToAward: 10,
    };
  }

  // Missed days - streak breaks, reset to day 1
  if (daysSinceLastClaim > 1) {
    return {
      canClaim: true,
      isFirstClaim: false,
      currentStreak: 0, // Streak broken
      streakBroken: true,
      daysMissed: daysSinceLastClaim - 1,
      daysUntilNextClaim: 0,
      coinsToAward: 10,
      message: `You missed ${daysSinceLastClaim - 1} day(s). Streak reset!`,
    };
  }

  return {
    canClaim: false,
    isFirstClaim: false,
    currentStreak: this.dailyCoinClaim.currentStreak,
    daysUntilNextClaim: 1,
    coinsToAward: 0,
  };
};

/**
 * Claim daily coins
 * Awards coins and updates streak
 * @returns {Promise<Object>} Claim result with new balance
 */
userSchema.methods.claimDailyCoins = async function () {
  const claimStatus = this.checkDailyClaimStatus();

  if (!claimStatus.canClaim) {
    throw new Error(claimStatus.message || "Cannot claim coins at this time");
  }

  const now = new Date();
  const coinsAwarded = claimStatus.coinsToAward;

  // Update user coins
  this.coins += coinsAwarded;

  // Update claim tracking
  if (claimStatus.isFirstClaim) {
    // First time claim
    this.dailyCoinClaim.currentStreak = 1;
    this.dailyCoinClaim.lastClaimDate = now;
    this.dailyCoinClaim.totalClaims = 1;
    this.dailyCoinClaim.canClaim = false;
  } else if (claimStatus.streakBroken) {
    // Streak broken, reset to day 1
    this.dailyCoinClaim.currentStreak = 1;
    this.dailyCoinClaim.lastClaimDate = now;
    this.dailyCoinClaim.totalClaims += 1;
    this.dailyCoinClaim.canClaim = false;
  } else if (claimStatus.streakContinues) {
    // Streak continues, increment
    this.dailyCoinClaim.currentStreak += 1;
    this.dailyCoinClaim.lastClaimDate = now;
    this.dailyCoinClaim.totalClaims += 1;
    this.dailyCoinClaim.canClaim = false;
  }

  // Also update old lastCoinAwardDate for backward compatibility
  this.lastCoinAwardDate = now;

  await this.save();

  return {
    success: true,
    coinsAwarded,
    newBalance: this.coins,
    currentStreak: this.dailyCoinClaim.currentStreak,
    totalClaims: this.dailyCoinClaim.totalClaims,
    nextClaimAvailable: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    message: claimStatus.isFirstClaim
      ? "Welcome! Day 1 bonus claimed!"
      : claimStatus.streakBroken
      ? "Streak reset. Keep playing daily!"
      : `Day ${this.dailyCoinClaim.currentStreak} claimed! Keep the streak going!`,
  };
};

/**
 * Instance method to deduct coins when user uses a hint
 * @param {number} amount - Number of coins to deduct (default: 15 per hint)
 * @returns {Promise<boolean>} True if successful, false if insufficient coins
 */
userSchema.methods.deductCoins = async function (amount = 15) {
  if (this.coins >= amount) {
    this.coins -= amount;
    await this.save();
    return true; // Successfully deducted
  }
  return false; // Insufficient coins
};

/**
 * Instance method to add bonus coins as reward for level completion
 * @param {number} amount - Number of coins to add (default: 5 per level)
 * @returns {Promise<void>}
 */
userSchema.methods.addRewardCoins = async function (amount = 5) {
  this.coins += amount;
  await this.save();
};

/**
 * Instance method to update user's total score after answering a question
 * Score Formula: Base 10 points - (3 points penalty per hint used)
 * Minimum score per question: 1 point (even with 2 hints used)
 * @param {number} hintsUsed - Number of hints used for this question (0, 1, or 2)
 * @returns {Promise<number>} Score earned for this question
 */
userSchema.methods.updateScore = async function (hintsUsed = 0) {
  const baseScore = 10; // Base points for correct answer
  const hintPenalty = 3; // Points deducted per hint
  const scoreEarned = Math.max(baseScore - hintsUsed * hintPenalty, 1); // Minimum 1 point

  this.totalScore += scoreEarned;
  await this.save();

  return scoreEarned;
};

/**
 * Instance method to check if a question has been completed by this user
 * @param {ObjectId} questionId - The question ID to check
 * @returns {Object|null} Completed question object or null if not found
 */
userSchema.methods.hasCompletedQuestion = function (questionId) {
  return this.completedQuestions.find(
    (cq) => cq.questionId.toString() === questionId.toString()
  );
};

/**
 * Instance method to check if a level has been completed by this user
 * @param {ObjectId} levelId - The level ID to check
 * @returns {boolean} True if level completed, false otherwise
 */
userSchema.methods.hasCompletedLevel = function (levelId) {
  return this.completedLevels.some(
    (id) => id.toString() === levelId.toString()
  );
};

/**
 * Static method to get top users for leaderboard
 * Returns users sorted by totalScore in descending order
 * @param {number} limit - Number of top users to return (default: 100)
 * @returns {Promise<Array>} Array of user objects with rank
 */
userSchema.statics.getLeaderboard = async function (limit = 100) {
  const users = await this.find({ isActive: true })
    .select("displayName photoURL totalScore email")
    .sort({ totalScore: -1, createdAt: 1 })
    .limit(limit)
    .lean();

  // Add rank to each user (1-based)
  return users.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
};

/**
 * Static method to get user's rank in leaderboard
 * @param {string} userId - User's MongoDB _id
 * @returns {Promise<number>} User's rank (1-based)
 */
userSchema.statics.getUserRank = async function (userId) {
  const user = await this.findById(userId);
  if (!user) return 0;

  // Count users with higher score than this user
  const higherScoreCount = await this.countDocuments({
    isActive: true,
    totalScore: { $gt: user.totalScore },
  });

  return higherScoreCount + 1; // Rank is count + 1
};

module.exports = mongoose.model("User", userSchema);
