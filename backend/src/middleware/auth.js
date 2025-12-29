/**
 * Authentication Middleware
 * Verifies JWT tokens stored in HTTP-only cookies from React Native app
 * Protects user-facing API routes
 * Attaches authenticated user to req.user for use in controllers
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyIdToken } = require("../config/firebase");

/**
 * Middleware to authenticate user requests using HTTP-only cookies
 * Validates JWT token from cookie and loads user from database
 * Cookie name: 'authToken'
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Try to extract JWT token from cookie (for web) OR Authorization header (for mobile)
    let token = req.cookies?.authToken;

    // If no cookie, check Authorization header for mobile apps
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Token is invalid or expired
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
    }

    // Load user from database using Firebase UID from token payload
    const user = await User.findOne({
      firebaseUid: decoded.firebaseUid,
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or account deactivated",
      });
    }

    // Attach user object to request for use in controllers
    req.user = user;
    req.userId = user._id.toString();
    req.firebaseUid = user.firebaseUid;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Optional authentication middleware
 * Does not reject request if no token present, but attaches user if valid token exists
 * Useful for routes that work differently for authenticated vs non-authenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.authToken;

    if (!token) {
      // No token present, continue without user
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findOne({
        firebaseUid: decoded.firebaseUid,
        isActive: true,
      });

      if (user) {
        req.user = user;
        req.userId = user._id.toString();
        req.firebaseUid = user.firebaseUid;
      }
    } catch (error) {
      // Invalid token, continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null;
    next();
  }
};

/**
 * Utility function to generate JWT token for authenticated user
 * Called after successful Firebase authentication
 * @param {Object} user - User document from database
 * @returns {string} Signed JWT token
 */
const generateAuthToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    firebaseUid: user.firebaseUid,
    email: user.email,
  };

  // Token expires in 30 days
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * Utility function to set authentication cookie in response
 * Sets HTTP-only, secure, same-site cookie for security
 * @param {Object} res - Express response object
 * @param {string} token - JWT token to store in cookie
 */
const setAuthCookie = (res, token) => {
  // Cookie options for maximum security
  const cookieOptions = {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    path: "/", // Cookie available for all routes
  };

  res.cookie("authToken", token, cookieOptions);
};

/**
 * Utility function to clear authentication cookie
 * Called during logout
 * @param {Object} res - Express response object
 */
const clearAuthCookie = (res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  generateAuthToken,
  setAuthCookie,
  clearAuthCookie,
};
