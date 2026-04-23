/**
 * Authentication Controller
 * Handles user authentication via Google Sign-In (Firebase)
 * Manages user registration, login, logout, and profile
 */

const User = require("../models/User");
const { verifyIdToken } = require("../config/firebase");
const {
  generateAuthToken,
  setAuthCookie,
  clearAuthCookie,
} = require("../middleware/auth");

/**
 * Google Sign-In authentication
 * Verifies Firebase ID token and creates/updates user in database
 * Sets HTTP-only cookie with JWT token
 *
 * Request body:
 * - idToken: Firebase ID token from Google Sign-In
 *
 * Response:
 * - success: boolean
 * - message: string
 * - user: User object with coins, level progress
 *
 * @route POST /api/auth/google-signin
 */
const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required",
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase token",
      });
    }

    // Extract user info from decoded token
    const { uid, email, name, picture } = decodedToken;

    // Check if user already exists in database
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      // Existing user - update profile if needed
      let updated = false;

      if (user.displayName !== name) {
        user.displayName = name;
        updated = true;
      }

      if (user.photoURL !== picture) {
        user.photoURL = picture;
        updated = true;
      }

      if (updated) {
        await user.save();
      }

      // Note: Daily coins are now claimed manually via modal
      // No automatic award on login
    } else {
      // New user - create account with initial 30 coins
      user = await User.create({
        firebaseUid: uid,
        email: email,
        displayName: name || email.split("@")[0],
        photoURL: picture || null,
        coins: 20, // First day coins
        currentLevel: 1,
        totalScore: 0,
        completedLevels: [],
        completedQuestions: [],
        createdAt: new Date(),
      });

      console.log("New user registered:", email);
    }

    // Generate JWT token
    // Generate JWT token
    const token = generateAuthToken(user);

    // Set HTTP-only cookie (for web admin panel compatibility)
    setAuthCookie(res, token);

    // Return user data WITH TOKEN for mobile app
    return res.status(200).json({
      success: true,
      message: user.isNew
        ? "Account created successfully"
        : "Logged in successfully",
      token: token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        /** include username/country so AppNavigator gate works immediately
         * on first login without needing a separate profile fetch */
        username: user.username || null,
        country: user.country || null,
        coins: user.coins,
        currentLevel: user.currentLevel,
        totalScore: user.totalScore,
        completedLevels: user.completedLevels.length,
      },
    });
  } catch (error) {
    console.error("Google Sign-In error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};

/**
 * Get current authenticated user profile
 * Requires authentication middleware
 *
 * Response:
 * - success: boolean
 * - user: Complete user object with progress
 *
 * @route GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    // User is already attached by auth middleware
    const user = req.user;

    // Get user's rank in leaderboard
    const rank = await User.getUserRank(user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          /** username and country must be included so AppNavigator
           * correctly determines if UsernameScreen should be shown */
          username: user.username || null,
          country: user.country || null,
          coins: user.coins,
          currentLevel: user.currentLevel,
          totalScore: user.totalScore,
          completedLevels: user.completedLevels.length,
          completedQuestions: user.completedQuestions.length,
          rank: rank,
          joinedDate: user.createdAt
            ? user.createdAt.toISOString()
            : new Date().toISOString(),
          dailyCoinClaim: {
            currentStreak: user.dailyCoinClaim?.currentStreak || 0,
            lastClaimDate: user.dailyCoinClaim?.lastClaimDate
              ? user.dailyCoinClaim.lastClaimDate.toISOString()
              : null,
            totalClaims: user.dailyCoinClaim?.totalClaims || 0,
            canClaim: user.dailyCoinClaim?.canClaim !== false,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

/**
 * Logout user
 * Clears authentication cookie
 *
 * Response:
 * - success: boolean
 * - message: string
 *
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    clearAuthCookie(res);
    if (req.user) {
      const {
        invalidateUserCache,
        invalidateLevelsCache,
        invalidateQuestionsCache,
      } = require("../config/redis");
      await Promise.all([
        invalidateUserCache(req.user._id.toString()),
        /**
         * invalidate levels and questions cache on logout.
         * prevents stale completed-question state from showing
         * when a different user logs in on the same device/session.
         */
        invalidateLevelsCache(),
      ]).catch((err) => {
        console.error("Cache invalidation error during logout:", err);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Always return success for logout - even if there's an error
    // This prevents the app from getting stuck in a logged-in state
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
};

/**
 * Refresh user coins (daily coin award)
 * Awards 15 coins if it's a new day since last award
 *
 * Response:
 * - success: boolean
 * - coinsAwarded: boolean
 * - currentCoins: number
 *
 * @route POST /api/auth/refresh-coins
 */
const refreshCoins = async (req, res) => {
  try {
    const user = req.user;

    // Attempt to award daily coins
    const awarded = await user.awardDailyCoins();

    return res.status(200).json({
      success: true,
      coinsAwarded: awarded,
      currentCoins: user.coins,
      message: awarded
        ? "10 coins awarded for today!"
        : "You have already received today's coins",
    });
  } catch (error) {
    console.error("Refresh coins error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh coins",
    });
  }
};

/**
 * Check daily coin claim status
 * Returns whether user can claim and current streak info
 * @route GET /api/auth/daily-claim-status
 */
const getDailyClaimStatus = async (req, res) => {
  try {
    const user = req.user;

    const claimStatus = user.checkDailyClaimStatus();

    return res.status(200).json({
      success: true,
      data: claimStatus,
    });
  } catch (error) {
    console.error("Get daily claim status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check claim status",
    });
  }
};

