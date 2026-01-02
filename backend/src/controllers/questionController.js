/**
 * Question Controller
 * Handles question answering and hint usage with Redis caching
 */

const Question = require("../models/Question");
const Level = require("../models/Level");
const User = require("../models/User");
const {
  invalidateLevelsCache,
  invalidateQuestionsCache,
  invalidateLeaderboardCache,
  invalidateUserCache,
} = require("../config/redis");

/**
 * Helper function to invalidate all question-related caches
 * Ensures admin panel and app see updated data immediately
 */
const invalidateAllQuestionCaches = async (levelId) => {
  const {
    invalidateLevelsCache,
    invalidateQuestionsCache,
    deleteCachePattern,
  } = require("../config/redis");

  try {
    await Promise.all([
      invalidateLevelsCache(),
      invalidateQuestionsCache(levelId),
      deleteCachePattern("questions:all:*"), // Use pattern deletion
    ]);

    console.log(`All question caches invalidated for level ${levelId}`);
  } catch (error) {
    console.error("Cache invalidation failed:", error);
  }
};

const createQuestion = async (req, res) => {
  try {
    const { levelId, questionText, options, correctAnswer, orderInLevel } =
      req.body;

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    // Count existing active questions for this level
    const existingQuestionsCount = await Question.countDocuments({
      levelId,
      isActive: true,
    });

    // Validate orderInLevel is sequential
    let validatedOrder = orderInLevel;

    if (orderInLevel !== undefined) {
      // If orderInLevel is provided, validate it's the next sequential number
      if (orderInLevel !== existingQuestionsCount) {
        return res.status(400).json({
          success: false,
          message: `Invalid order. Next question must have order ${existingQuestionsCount}. Current question count: ${existingQuestionsCount}`,
        });
      }
    } else {
      // If not provided, auto-assign next sequential number
      validatedOrder = existingQuestionsCount;
    }

    // Check for duplicate orderInLevel in this level
    const duplicateOrder = await Question.findOne({
      levelId,
      orderInLevel: validatedOrder,
      isActive: true,
    });

    if (duplicateOrder) {
      return res.status(400).json({
        success: false,
        message: `Question with order ${validatedOrder} already exists in this level. Next available order: ${existingQuestionsCount}`,
      });
    }

    const question = await Question.create({
      levelId,
      questionText,
      options,
      correctAnswer,
      orderInLevel: validatedOrder,
      isActive: true,
    });

    await level.addQuestion(question._id);

    // Verify the question was added
    const updatedLevel = await Level.findById(levelId);
    console.log(`Level now has ${updatedLevel.questions.length} questions`);
    // Invalidate ALL relevant caches to ensure fresh data
    await Promise.all([
      invalidateLevelsCache(),
      invalidateQuestionsCache(levelId),
      // Also invalidate the "all questions" cache key
      require("../config/redis").deleteCache("questions:all:1:50"), // Default pagination
      require("../config/redis").deleteCache("questions:all:*"), // All pagination variants
    ]);

    console.log(`Question created with order ${validatedOrder}:`, question._id);

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: {
        question: question,
        nextAvailableOrder: existingQuestionsCount + 1,
      },
    });
  } catch (error) {
    console.error("Create question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create question",
    });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (updates.options && updates.options.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Question must have exactly 3 options",
      });
    }

    if (updates.correctAnswer) {
      const optionsToCheck = updates.options || question.options;
      if (!optionsToCheck.includes(updates.correctAnswer)) {
        return res.status(400).json({
          success: false,
          message: "Correct answer must be one of the options",
        });
      }
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        question[key] = updates[key];
      }
    });

    await question.save();

    // Invalidate caches
    await invalidateLevelsCache();
    await invalidateQuestionsCache(question.levelId.toString());

    console.log("Question updated:", id);

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question: question,
    });
  } catch (error) {
    console.error("Update question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update question",
    });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const levelId = question.levelId.toString();

    const level = await Level.findById(levelId);
    if (level) {
      await level.removeQuestion(question._id);
    }

    await Question.findByIdAndDelete(id);

    // Invalidate ALL question-related caches
    const {
      invalidateLevelsCache,
      invalidateQuestionsCache,
      deleteCachePattern,
    } = require("../config/redis");

    await Promise.all([
      // Invalidate level caches (question count changed)
      invalidateLevelsCache(),

      // Invalidate questions for this specific level
      invalidateQuestionsCache(levelId),

      // CRITICAL: Invalidate ALL "questions:all" caches using pattern matching
      deleteCachePattern("questions:all:*"),
    ]);

    console.log("Question deleted and caches invalidated:", id);

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
    });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id).populate(
      "levelId",
      "levelNumber levelName"
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      question: question,
    });
  } catch (error) {
    console.error("Get question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch question",
    });
  }
};

