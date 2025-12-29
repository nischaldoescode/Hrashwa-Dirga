/**
 * Game Store
 * Manages game state including levels, questions, and offline queue
 */

import { create } from 'zustand';
import { Level, QuestionWithStatus } from '@/types/game.types';
import { cacheService } from '@/services/cacheService';
import { STORAGE_KEYS } from '@/utils/constants';
import { storageService } from '@/utils/storage';

interface OfflineAnswer {
  questionId: string;
  selectedAnswer: string;
  hintsUsed: number;
  timestamp: number;
}

interface GameStore {
  levels: Level[];
  currentLevel: Level | null;
  currentQuestions: QuestionWithStatus[];
  currentQuestionIndex: number;
  isLoadingLevels: boolean;
  isLoadingQuestions: boolean;
  offlineAnswers: OfflineAnswer[];
  hasLoadedInitialData: boolean;
  currentIncompleteLevel: Level | null;
  
  setLevels: (levels: Level[]) => void;
  setCurrentLevel: (level: Level | null) => void;
  setCurrentQuestions: (questions: QuestionWithStatus[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setLoadingLevels: (loading: boolean) => void;
  setLoadingQuestions: (loading: boolean) => void;
  addRemovedOption: (questionId: string, option: string) => void;
  incrementHintsUsed: (questionId: string) => void;
  queueOfflineAnswer: (answer: OfflineAnswer) => void;
  getOfflineAnswers: () => OfflineAnswer[];
  clearOfflineAnswers: () => void;
  setHasLoadedInitialData: (loaded: boolean) => void;
  setCurrentIncompleteLevel: (level: Level | null) => void;
  clearGameData: () => void;
}
/**
 * Create game store
 * Handles all game-related state and offline queuing
 */
export const useGameStore = create<GameStore>((set, get) => ({
  levels: [],
  currentLevel: null,
  currentQuestions: [],
  currentQuestionIndex: 0,
  isLoadingLevels: false,
  isLoadingQuestions: false,
  offlineAnswers: [],
  hasLoadedInitialData: false,
  currentIncompleteLevel: null,

  /**
   * Set levels array
   * Caches levels for offline access
   * @param levels Array of levels
   */
  setLevels: (levels) => {
    set({ levels });
    cacheService.cacheLevels(levels);
  },

  /**
   * Set current active level
   * @param level Level object or null
   */
  setCurrentLevel: (level) => {
    set({ currentLevel: level, currentQuestionIndex: 0 });
  },

  /**
   * Set questions for current level
   * Caches questions for offline access
   * @param questions Array of questions with status
   */
  setCurrentQuestions: (questions) => {
    set({ currentQuestions: questions });
    
    if (questions.length > 0 && get().currentLevel) {
      const levelId = get().currentLevel!.id;
      cacheService.cacheQuestions(levelId, questions);
    }
  },

  /**
   * Set current question index for navigation
   * @param index Question index in array
   */
  setCurrentQuestionIndex: (index) => {
    set({ currentQuestionIndex: index });
  },

  /**
   * Set loading state for levels fetch
   * @param loading Loading status
   */
  setLoadingLevels: (loading) => {
    set({ isLoadingLevels: loading });
  },

  /**
   * Set loading state for questions fetch
   * @param loading Loading status
   */
  setLoadingQuestions: (loading) => {
    set({ isLoadingQuestions: loading });
  },

  /**
   * Add removed option to question (hint used)
   * @param questionId Question identifier
   * @param option Option text that was removed
   */
  addRemovedOption: (questionId, option) => {
    const { currentQuestions } = get();
    const updatedQuestions = currentQuestions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          removedOptions: [...(q.removedOptions || []), option],
        };
      }
      return q;
    });
    set({ currentQuestions: updatedQuestions });
  },

  /**
   * Increment hints used count for question
   * @param questionId Question identifier
   */
  incrementHintsUsed: (questionId) => {
    const { currentQuestions } = get();
    const updatedQuestions = currentQuestions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          hintsUsed: (q.hintsUsed || 0) + 1,
        };
      }
      return q;
    });
    set({ currentQuestions: updatedQuestions });
  },

  /**
   * Queue answer for offline sync
   * Stores answer locally until internet connection restored
   * @param answer Answer submission data
   */
  queueOfflineAnswer: (answer) => {
    const { offlineAnswers } = get();
    const updated = [...offlineAnswers, answer];
    set({ offlineAnswers: updated });
    storageService.setObject(STORAGE_KEYS.OFFLINE_QUEUE, updated);
  },

  /**
   * Get all queued offline answers
   * @returns Array of offline answers
   */
  getOfflineAnswers: () => {
    const stored = storageService.getObject<OfflineAnswer[]>(STORAGE_KEYS.OFFLINE_QUEUE);
    return stored || [];
  },

/**
   * Clear offline answer queue
   * Called after successful sync
   */
  clearOfflineAnswers: () => {
    set({ offlineAnswers: [] });
    storageService.delete(STORAGE_KEYS.OFFLINE_QUEUE);
  },

  /**
   * Mark initial data as loaded
   * Prevents redundant loading on app resume
   * @param loaded Loaded status
   */
  setHasLoadedInitialData: (loaded) => {
    set({ hasLoadedInitialData: loaded });
  },

  /**
   * Set current incomplete level for reminder
   * @param level Level object or null
   */
  setCurrentIncompleteLevel: (level) => {
    set({ currentIncompleteLevel: level });
  },

  /**
   * Clear all game data
   * Called on logout
   */
  /**
   * Clear all game data
   * Called on logout
   */
  clearGameData: () => {
    set({
      levels: [],
      currentLevel: null,
      currentQuestions: [],
      currentQuestionIndex: 0,
      offlineAnswers: [],
      hasLoadedInitialData: false,
      currentIncompleteLevel: null, // ADD THIS LINE
    });
    cacheService.clearAllCache();
  },
}));