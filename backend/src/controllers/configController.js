/**
 * Configuration Controller
 * Handles app configuration and logo management with Redis caching
 */

const AppConfig = require('../models/AppConfig');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const {
  cacheAppConfig,
  getCachedAppConfig,
  invalidateAppConfigCache,
} = require('../config/redis');

/**
 * Get app configuration
 * Retrieves config from Redis cache or database
 * @route GET /api/config
 */
const getConfig = async (req, res) => {
  try {
    // Attempt to retrieve from Redis cache
    const cachedConfig = await getCachedAppConfig();
    
    if (cachedConfig) {
      return res.status(200).json({
        success: true,
        config: cachedConfig,
        cached: true,
      });
    }
    
    // Cache miss - fetch from database
    const config = await AppConfig.getConfig();
    
    // Store in Redis for future requests
    await cacheAppConfig(config);
    
    return res.status(200).json({
      success: true,
      config: config,
      cached: false,
    });
    
  } catch (error) {
    console.error('Get config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
    });
  }
};

/**
 * Update app configuration
 * Invalidates Redis cache after update
 * @route PUT /api/config
 */
const updateConfig = async (req, res) => {
  try {
    const updates = req.body;
    
    const config = await AppConfig.updateConfig(updates);
    
    // Invalidate Redis cache
    await invalidateAppConfigCache();
    
    console.log('App config updated');
    
    return res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      config: config,
    });
    
  } catch (error) {
    console.error('Update config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
    });
  }
};

/**
 * Upload app logo to Cloudinary
 * Deletes old logo and updates config with new URL
 * @route POST /api/config/logo
 */
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }
    
    const config = await AppConfig.getConfig();
    
    // Delete old logo from Cloudinary if exists
    if (config.logoPublicId) {
      await deleteImage(config.logoPublicId).catch(err => {
        console.error('Failed to delete old logo:', err);
      });
    }
    
    // Multer with Cloudinary storage automatically uploads
    // File path contains the Cloudinary URL
    const logoUrl = req.file.path;
    const logoPublicId = req.file.filename;
    
    // Update config with new logo details
    await AppConfig.updateLogo(logoUrl, logoPublicId);
    
    // Invalidate cache
    await invalidateAppConfigCache();
    
    console.log('Logo uploaded:', logoPublicId);
    
    return res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
    });
    
  } catch (error) {
    console.error('Upload logo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
    });
  }
};

/**
 * Delete app logo
 * Removes logo from Cloudinary and updates config
 * @route DELETE /api/config/logo
 */
const deleteLogo = async (req, res) => {
  try {
    const config = await AppConfig.getConfig();
    
    // Delete from Cloudinary if exists
    if (config.logoPublicId) {
      await deleteImage(config.logoPublicId).catch(err => {
        console.error('Failed to delete logo from Cloudinary:', err);
      });
    }
    
    // Update config to remove logo
    await AppConfig.removeLogo();
    
    // Invalidate cache
    await invalidateAppConfigCache();
    
    console.log('Logo deleted');
    
    return res.status(200).json({
      success: true,
      message: 'Logo deleted successfully',
    });
    
  } catch (error) {
    console.error('Delete logo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete logo',
    });
  }
};

/**
 * Update app name
 * Quick update endpoint for app name only
 * @route PATCH /api/config/app-name
 */
const updateAppName = async (req, res) => {
  try {
    const { appName } = req.body;
    
    if (!appName || appName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'App name is required',
      });
    }
    
    const config = await AppConfig.updateConfig({ appName });
    
    // Invalidate cache
    await invalidateAppConfigCache();
    
    console.log('App name updated:', appName);
    
    return res.status(200).json({
      success: true,
      message: 'App name updated successfully',
      appName: config.appName,
    });
    
  } catch (error) {
    console.error('Update app name error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update app name',
    });
  }
};

module.exports = {
  getConfig,
  updateConfig,
  uploadLogo,
  deleteLogo,
  updateAppName,
};