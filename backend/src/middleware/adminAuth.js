/**
 * Admin Authentication Middleware
 * Verifies admin session using HTTP-only cookies
 * Protects admin panel API routes
 * Uses simple email/password authentication (no OTP)
 */

const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate admin requests using HTTP-only cookies
 * Validates JWT token from admin cookie
 * Cookie name: 'adminToken'
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Extract JWT token from HTTP-only cookie
    const token = req.cookies?.adminToken;
    console.log("Auth check - Origin:", req.get("origin"));
    console.log("Auth check - Cookies:", req.cookies);
    console.log("Auth check - Has token:", !!token);


    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

// Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', { email: decoded.email, role: decoded.role, hasUserId: !!decoded.userId });
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired admin session. Please log in again.",
      });
    }

    // Verify that this is actually an admin token (not a regular user token)
    if (decoded.role !== "admin") {
      console.log('Token rejected: role mismatch', decoded.role);
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Verify email matches environment admin email
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      console.log('Token rejected: email mismatch', decoded.email);
      return res.status(403).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }
    
    console.log('Auth successful for:', decoded.email);

    // Attach admin info to request
    req.admin = {
      email: decoded.email,
      role: "admin",
    };

    next();
  } catch (error) {
    console.error("Admin authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Admin authentication failed",
    });
  }
};

/**
 * Utility function to generate JWT token for admin
 * Called after successful admin login
 * @param {string} email - Admin email
 * @returns {string} Signed JWT token
 */
const generateAdminToken = (email) => {
  const payload = {
    email: email,
    role: "admin",
  };

  // Token expires in 7 days for admin (shorter than user tokens for security)
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Utility function to set admin authentication cookie in response
 * Sets HTTP-only, secure, same-site cookie for maximum security
 * @param {Object} res - Express response object
 * @param {string} token - JWT token to store in cookie
 */
const setAdminCookie = (res, token) => {
  // Cookie options with enhanced security for admin
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };

  console.log('Setting admin cookie with options:', cookieOptions);
  res.cookie("adminToken", token, cookieOptions);
};

/**
 * Utility function to clear admin authentication cookie
 * Called during admin logout
 * @param {Object} res - Express response object
 */
const clearAdminCookie = (res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
};

module.exports = {
  adminAuthMiddleware,
  generateAdminToken,
  setAdminCookie,
  clearAdminCookie,
};
