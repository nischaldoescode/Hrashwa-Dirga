/**
 * Game Related Types
 * Levels, questions, and gameplay structures
 */

export interface Level {
  id: string;
  levelNumber: number;
  levelName: string;
  totalQuestions: number;
  completedQuestions: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  isCompleted?: boolean;
  correctAnswer: string;
  userAnswer?: {
    selectedAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
  };
}

export interface QuestionWithStatus extends Question {
  shuffledOptions?: string[];
  hintsUsed?: number;
  removedOptions?: string[];
}

export interface AnswerSubmission {
  questionId: string;
  selectedAnswer: string;
  hintsUsed: number;
}

export interface AnswerResponse {
  success: boolean;
  data: {
    isCorrect: boolean;
    correctAnswer: string;
    scoreEarned: number;
    currentScore: number;
    currentCoins: number;
  };
}

export interface LevelCompletionResponse {
  success: boolean;
  message: string;
  bonusCoins: number;
  currentCoins: number;
  currentLevel: number;
  totalScore: number;
}

export interface HintResponse {
  success: boolean;
  message: string;
  data: {
    optionToRemove: string;
    coinsRemaining: number;
  };
  // Add these for backward compatibility if backend sends them at root level
  optionToRemove?: string;
  coinsRemaining?: number;
}

export interface LeaderboardEntry {
  _id: string;
  displayName: string;
  photoURL: string | null;
  totalScore: number;
  email: string;
  rank: number;
}

export interface AppConfig {
  appName: string;
  logoUrl: string;
  appVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  gameSettings: {
    initialCoins: number;
    dailyCoins: number;
    hintCost: number;
    levelCompletionBonus: number;
    maxHintsPerQuestion: number;
    baseScore: number;
    hintScorePenalty: number;
  };
}
