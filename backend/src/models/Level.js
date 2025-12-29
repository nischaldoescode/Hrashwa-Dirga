/**
 * Level Model
 * Represents a game level containing multiple questions
 * Manages level progression, question organization, and publishing status
 * Each level is identified by a unique levelNumber (1, 2, 3, etc.)
 */

const mongoose = require("mongoose");

const levelSchema = new mongoose.Schema(
  {
    // Unique level identifier (1, 2, 3, etc.)
    // Used for displaying "Level 1", "Level 2" in the app
    levelNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },

    // Human-readable name for the level
    // Examples: "Beginner", "Intermediate", "Advanced", "Expert"
    levelName: {
      type: String,
      required: true,
      trim: true,
    },

    // Array of question ObjectIds belonging to this level
    // Questions are added/removed through admin panel
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    // Publishing status flag
    // If false, level is hidden from users (useful for work-in-progress levels)
    isPublished: {
      type: Boolean,
      default: true,
    },

    // Custom sort order for levels display
    // Lower numbers appear first in the level selection screen
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Tracks creation and modification times
  }
);

/**
 * Index for displaying levels in correct order
 */
levelSchema.index({ displayOrder: 1 });

/**
 * Index for filtering published levels
 */
levelSchema.index({ isPublished: 1 });

/**
 * Virtual property to get total questions count without loading full question documents
 * Useful for displaying "Level 1 (5 questions)" in UI
 */
levelSchema.virtual("questionCount").get(function () {
  return this.questions.length;
});

/**
 * Pre-save hook to automatically set displayOrder to match levelNumber
 */
levelSchema.pre("save", function (next) {
  // Always sync displayOrder with levelNumber
  this.displayOrder = this.levelNumber;
  next();
});

/**
 * Instance method to add a question to this level
 * Prevents duplicate question IDs
 * @param {ObjectId} questionId - The MongoDB _id of the question to add
 * @returns {Promise<void>}
 */
levelSchema.methods.addQuestion = async function (questionId) {
  // Check if question already exists in this level
  const exists = this.questions.some(
    (id) => id.toString() === questionId.toString()
  );

  if (!exists) {
    this.questions.push(questionId);
    await this.save();
  }
};

/**
 * Instance method to remove a question from this level
 * @param {ObjectId} questionId - The MongoDB _id of the question to remove
 * @returns {Promise<void>}
 */
levelSchema.methods.removeQuestion = async function (questionId) {
  this.questions = this.questions.filter(
    (id) => id.toString() !== questionId.toString()
  );
  await this.save();
};

/**
 * Instance method to reorder questions within level
 * Updates the orderInLevel field of all questions in this level
 * @param {Array<ObjectId>} questionIds - Array of question IDs in desired order
 * @returns {Promise<void>}
 */
levelSchema.methods.reorderQuestions = async function (questionIds) {
  const Question = mongoose.model("Question");

  // Update orderInLevel for each question based on array index
  for (let i = 0; i < questionIds.length; i++) {
    await Question.findByIdAndUpdate(questionIds[i], {
      orderInLevel: i,
    });
  }

  // Update level's questions array with new order
  this.questions = questionIds;
  await this.save();
};

/**
 * Static method to get all published levels with question counts
 * Used for displaying level selection screen in app
 * @returns {Promise<Array>} Array of levels with metadata
 */
levelSchema.statics.getPublishedLevels = async function () {
  return await this.find({ isPublished: true })
    .sort({ displayOrder: 1, levelNumber: 1 })
    .select("levelNumber levelName questions displayOrder")
    .lean();
};

/**
 * Static method to get next level number for creating new levels
 * Ensures sequential level creation (no gaps allowed)
 * @returns {Promise<number>} Next available level number
 */
levelSchema.statics.getNextLevelNumber = async function () {
  const lastLevel = await this.findOne()
    .sort({ levelNumber: -1 })
    .select("levelNumber");

  return lastLevel ? lastLevel.levelNumber + 1 : 1;
};

/**
 * Static method to validate if a level number can be created
 * Prevents creating level N+2 without level N+1 existing
 * @param {number} levelNumber - The level number to validate
 * @returns {Promise<{valid: boolean, message: string}>}
 */
levelSchema.statics.validateLevelNumber = async function (levelNumber) {
  if (levelNumber === 1) {
    // Level 1 can always be created
    const existingLevel1 = await this.findOne({ levelNumber: 1 });
    if (existingLevel1) {
      return { valid: false, message: "Level 1 already exists" };
    }
    return { valid: true, message: "" };
  }

  // For level N, level N-1 must exist
  const previousLevel = await this.findOne({ levelNumber: levelNumber - 1 });
  if (!previousLevel) {
    return {
      valid: false,
      message: `Cannot create Level ${levelNumber}. Please create Level ${
        levelNumber - 1
      } first.`,
    };
  }

  // Check if this level number already exists
  const existingLevel = await this.findOne({ levelNumber });
  if (existingLevel) {
    return { valid: false, message: `Level ${levelNumber} already exists` };
  }

  return { valid: true, message: "" };
};

// Enable virtuals in JSON output (for questionCount)
levelSchema.set("toJSON", { virtuals: true });
levelSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Level", levelSchema);
