const express = require('express');
const router = express.Router();
const {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestionsByLevel,
  getAllQuestions,
  submitAnswer,
  useHint,
  getNextQuestion,
} = require('../controllers/questionController');
const { authMiddleware } = require('../middleware/auth');
const { adminAuthMiddleware } = require('../middleware/adminAuth');
const {
  validateCreateQuestion,
  validateUpdateQuestion,
  validateSubmitAnswer,
  validateMongoId,
} = require('../utils/validators');
const { cacheFor } = require('../middleware/cacheMiddleware');

router.post('/', adminAuthMiddleware, validateCreateQuestion, createQuestion);
router.put('/:id', adminAuthMiddleware, validateUpdateQuestion, updateQuestion);
router.delete('/:id', adminAuthMiddleware, validateMongoId, deleteQuestion);
router.get('/all', adminAuthMiddleware, cacheFor(300), getAllQuestions);
router.get('/:id', adminAuthMiddleware, validateMongoId, cacheFor(300), getQuestionById);
router.get('/level/:levelId', authMiddleware, cacheFor(180), getQuestionsByLevel);
router.post('/submit-answer', authMiddleware, validateSubmitAnswer, submitAnswer);
router.post('/use-hint', authMiddleware, useHint);
router.get('/level/:levelId/next', authMiddleware, getNextQuestion);

module.exports = router;