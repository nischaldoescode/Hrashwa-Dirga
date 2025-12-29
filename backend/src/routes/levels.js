const express = require('express');
const router = express.Router();
const {
  createLevel,
  updateLevel,
  deleteLevel,
  getLevelById,
  getAllLevels,
  getPublishedLevels,
  getLevelQuestions,
  completeLevel,
} = require('../controllers/levelController');
const { authMiddleware } = require('../middleware/auth');
const { adminAuthMiddleware } = require('../middleware/adminAuth');
const {
  validateCreateLevel,
  validateUpdateLevel,
  validateMongoId,
} = require('../utils/validators');
const { cacheFor } = require('../middleware/cacheMiddleware');

router.post('/', adminAuthMiddleware, validateCreateLevel, createLevel);
router.put('/:id', adminAuthMiddleware, validateUpdateLevel, updateLevel);
router.delete('/:id', adminAuthMiddleware, validateMongoId, deleteLevel);
router.get('/all', adminAuthMiddleware, cacheFor(300), getAllLevels);
router.get('/published', authMiddleware, cacheFor(180), getPublishedLevels);
router.get('/:id', adminAuthMiddleware, validateMongoId, cacheFor(300), getLevelById);
router.get('/:id/questions', authMiddleware, cacheFor(180), getLevelQuestions);
router.post('/:levelId/complete', authMiddleware, completeLevel);

module.exports = router;