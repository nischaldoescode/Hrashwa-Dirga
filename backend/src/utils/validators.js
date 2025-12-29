/**
 * Validation Utilities
 * Custom validators for request data validation
 * Uses express-validator for standardized validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 * Returns 400 error with validation messages if validation fails
 * @returns {Function} Express middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  
  next();
};

/**
 * Validation rules for creating a new question
 * Ensures all required fields are present and valid
 */
const validateCreateQuestion = [
  body('levelId')
    .notEmpty().withMessage('Level ID is required')
    .isMongoId().withMessage('Invalid level ID format'),
  
  body('questionText')
    .notEmpty().withMessage('Question text is required')
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('Question text must be 1-500 characters'),
  
  body('options')
    .isArray({ min: 3, max: 3 }).withMessage('Exactly 3 options are required')
    .custom((options) => {
      // Check if all options are non-empty strings
      return options.every(opt => typeof opt === 'string' && opt.trim().length > 0);
    }).withMessage('All options must be non-empty strings'),
  
  body('correctAnswer')
    .notEmpty().withMessage('Correct answer is required')
    .custom((value, { req }) => {
      // Correct answer must be one of the provided options
      return req.body.options && req.body.options.includes(value);
    }).withMessage('Correct answer must be one of the provided options'),
  
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Explanation must be max 1000 characters'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  
  validate,
];

/**
 * Validation rules for updating a question
 * All fields are optional, but if provided must be valid
 */
const validateUpdateQuestion = [
  param('id')
    .isMongoId().withMessage('Invalid question ID'),
  
  body('questionText')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage('Question text must be 1-500 characters'),
  
  body('options')
    .optional()
    .isArray({ min: 3, max: 3 }).withMessage('Exactly 3 options are required')
    .custom((options) => {
      return options.every(opt => typeof opt === 'string' && opt.trim().length > 0);
    }).withMessage('All options must be non-empty strings'),
  
  body('correctAnswer')
    .optional()
    .custom((value, { req }) => {
      // If options are being updated, validate against new options
      if (req.body.options) {
        return req.body.options.includes(value);
      }
      return true; // Will be validated against existing options in controller
    }).withMessage('Correct answer must be one of the options'),
  
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Explanation must be max 1000 characters'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  validate,
];

/**
 * Validation rules for creating a level
 */
const validateCreateLevel = [
  body('levelNumber')
    .notEmpty().withMessage('Level number is required')
    .isInt({ min: 1 }).withMessage('Level number must be a positive integer'),
  
  body('levelName')
    .notEmpty().withMessage('Level name is required')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Level name must be 1-100 characters'),
  
  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
  
  validate,
];

/**
 * Validation rules for updating a level
 */
const validateUpdateLevel = [
  param('id')
    .isMongoId().withMessage('Invalid level ID'),
  
  body('levelName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Level name must be 1-100 characters'),
  
  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean'),
  
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a non-negative integer'),
  
  validate,
];

/**
 * Validation rules for submitting an answer
 */
const validateSubmitAnswer = [
  body('questionId')
    .notEmpty().withMessage('Question ID is required')
    .isMongoId().withMessage('Invalid question ID format'),
  
  body('selectedAnswer')
    .notEmpty().withMessage('Selected answer is required')
    .trim(),
  
  body('hintsUsed')
    .notEmpty().withMessage('Hints used count is required')
    .isInt({ min: 0, max: 2 }).withMessage('Hints used must be 0, 1, or 2'),
  
  validate,
];

/**
 * Validation rules for updating app config
 */
const validateUpdateConfig = [
  body('appName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('App name must be 1-100 characters'),
  
  body('appVersion')
    .optional()
    .trim()
    .matches(/^\d+\.\d+\.\d+$/).withMessage('App version must be in format X.Y.Z'),
  
  body('maintenanceMode')
    .optional()
    .isBoolean().withMessage('Maintenance mode must be a boolean'),
  
  body('maintenanceMessage')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Maintenance message must be max 500 characters'),
  
  body('gameSettings.initialCoins')
    .optional()
    .isInt({ min: 0 }).withMessage('Initial coins must be a non-negative integer'),
  
  body('gameSettings.dailyCoins')
    .optional()
    .isInt({ min: 0 }).withMessage('Daily coins must be a non-negative integer'),
  
  body('gameSettings.hintCost')
    .optional()
    .isInt({ min: 0 }).withMessage('Hint cost must be a non-negative integer'),
  
  body('gameSettings.levelCompletionBonus')
    .optional()
    .isInt({ min: 0 }).withMessage('Level completion bonus must be a non-negative integer'),
  
  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  
  validate,
];

/**
 * Validation rules for MongoDB ID params
 */
const validateMongoId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  validate,
];

/**
 * Validation rules for pagination query params
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  
  validate,
];

/**
 * Validation rules for leaderboard query
 */
const validateLeaderboard = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Limit must be 1-500'),
  
  validate,
];

/**
 * Validation rules for admin login
 */
const validateAdminLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .trim()
    .isEmail().withMessage('Invalid email format'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  validate,
];

module.exports = {
  validate,
  validateCreateQuestion,
  validateUpdateQuestion,
  validateCreateLevel,
  validateUpdateLevel,
  validateSubmitAnswer,
  validateUpdateConfig,
  validateMongoId,
  validatePagination,
  validateLeaderboard,
  validateAdminLogin,
};