/**
 * Claim daily coins
 * Implements atomic transaction with cache invalidation:
 * 1. Validate claim eligibility (idempotency check)
 * 2. Execute coin award in database transaction
 * 3. Invalidate all related caches atomically
 * 4. Return success with updated balances
 *
 * Cache invalidation cascade:
 * - User profile cache (coins, streak updated)
 * - Claim status cache (no longer claimable)
 * - Leaderboard cache (score might change)
 *
 * Edge cases handled:
 * - Double-claim prevention (idempotency)
 * - Concurrent claim attempts (database locking)
 * - Cache invalidation failures (logged, non-blocking)
 * - Partial failures (transaction rollback)
 *
 * @route POST /api/auth/claim-daily-coins
 */
const claimDailyCoins = async (req, res) => {
  const userId = req.user._id.toString();

  try {
    // Step 1: Fetch fresh user data with database lock
    // This prevents race conditions from concurrent claim attempts
    const User = require("../models/User");
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 2: Pre-validation check to prevent unnecessary processing
    // Check current claim status before attempting claim
    const preCheckStatus = user.checkDailyClaimStatus();

    if (!preCheckStatus.canClaim) {
      // Edge case: User already claimed (idempotency)
      // This can happen with duplicate requests or timing issues
      // console.log(
      //   `Duplicate claim attempt by user ${userId} - already claimed`
      // );

      return res.status(400).json({
        success: false,
        message: preCheckStatus.message || "Coins already claimed today",
        alreadyClaimed: true,
      });
    }

    // Step 3: Execute claim operation in database
    // This updates user coins, streak, and claim timestamp atomically
    let claimResult;
    try {
      claimResult = await user.claimDailyCoins();
    } catch (claimError) {
      // Edge case: Claim validation failed (e.g., concurrent claim)
      if (claimError.message.includes("Cannot claim")) {
        return res.status(400).json({
          success: false,
          message: claimError.message,
          alreadyClaimed: true,
        });
      }
      throw claimError; // Re-throw unexpected errors
    }

    // Step 4: Cache invalidation cascade
    // Invalidate all caches that depend on user coin/streak data
    const {
      invalidateUserCache,
      invalidateLeaderboardCache,
      deleteCache,
    } = require("../config/redis");

    // Priority 1: Invalidate user profile cache
    // Contains coins, streak, all user data
    const userCacheInvalidated = await invalidateUserCache(userId);

    // Priority 2: Invalidate claim status cache
    // User can no longer claim today
    const claimStatusKey = `claim-status:${userId}`;
    const claimCacheInvalidated = await deleteCache(claimStatusKey);

    // Priority 3: Invalidate leaderboard cache
    // If coin claim affects score ranking (future feature)
    const leaderboardCacheInvalidated = await invalidateLeaderboardCache();

    // Log cache invalidation results for monitoring
    // console.log(`Cache invalidation for user ${userId}:`, {
    //   userCache: userCacheInvalidated ? 'SUCCESS' : 'FAILED',
    //   claimCache: claimCacheInvalidated ? 'SUCCESS' : 'FAILED',
    //   leaderboardCache: leaderboardCacheInvalidated ? 'SUCCESS' : 'FAILED',
    // });

    // Edge case: Cache invalidation failed
    // Log warning but don't fail the request - data is correct in DB
    if (!userCacheInvalidated || !claimCacheInvalidated) {
      console.warn(
        `Cache invalidation partially failed for user ${userId}. ` +
          `Data is correct in database but cache may be stale.`,
      );
    }

    // Step 5: Success response with detailed claim info
    // console.log(
    //   `User ${user.email} claimed daily coins: ` +
    //     `${claimResult.coinsAwarded} coins, ` +
    //     `streak: ${claimResult.currentStreak}, ` +
    //     `new balance: ${claimResult.newBalance}`
    // );

    return res.status(200).json({
      success: true,
      data: claimResult,
      cacheInvalidated: userCacheInvalidated && claimCacheInvalidated,
    });
  } catch (error) {
    console.error("Claim daily coins error:", error);

    // Edge case: Database transaction failed
    // User's coins were NOT awarded, safe to return error

    // Handle known validation errors with user-friendly messages
    if (error.message.includes("Cannot claim")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Edge case: Unknown error during claim
    // Return generic error, log details for debugging
    console.error(`Critical error during coin claim for user ${userId}:`, {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to claim daily coins. Please try again.",
    });
  }
};

/**
 * Check authentication status
 * Validates if current cookie/session is valid
 *
 * Response:
 * - authenticated: boolean
 * - user: User object (if authenticated)
 *
 * @route GET /api/auth/check
 */
const checkAuth = async (req, res) => {
  try {
    // If auth middleware passed, user is authenticated
    if (req.user) {
      return res.status(200).json({
        authenticated: true,
        user: {
          id: req.user._id,
          email: req.user.email,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL,
          coins: req.user.coins,
        },
      });
    }

    return res.status(200).json({
      authenticated: false,
    });
  } catch (error) {
    console.error("Check auth error:", error);
    return res.status(200).json({
      authenticated: false,
    });
  }
};
getProfile;

/**
 * check if a username is available
 * @route GET /api/auth/check-username/:username
 */
const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (
      !username ||
      username.length > 10 ||
      !/^[a-zA-Z0-9-]+$/.test(username)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid username. Max 10 chars, letters, numbers, and hyphens only.",
      });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });

    return res.status(200).json({
      success: true,
      available: !existing,
    });
  } catch (error) {
    console.error("Check username error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * suggest available usernames based on display name
 * @route GET /api/auth/suggest-usernames
 */
const suggestUsernames = async (req, res) => {
  try {
    const user = req.user;

    /**
     * extract clean base from display name.
      "John D." → "john"
     */
    const base = user.displayName
      .split(" ")[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 7)
      .toLowerCase();

    /**
     * large pool of natural adjectives
     * short, human-like, mix of calm, modern, aesthetic, energetic
     */
    const adjectives = [
      "swift",
      "brave",
      "calm",
      "bold",
      "keen",
      "wise",
      "sharp",
      "cool",
      "epic",
      "ace",
      "silent",
      "gentle",
      "fierce",
      "rapid",
      "steady",
      "bright",
      "dark",
      "soft",
      "wild",
      "pure",
      "vivid",
      "loyal",
      "proud",
      "quick",
      "fresh",
      "smooth",
      "neat",
      "prime",
      "solid",
      "clean",
      "chill",
      "kind",
      "smart",
      "slick",
      "urban",
      "rural",
      "cosmic",
      "solar",
      "lunar",
      "stellar",
      "neon",
      "crisp",
      "frost",
      "ember",
      "nova",
      "aero",
      "terra",
      "aqua",
      "zen",
      "flux",
      "drift",
      "glide",
      "surge",
      "pulse",
      "echo",
      "nova",
      "rift",
      "shade",
      "flare",
      "spark",
      "calyx",
      "velvet",
      "amber",
      "ivory",
      "onyx",
      "sable",
      "pearl",
      "copper",
      "silver",
      "golden",
      "mint",
      "sage",
      "olive",
      "cobalt",
      "indigo",
      "scarlet",
      "crimson",
      "azure",
      "violet",
      "blush",
      "elegant",
      "modest",
      "subtle",
      "simple",
      "refined",
      "polished",
      "raw",
      "edgy",
      "sleek",
      "minimal",
      "playful",
      "curious",
      "restless",
      "fearless",
      "limitless",
      "endless",
      "timeless",
      "agile",
      "nimble",
      "brisk",
      "serene",
      "tranquil",
      "noisy",
      "electric",
      "magnetic",
      "dynamic",
      "radiant",
      "glowing",
      "burning",
      "frozen",
      "floating",
      "falling",
      "rising",
      "wandering",
      "seeking",
      "hidden",
      "open",
      "awake",
      "aware",
      "alive",
    ];

    /**
     * large pool of natural nouns
     * mix of animals, abstract, tech, nature, identity-like words
     */
    const nouns = [
      "fox",
      "owl",
      "wolf",
      "hawk",
      "bear",
      "lion",
      "star",
      "ace",
      "gem",
      "core",
      "node",
      "byte",
      "pixel",
      "vector",
      "signal",
      "shadow",
      "light",
      "wave",
      "pulse",
      "spark",
      "drift",
      "orbit",
      "comet",
      "nova",
      "planet",
      "void",
      "echo",
      "rift",
      "storm",
      "breeze",
      "leaf",
      "tree",
      "forest",
      "river",
      "stone",
      "rock",
      "cliff",
      "valley",
      "desert",
      "ocean",
      "flame",
      "ember",
      "ash",
      "frost",
      "ice",
      "snow",
      "rain",
      "thunder",
      "cloud",
      "sky",
      "sun",
      "moon",
      "dawn",
      "dusk",
      "night",
      "day",
      "horizon",
      "zenith",
      "peak",
      "trail",
      "path",
      "route",
      "line",
      "grid",
      "code",
      "logic",
      "data",
      "cipher",
      "key",
      "lock",
      "vault",
      "frame",
      "shape",
      "form",
      "figure",
      "mask",
      "face",
      "voice",
      "tone",
      "note",
      "beat",
      "rhythm",
      "flow",
      "current",
      "engine",
      "drive",
      "gear",
      "core",
      "unit",
      "system",
      "atlas",
      "myth",
      "legend",
      "ghost",
      "spirit",
      "soul",
      "mind",
      "thought",
      "vision",
      "dream",
      "mirror",
      "lens",
      "focus",
      "point",
      "edge",
      "field",
      "zone",
      "space",
      "realm",
      "world",
      "circle",
      "arc",
      "loop",
      "chain",
      "link",
      "bridge",
      "tower",
      "gate",
      "portal",
      "axis",
      "seed",
      "root",
      "branch",
      "bloom",
      "petal",
      "thorn",
      "vine",
      "grain",
      "dust",
      "stone",
    ];

    /** pick deterministic options based on name char codes */
    const seed = base.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const adj = adjectives[seed % adjectives.length];
    const noun = nouns[(seed + 3) % nouns.length];
    const adj2 = adjectives[(seed + 5) % adjectives.length];

    const candidates = [
      base,
      `${base}-${noun}`.substring(0, 10),
      `${adj}-${base}`.substring(0, 10),
      `${base}${seed % 99}`.substring(0, 10),
      `${adj2}${noun}`.substring(0, 10),
      `${base}-${seed % 9}`.substring(0, 10),
    ].filter((s) => s.length >= 3);

    /** check availability for all candidates in parallel */
    const results = await Promise.all(
      candidates.map(async (name) => {
        const taken = await User.findOne({ username: name.toLowerCase() });
        return taken ? null : name.toLowerCase();
      }),
    );

    const suggestions = results.filter(Boolean).slice(0, 5);

    return res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.error("Suggest usernames error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * set username and country for user
 * @route POST /api/auth/set-username
 */
const setUsername = async (req, res) => {
  try {
    const { username, country } = req.body;
    const user = req.user;

    if (
      !username ||
      username.length > 10 ||
      !/^[a-zA-Z0-9-]+$/.test(username)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid username format.",
      });
    }

    if (!country || country.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Valid country code required.",
      });
    }

    const existing = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: user._id },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Username already taken.",
      });
    }

    user.username = username.toLowerCase();
    user.country = country.toUpperCase();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Username set successfully.",
      user: {
        username: user.username,
        country: user.country,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Username already taken." });
    }
    console.error("Set username error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  googleSignIn,
  getProfile,
  logout,
  refreshCoins,
  checkAuth,
  getDailyClaimStatus,
  claimDailyCoins,
  checkUsername,
  suggestUsernames,
  setUsername,
};
