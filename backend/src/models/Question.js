/**
 * Question Model
 * Represents a single question in the game with exactly 3 options
 * Tracks question statistics for admin analytics
 * Each question belongs to exactly one level
 */

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    // Reference to parent level
    // Indexed for fast level-based queries
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
      index: true,
    },

    // The main question text/word displayed to user
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    // Exactly 3 answer options
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length === 3;
        },
        message: "Question must have exactly 3 options",
      },
    },

    // The correct answer must be one of the 3 options
    correctAnswer: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return this.options.includes(value);
        },
        message: "Correct answer must be one of the provided options",
      },
    },

    // Position of this question within its level (0-based)
    orderInLevel: {
      type: Number,
      default: 0,
    },

    // Active status flag for soft deletion
    isActive: {
      type: Boolean,
      default: true,
    },


    // Analytics data for admin dashboard
    stats: {
      totalAttempts: { type: Number, default: 0 },
      correctAttempts: { type: Number, default: 0 },
      hintsUsed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient level-based queries with ordering
questionSchema.index({ levelId: 1, orderInLevel: 1 });
questionSchema.index({ isActive: 1 });

// Virtual property to calculate success rate percentage
questionSchema.virtual("successRate").get(function () {
  if (this.stats.totalAttempts === 0) return 0;
  return parseFloat(
    ((this.stats.correctAttempts / this.stats.totalAttempts) * 100).toFixed(2)
  );
});

// Virtual property to calculate average hints used per attempt
questionSchema.virtual("averageHintsUsed").get(function () {
  if (this.stats.totalAttempts === 0) return 0;
  return parseFloat(
    (this.stats.hintsUsed / this.stats.totalAttempts).toFixed(2)
  );
});

// Instance method to record a user's attempt
questionSchema.methods.recordAttempt = async function (
  isCorrect,
  hintsUsed = 0
) {
  this.stats.totalAttempts += 1;
  if (isCorrect) this.stats.correctAttempts += 1;
  this.stats.hintsUsed += hintsUsed;
  await this.save();
};

// Instance method to get shuffled options
questionSchema.methods.getShuffledOptions = function () {
  const shuffled = [...this.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Instance method to remove one incorrect option (hint)
questionSchema.methods.removeOneIncorrectOption = function () {
  const incorrectOptions = this.options.filter(
    (option) => option !== this.correctAnswer
  );
  if (incorrectOptions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
  return incorrectOptions[randomIndex];
};

// Static method to get questions for a specific level
questionSchema.statics.getQuestionsForLevel = async function (
  levelId,
  activeOnly = true
) {
  const query = { levelId };
  if (activeOnly) query.isActive = true;
  return await this.find(query).sort({ orderInLevel: 1 }).lean();
};

// Static method to get aggregated statistics for admin dashboard
questionSchema.statics.getStatistics = async function (levelId = null) {
  const matchStage = levelId
    ? { levelId: mongoose.Types.ObjectId(levelId) }
    : {};

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        totalAttempts: { $sum: "$stats.totalAttempts" },
        totalCorrect: { $sum: "$stats.correctAttempts" },
        totalHints: { $sum: "$stats.hintsUsed" },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalQuestions: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      totalHints: 0,
      overallSuccessRate: 0,
    };
  }

  const data = stats[0];
  data.overallSuccessRate =
    data.totalAttempts > 0
      ? ((data.totalCorrect / data.totalAttempts) * 100).toFixed(2)
      : 0;

  return data;
};

// Enable virtuals in JSON output
questionSchema.set("toJSON", { virtuals: true });
questionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Question", questionSchema);
