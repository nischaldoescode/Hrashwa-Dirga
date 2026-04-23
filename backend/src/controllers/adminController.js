/**
 * Admin Controller
 * Handles admin authentication and dashboard operations
 * Simple email/password login (no OTP required)
 */

const bcrypt = require("bcryptjs");
const {
  generateAdminToken,
  setAdminCookie,
  clearAdminCookie,
} = require("../middleware/adminAuth");
const User = require("../models/User");
const Question = require("../models/Question");
const Level = require("../models/Level");
const AppConfig = require("../models/AppConfig");

/**
 * Admin login with email and password
 * Validates credentials against environment variables
 * Sets HTTP-only admin cookie on success
 *
 * Request body:
 * - email: Admin email
 * - password: Admin password
 *
 * Response:
 * - success: boolean
 * - message: string
 * - admin: Admin info object
 *
 * @route POST /api/admin/login
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate against environment variables
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Direct password comparison (for simplicity as requested)
    // In production, you should hash the password
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = generateAdminToken(email);
    console.log("Generated token for:", email);

    // Set HTTP-only cookie
    setAdminCookie(res, token);
    console.log("Cookie set, sending response");

    console.log("Admin logged in:", email);

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: {
        admin: {
          email: email,
          role: "admin",
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * Admin logout
 * Clears admin authentication cookie
 *
 * Response:
 * - success: boolean
 * - message: string
 *
 * @route POST /api/admin/logout
 */
const adminLogout = async (req, res) => {
  try {
    // Clear admin cookie
    clearAdminCookie(res);

    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/**
 * Get admin dashboard statistics
 * Returns overview metrics for admin panel
 *
 * Response:
 * - success: boolean
 * - stats: Statistics object
 *
 * @route GET /api/admin/dashboard-stats
 */
const getDashboardStats = async (req, res) => {
  try {
    // Aggregate statistics from various collections
    const [
      totalUsers,
      activeUsers,
      totalLevels,
      publishedLevels,
      totalQuestions,
      activeQuestions,
      questionStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Level.countDocuments(),
      Level.countDocuments({ isPublished: true }),
      Question.countDocuments(),
      Question.countDocuments({ isActive: true }),
      Question.getStatistics(),
    ]);

    // Get top 5 users for quick view
    const topUsers = await User.find({ isActive: true })
      .select("displayName email totalScore")
      .sort({ totalScore: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        levels: {
          total: totalLevels,
          published: publishedLevels,
          draft: totalLevels - publishedLevels,
        },
        questions: {
          total: totalQuestions,
          active: activeQuestions,
          inactive: totalQuestions - activeQuestions,
        },
        questionPerformance: {
          totalAttempts: questionStats.totalAttempts,
          correctAttempts: questionStats.totalCorrect,
          successRate: questionStats.overallSuccessRate,
          totalHintsUsed: questionStats.totalHints,
        },
        topUsers: topUsers,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

/**
 * Get all users with pagination
 * Returns list of users for admin user management
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - search: Search by name or email
 *
 * Response:
 * - success: boolean
 * - users: Array of user objects
 * - pagination: Pagination metadata
 *
 * @route GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    // Build search query
    const query = {};
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // added username and country to select fields
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select(
          "displayName username country email photoURL coins currentLevel totalScore isActive createdAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount: totalCount,
          limit: limit,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/**
 * Toggle user active status
 * Enable or disable user account
 *
 * Params:
 * - userId: User's MongoDB ID
 *
 * Response:
 * - success: boolean
 * - user: Updated user object
 *
 * @route PATCH /api/admin/users/:userId/toggle-status
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    console.log(
      `User ${user.email} status changed to: ${
        user.isActive ? "Active" : "Inactive"
      }`,
    );

    return res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

/**
 * Delete user account
 * Permanently removes user from database
 *
 * Params:
 * - userId: User's MongoDB ID
 *
 * Response:
 * - success: boolean
 * - message: string
 *
 * @route DELETE /api/admin/users/:userId
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`User deleted: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

/**
 * Check admin authentication status
 * Validates if current admin session is valid
 *
 * Response:
 * - authenticated: boolean
 * - admin: Admin info (if authenticated)
 *
 * @route GET /api/admin/check-auth
 */
const checkAdminAuth = async (req, res) => {
  try {
    // If middleware passed, admin is authenticated
    if (req.admin) {
      return res.status(200).json({
        authenticated: true,
        admin: req.admin,
      });
    }

    return res.status(200).json({
      authenticated: false,
    });
  } catch (error) {
    console.error("Check admin auth error:", error);
    return res.status(200).json({
      authenticated: false,
    });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  checkAdminAuth,
};
