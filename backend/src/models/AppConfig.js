/**
 * AppConfig Model
 * Stores global application configuration editable from admin panel
 * Single document pattern - only one config document exists in database
 * Manages app name, logo URL (from Cloudinary), game settings, and maintenance mode
 */

const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema(
  {
    // Application display name shown in mobile app
    // Editable from admin panel
    appName: {
      type: String,
      required: true,
      default: 'Hrashwa-Dirga',
      trim: true,
    },
    
    // Cloudinary URL for app logo
    // MANDATORY: Must be uploaded through admin panel to Cloudinary
    logoUrl: {
      type: String,
      default: '',
    },
    
    // Cloudinary public ID for logo deletion
    // Stored when logo is uploaded
    logoPublicId: {
      type: String,
      default: '',
    },
    
    // App version string for tracking updates
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    
    // Maintenance mode flag
    // When true, app shows maintenance screen to all users
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    
    // Message displayed during maintenance mode
    maintenanceMessage: {
      type: String,
      default: 'App is under maintenance. Please check back soon.',
    },
    
    // Game configuration settings
    // All values editable from admin panel
    gameSettings: {
      // Coins awarded on first day (user signup)
      initialCoins: {
        type: Number,
        default: 30,
        min: 0,
      },
      
      // Daily coins awarded after first day
      dailyCoins: {
        type: Number,
        default: 15,
        min: 0,
      },
      
      // Coins cost per hint usage
      hintCost: {
        type: Number,
        default: 15,
        min: 0,
      },
      
      // Bonus coins awarded for completing entire level
      levelCompletionBonus: {
        type: Number,
        default: 5,
        min: 0,
      },
      
      // Maximum hints available per question
      // Default 2 because 3 options - 1 correct = 2 can be eliminated
      maxHintsPerQuestion: {
        type: Number,
        default: 2,
        min: 0,
        max: 2,
      },
      
      // Base score for correct answer
      baseScore: {
        type: Number,
        default: 10,
        min: 1,
      },
      
      // Score penalty per hint used
      hintScorePenalty: {
        type: Number,
        default: 3,
        min: 0,
      },
    },
    
    // Admin contact email for support
    contactEmail: {
      type: String,
      default: 'support@hrashwadirga.com',
    },
    
    // URLs for legal documents
    termsUrl: {
      type: String,
      default: '',
    },
    
    privacyUrl: {
      type: String,
      default: '',
    },
    
    // Social media links (optional)
    socialLinks: {
      facebook: {
        type: String,
        default: '',
      },
      twitter: {
        type: String,
        default: '',
      },
      instagram: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to get current configuration
 * Implements singleton pattern - always returns single config document
 * Creates default config if none exists
 * @returns {Promise<AppConfig>} Current app configuration
 */
appConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  
  // If no config document exists, create one with defaults
  if (!config) {
    config = await this.create({});
    console.log('Created default app configuration');
  }
  
  return config;
};

/**
 * Static method to update configuration
 * Merges provided updates with existing config
 * Only updates fields that are explicitly provided
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<AppConfig>} Updated configuration
 */
appConfigSchema.statics.updateConfig = async function (updates) {
  let config = await this.getConfig();
  
  // Update top-level fields
  Object.keys(updates).forEach((key) => {
    if (updates[key] !== undefined && key !== 'gameSettings') {
      config[key] = updates[key];
    }
  });
  
  // Special handling for nested gameSettings object
  if (updates.gameSettings) {
    Object.keys(updates.gameSettings).forEach((key) => {
      if (updates.gameSettings[key] !== undefined) {
        config.gameSettings[key] = updates.gameSettings[key];
      }
    });
  }
  
  await config.save();
  return config;
};

/**
 * Static method to update logo URL and public ID
 * Called after successful Cloudinary upload
 * @param {string} logoUrl - Cloudinary secure URL
 * @param {string} logoPublicId - Cloudinary public ID for deletion
 * @returns {Promise<AppConfig>}
 */
appConfigSchema.statics.updateLogo = async function (logoUrl, logoPublicId) {
  let config = await this.getConfig();
  config.logoUrl = logoUrl;
  config.logoPublicId = logoPublicId;
  await config.save();
  return config;
};

/**
 * Static method to remove logo
 * Clears logo URL and public ID
 * Note: Actual Cloudinary deletion should be done separately
 * @returns {Promise<AppConfig>}
 */
appConfigSchema.statics.removeLogo = async function () {
  let config = await this.getConfig();
  config.logoUrl = '';
  config.logoPublicId = '';
  await config.save();
  return config;
};

/**
 * Instance method to check if app is in maintenance mode
 * @returns {boolean}
 */
appConfigSchema.methods.isInMaintenance = function () {
  return this.maintenanceMode;
};

/**
 * Instance method to get game settings
 * Returns only the game settings object
 * @returns {Object} Game settings configuration
 */
appConfigSchema.methods.getGameSettings = function () {
  return this.gameSettings;
};

module.exports = mongoose.model('AppConfig', appConfigSchema);