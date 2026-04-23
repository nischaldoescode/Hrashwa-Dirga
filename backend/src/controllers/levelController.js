/**
 * Level Controller
 * Handles level data retrieval and completion with Redis caching
 */

const Level = require("../models/Level");
const Question = require("../models/Question");
const User = require("../models/User");
const {
  cacheLevels,
  getCachedLevels,
  cacheQuestions,
  getCachedQuestions,
  invalidateLevelsCache,
  invalidateQuestionsCache,
} = require("../config/redis");

const createLevel = async (req, res) => {
  try {
    const { levelNumber, levelName, isPublished } = req.body;

    // Validate sequential level creation
    const validation = await Level.validateLevelNumber(levelNumber);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Create level with displayOrder automatically set to levelNumber
    const level = await Level.create({
      levelNumber,
      levelName,
      isPublished: isPublished !== undefined ? isPublished : true,
      displayOrder: levelNumber, // Explicitly set to match levelNumber
      questions: [],
    });

    // Invalidate Redis cache
    await invalidateLevelsCache();

    console.log("Level created:", level.levelNumber);

    return res.status(201).json({
      success: true,
      message: "Level created successfully",
      data: { level },
    });
  } catch (error) {
    console.error("Create level error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create level",
    });
  }
};

const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const level = await Level.findById(id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    // Prevent changing levelNumber or displayOrder
    // These should remain synchronized and sequential
    const allowedUpdates = ["levelName", "isPublished"];

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && allowedUpdates.includes(key)) {
        level[key] = updates[key];
      }
    });

    await level.save();

    // Invalidate Redis cache
    await invalidateLevelsCache();

    console.log("Level updated:", id);

    // Consistent response structure with proper formatting
    return res.status(200).json({
      success: true,
      message: "Level updated successfully",
      data: {
        level: level,
      },
    });
  } catch (error) {
    console.error("Update level error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update level",
    });
  }
};

const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    const level = await Level.findById(id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    // Delete all associated questions
    await Question.deleteMany({ levelId: id });

    // Delete the level
    await Level.findByIdAndDelete(id);

    // Invalidate all level and question caches
    await invalidateLevelsCache();
    await invalidateQuestionsCache(id);

    console.log("Level deleted:", id);

    return res.status(200).json({
      success: true,
      message: "Level and associated questions deleted successfully",
    });
  } catch (error) {
    console.error("Delete level error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete level",
    });
  }
};

const getLevelById = async (req, res) => {
  try {
    const { id } = req.params;

    const level = await Level.findById(id).populate("questions");

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    // Consistent response structure
    return res.status(200).json({
      success: true,
      data: {
        level: level,
      },
    });
  } catch (error) {
    console.error("Get level error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch level",
    });
  }
};

const getAllLevels = async (req, res) => {
  try {
    const levels = await Level.find()
      .sort({ displayOrder: 1, levelNumber: 1 })
      .populate("questions")
      .lean();

    const levelsWithCounts = levels.map((level) => ({
      ...level,
      questionCount: level.questions.length,
    }));

    // Consistent response structure: always nest in data object
    return res.status(200).json({
      success: true,
      data: {
        levels: levelsWithCounts,
      },
    });
  } catch (error) {
    console.error("Get all levels error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch levels",
    });
  }
};

const getPublishedLevels = async (req, res) => {
  try {
    const user = req.user;

    // Try Redis cache first
    const cached = await getCachedLevels();
    if (cached) {
      const levelsWithProgress = processLevelsWithProgress(cached, user);
      return res.status(200).json({
        success: true,
        data: {
          levels: levelsWithProgress,
        },
        cached: true,
      });
    }

    // Cache miss - fetch from database
    const levels = await Level.find({ isPublished: true })
      .sort({ displayOrder: 1, levelNumber: 1 })
      .populate("questions")
      .lean();

    // Cache for future requests
    await cacheLevels(levels);

    const levelsWithProgress = processLevelsWithProgress(levels, user);

    return res.status(200).json({
      success: true,
      data: {
        levels: levelsWithProgress,
      },
      cached: false,
    });
  } catch (error) {
    console.error("Get published levels error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch levels",
    });
  }
};

/**
 * Helper function to process levels with user progress
 * Calculates completion status and unlock state
 */
const processLevelsWithProgress = (levels, user) => {
  return levels.map((level) => {
    const totalQuestions = level.questions.filter((q) => q.isActive).length;
    const completedQuestions = user.completedQuestions.filter((cq) =>
      level.questions.some(
        (q) => q._id.toString() === cq.questionId.toString(),
      ),
    ).length;

    const isCompleted = user.hasCompletedLevel(level._id);
    const isUnlocked =
      level.levelNumber === 1 ||
      user.currentLevel >= level.levelNumber ||
      isCompleted;

    return {
      id: level._id,
      levelNumber: level.levelNumber,
      levelName: level.levelName,
      totalQuestions: totalQuestions,
      completedQuestions: completedQuestions,
      isCompleted: isCompleted,
      isUnlocked: isUnlocked,
    };
  });
};

const getLevelQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Try Redis cache first
    const cached = await getCachedQuestions(id);
    if (cached) {
      // Still need to check unlock status with user data
      const level = await Level.findById(id);
      if (!level) {
        return res.status(404).json({
          success: false,
          message: "Level not found",
        });
      }

      const isUnlocked =
        level.levelNumber === 1 ||
        user.currentLevel >= level.levelNumber ||
        user.hasCompletedLevel(level._id);

      if (!isUnlocked) {
        return res.status(403).json({
          success: false,
          message: "Level is locked. Complete previous levels to unlock.",
        });
      }

      const questionsWithStatus = cached
        .filter((q) => q.isActive)
        .map((q) => {
          const userAnswer = user.hasCompletedQuestion(q._id);
          const isCompleted = !!userAnswer;

          // ONLY include correctAnswer if question is completed
          const questionData = {
            id: q._id,
            questionText: q.questionText,
            options: q.options,
            isCompleted: isCompleted,
            userAnswer: userAnswer
              ? {
                  selectedAnswer: userAnswer.selectedAnswer,
                  isCorrect: userAnswer.isCorrect,
                  correctAnswer: q.correctAnswer, // Correct answer in userAnswer object
                }
              : null,
          };

          // Add correctAnswer ONLY if completed
          if (isCompleted) {
            questionData.correctAnswer = q.correctAnswer;
          }

          return questionData;
        });

      return res.status(200).json({
        success: true,
        data: {
          level: {
            id: level._id,
            levelNumber: level.levelNumber,
            levelName: level.levelName,
          },
          questions: questionsWithStatus,
        },
        cached: true, // or true for cache branch
      });
    }

    // Cache miss - fetch from database
    const level = await Level.findById(id).populate("questions");

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    const isUnlocked =
      level.levelNumber === 1 ||
      user.currentLevel >= level.levelNumber ||
      user.hasCompletedLevel(level._id);

    if (!isUnlocked) {
      return res.status(403).json({
        success: false,
        message: "Level is locked. Complete previous levels to unlock.",
      });
    }

    const questionsWithStatus = level.questions
      .filter((q) => q.isActive)
      .map((q) => {
        const userAnswer = user.hasCompletedQuestion(q._id);
        const isCompleted = !!userAnswer;

        // ONLY include correctAnswer if question is completed
        const questionData = {
          id: q._id,
          questionText: q.questionText,
          options: q.options,
          isCompleted: isCompleted,
          userAnswer: userAnswer
            ? {
                selectedAnswer: userAnswer.selectedAnswer,
                isCorrect: userAnswer.isCorrect,
                correctAnswer: q.correctAnswer,
              }
            : null,
        };

        // Add correctAnswer ONLY if completed
        if (isCompleted) {
          questionData.correctAnswer = q.correctAnswer;
        }

        return questionData;
      });

    // Cache the questions
    await cacheQuestions(id, level.questions);

    return res.status(200).json({
      success: true,
      data: {
        level: {
          id: level._id,
          levelNumber: level.levelNumber,
          levelName: level.levelName,
        },
        questions: questionsWithStatus,
      },
      cached: false,
    });
  } catch (error) {
    console.error("Get level questions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch level questions",
    });
  }
};

const completeLevel = async (req, res) => {
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

    if (user.hasCompletedLevel(levelId)) {
      /**
       * return 200 instead of 400 when already completed.
       * the app navigates to ResultScreen after this call —
       * throwing 400 causes an error screen instead of the result.
       */
      return res.status(200).json({
        success: true,
        message: "Level already completed",
        alreadyCompleted: true,
        bonusCoins: 0,
        currentCoins: user.coins,
        currentLevel: user.currentLevel,
        totalScore: user.totalScore,
      });
    }

    const activeQuestions = level.questions.filter((q) => q.isActive);

    //Check that ALL questions are answered CORRECTLY
    const correctlyAnsweredQuestions = user.completedQuestions.filter((cq) => {
      const isInThisLevel = activeQuestions.some(
        (q) => q._id.toString() === cq.questionId.toString(),
      );
      return isInThisLevel && cq.isCorrect; // Must be correct!
    });

    const allQuestionsAnsweredCorrectly =
      correctlyAnsweredQuestions.length === activeQuestions.length;

    if (!allQuestionsAnsweredCorrectly) {
      return res.status(400).json({
        success: false,
        message: `You must answer all questions correctly to complete this level. Correct: ${correctlyAnsweredQuestions.length}/${activeQuestions.length}`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $addToSet: { completedLevels: level._id }, // use addToSet to avoid duplicates
        $set: { currentLevel: level.levelNumber + 1 },
        $inc: { coins: 5 }, // award reward coins atomically (replacement for addRewardCoins)
      },
      { new: true }, // return the updated document
    ).lean();

    // Invalidate all relevant caches
    const {
      invalidateLeaderboardCache,
      invalidateLevelsCache,
      invalidateUserCache,
    } = require("../config/redis");

    await Promise.all([
      invalidateLeaderboardCache(),
      invalidateLevelsCache(),
      invalidateUserCache(user._id.toString()),
    ]);

    console.log(`User ${user.email} completed level ${level.levelNumber}`);

    return res.status(200).json({
      success: true,
      message: "Level completed successfully",
      bonusCoins: 5,
      currentCoins: updatedUser.coins,
      currentLevel: updatedUser.currentLevel,
      totalScore: updatedUser.totalScore,
    });
  } catch (error) {
    console.error("Complete level error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete level",
    });
  }
};

module.exports = {
  createLevel,
  updateLevel,
  deleteLevel,
  getLevelById,
  getAllLevels,
  getPublishedLevels,
  getLevelQuestions,
  completeLevel,
};
