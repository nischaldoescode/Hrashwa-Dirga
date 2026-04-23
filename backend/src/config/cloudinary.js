/**
 * Cloudinary Configuration
 * Handles image upload and management for app logo and other assets
 * Cloudinary is MANDATORY for this application
 */

const cloudinary = require("cloudinary").v2;
const CloudinaryStorage = require("multer-storage-cloudinary");
const multer = require("multer");

/**
 * Configure Cloudinary with credentials from environment variables
 * Must be called before using any Cloudinary operations
 */
const configureCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true, // Use HTTPS URLs
    });

    console.log("Cloudinary configured successfully");
  } catch (error) {
    console.error("Cloudinary configuration error:", error.message);
    throw new Error("Failed to configure Cloudinary. Check your credentials.");
  }
};

/**
 * Configure Multer storage to use Cloudinary
 * Automatically uploads files to Cloudinary when received
 * Organizes uploads in specific folders for better management
 */
const storage = CloudinaryStorage({
  cloudinary: cloudinary,
  folder: "hrashwa-dirga",
  allowedFormats: ["jpg", "jpeg", "png", "gif", "svg", "webp"],
  transformation: [{ width: 512, height: 512, crop: "limit" }],
});

/**
 * Multer middleware configured with Cloudinary storage
 * Use this in routes that need file upload functionality
 * Example: upload.single('logo') for single file upload
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validate file mimetype
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."), false);
    }
  },
});

/**
 * Upload image to Cloudinary directly (without multer)
 * Useful for base64 uploads or programmatic uploads
 * @param {string} filePath - Local file path or base64 string
 * @param {string} folder - Cloudinary folder name (default: 'hrashwa-dirga/logos')
 * @returns {Promise<Object>} Upload result with secure_url and public_id
 */
const uploadImage = async (filePath, folder = "hrashwa-dirga/logos") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "image",
      transformation: [{ width: 512, height: 512, crop: "limit" }],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

/**
 * Delete image from Cloudinary
 * Use when admin deletes logo or removes assets
 * @param {string} publicId - Cloudinary public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
    throw new Error("Failed to delete image from Cloudinary");
  }
};

/**
 * Get optimized image URL with transformations
 * Useful for generating thumbnails or responsive images
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed image URL
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: "auto", // Automatic format selection (WebP for supported browsers)
    quality: "auto", // Automatic quality optimization
    ...transformations,
  });
};

module.exports = {
  configureCloudinary,
  upload,
  uploadImage,
  deleteImage,
  getOptimizedUrl,
  cloudinary,
};
