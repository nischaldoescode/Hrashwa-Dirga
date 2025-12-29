/**
 * Configuration Routes
 * Manages application configuration settings
 * 
 * Read access: Available to both users (mobile app) and admins (admin panel)
 * Write access: Restricted to admins only via admin panel
 * 
 * Security: Admin operations use adminAuthMiddleware (session cookie)
 *          User operations use authMiddleware (Firebase token)
 */

const express = require('express');
const router = express.Router();
const {
  getConfig,
  updateConfig,
  uploadLogo,
  deleteLogo,
  updateAppName,
} = require('../controllers/configController');
const { authMiddleware } = require('../middleware/auth');
const { adminAuthMiddleware } = require('../middleware/adminAuth');
const { upload } = require('../config/cloudinary');
const { validateUpdateConfig } = require('../utils/validators');
const { cacheFor } = require('../middleware/cacheMiddleware');

/**
 * Admin routes - require admin session cookie
 * Used by admin panel for configuration management
 */
router.get('/admin', adminAuthMiddleware, cacheFor(600), getConfig);
router.put('/', adminAuthMiddleware, validateUpdateConfig, updateConfig);
router.post('/logo', adminAuthMiddleware, upload.single('logo'), uploadLogo);
router.delete('/logo', adminAuthMiddleware, deleteLogo);
router.patch('/app-name', adminAuthMiddleware, updateAppName);

/**
 * User routes - require Firebase authentication
 * Mobile app uses this to fetch configuration (read-only)
 */
router.get('/', cacheFor(600), getConfig);

module.exports = router;