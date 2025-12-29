/**
 * Level API
 * Handles level data retrieval and completion
 */

import axiosInstance from './axiosConfig';
import { Level, LevelCompletionResponse } from '@/types/game.types';
import { ApiResponse } from '@/types/api.types';

/**
 * Fetch all published levels with user progress
 * Returns levels with completion status and unlock state
 * @returns Array of levels with progress data
 */
export const getPublishedLevels = async (): Promise<Level[]> => {
  const response = await axiosInstance.get<ApiResponse<{ levels: Level[] }>>(
    '/levels/published'
  );
  return response.data.data!.levels;
};

/**
 * Fetch questions for specific level
 * Returns level details and all questions with user answers
 * @param levelId MongoDB ObjectId of the level
 * @returns Level info and questions array
 */
export const getLevelQuestions = async (levelId: string): Promise<{
  level: {
    id: string;
    levelNumber: number;
    levelName: string;
  };
  questions: Array<any>;
}> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/levels/${levelId}/questions`
  );
  return response.data.data!;
};

/**
 * Mark level as completed
 * Awards bonus coins and unlocks next level
 * @param levelId MongoDB ObjectId of the level
 * @returns Completion rewards and updated user stats
 */
export const completeLevel = async (levelId: string): Promise<LevelCompletionResponse> => {
  const response = await axiosInstance.post<LevelCompletionResponse>(
    `/levels/${levelId}/complete`
  );
  return response.data;
};