const getQuestionsByLevel = async (req, res) => {
  try {
    const { levelId } = req.params;

    const questions = await Question.find({ levelId, isActive: true })
      .sort({ orderInLevel: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        questions: questions,
        count: questions.length,
      },
    });
  } catch (error) {
    console.error("Get questions by level error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
    });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [questions, totalCount] = await Promise.all([
      Question.find()
        .populate("levelId", "levelNumber levelName")
        .sort({ levelId: 1, orderInLevel: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Question.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get all questions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
    });
  }
};

const submitAnswer = async (req, res) => {
  try {
    // Fetch full user document (req.user from middleware might be lean)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { questionId, selectedAnswer, hintsUsed } = req.body;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (!question.isActive) {
      return res.status(400).json({
        success: false,
        message: "Question is not active",
      });
    }

    const alreadyCompleted = user.hasCompletedQuestion(questionId);
    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "Question already completed",
      });
    }

    const isCorrect = selectedAnswer === question.correctAnswer;

    await question.recordAttempt(isCorrect, hintsUsed);

    let scoreEarned = 0;
    if (isCorrect) {
      scoreEarned = await user.updateScore(hintsUsed);
    }

    user.completedQuestions.push({
      questionId: question._id,
      selectedAnswer: selectedAnswer,
      isCorrect: isCorrect,
      hintsUsed: hintsUsed,
      completedAt: new Date(),
    });

    await user.save();

    // Invalidate all relevant caches
    await Promise.all([
      invalidateLeaderboardCache(),
      invalidateUserCache(user._id.toString()),
      invalidateQuestionsCache(question.levelId.toString()),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        isCorrect: isCorrect,
        correctAnswer: question.correctAnswer,
        scoreEarned: scoreEarned,
        currentScore: user.totalScore,
        currentCoins: user.coins,
      },
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit answer",
    });
  }
};

const useHint = async (req, res) => {
  try {
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    // Fetch the full Mongoose user document
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // CHECK DAILY HINT LIMIT FIRST
    if (!user.canUseHintToday()) {
      return res.status(400).json({
        success: false,
        message: "Daily hint limit reached. Come back tomorrow!",
        dailyLimitReached: true,
        hintsUsedToday: user.dailyHintUsage.hintsUsedToday,
        maxHintsPerDay: user.dailyHintUsage.maxHintsPerDay,
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (!question.isActive) {
      return res.status(400).json({
        success: false,
        message: "Question is not active",
      });
    }

    // Check if user already completed this question
    const alreadyCompleted = user.hasCompletedQuestion(questionId);
    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "Cannot use hint on completed question",
      });
    }

    // Check if question has enough incorrect options to remove
    if (question.options.length <= 2) {
      return res.status(400).json({
        success: false,
        message: "Not enough options to remove",
      });
    }

    if (user.coins < 15) {
      return res.status(400).json({
        success: false,
        message: "Insufficient coins. You need 15 coins to use a hint.",
        currentCoins: user.coins,
        required: 15,
      });
    }

    // Deduct coins first
    const deducted = await user.deductCoins(15);
    if (!deducted) {
      return res.status(400).json({
        success: false,
        message: "Failed to deduct coins. Please try again.",
      });
    }

    try {
      const optionToRemove = question.removeOneIncorrectOption();

      // RECORD HINT USAGE
      await user.recordHintUsage();

      // Invalidate caches
      await Promise.all([
        invalidateUserCache(user._id.toString()),
        invalidateQuestionsCache(question.levelId.toString()),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          optionToRemove: optionToRemove,
          coinsRemaining: user.coins,
          hintsRemainingToday:
            user.dailyHintUsage.maxHintsPerDay -
            user.dailyHintUsage.hintsUsedToday,
        },
        message: "Hint used successfully",
      });
    } catch (hintError) {
      // Refund coins if hint removal fails
      await user.addRewardCoins(15);
      throw hintError;
    }
  } catch (error) {
    console.error("Use hint error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to use hint. Please try again.",
    });
  }
};


const getNextQuestion = async (req, res) => {
  try {
    const user = req.user;
    const { levelId } = req.params;

    const level = await Level.findById(levelId).populate("questions");

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    const completedQuestionIds = user.completedQuestions.map((cq) =>
      cq.questionId.toString()
    );

    const nextQuestion = level.questions.find(
      (q) => q.isActive && !completedQuestionIds.includes(q._id.toString())
    );

    if (!nextQuestion) {
      return res.status(200).json({
        success: true,
        data: {
          levelCompleted: true,
          message: "All questions in this level completed",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        question: {
          id: nextQuestion._id,
          questionText: nextQuestion.questionText,
          options: nextQuestion.getShuffledOptions(),
        },
        levelCompleted: false,
      },
    });
  } catch (error) {
    console.error("Get next question error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch next question",
    });
  }
};

module.exports = {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestionsByLevel,
  getAllQuestions,
  submitAnswer,
  useHint,
  getNextQuestion,
};
