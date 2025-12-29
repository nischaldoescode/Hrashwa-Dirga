/**
 * Question API
 * Handles question answering and hint usage
 */

import axiosInstance from './axiosConfig';
import { AnswerSubmission, AnswerResponse, HintResponse, Question } from '@/types/game.types';
import { ApiResponse } from '@/types/api.types';

/**
 * Submit answer for a question
 * Validates answer and updates user score
 * @param submission Answer data including questionId, selectedAnswer, and hintsUsed
 * @returns Answer correctness, score earned, and current totals
 */
export const submitAnswer = async (submission: AnswerSubmission): Promise<AnswerResponse> => {
  const response = await axiosInstance.post<AnswerResponse>(
    '/questions/submit-answer',
    submission
  );
  return response.data;
};

/**
 * Use hint for a question
 * Deducts 15 coins and removes one incorrect option
 * @param questionId MongoDB ObjectId of the question
 * @returns Removed option and remaining coins
 */
export const useHint = async (questionId: string): Promise<HintResponse> => {
  const response = await axiosInstance.post<HintResponse>('/questions/use-hint', {
    questionId,
  });
  return response.data;
};

/**
 * Get next unanswered question in level
 * Returns null if all questions completed
 * @param levelId MongoDB ObjectId of the level
 * @returns Next question or level completion status
 */
export const getNextQuestion = async (levelId: string): Promise<{
  question?: Question;
  levelCompleted: boolean;
}> => {
  const response = await axiosInstance.get<ApiResponse<any>>(
    `/questions/level/${levelId}/next`
  );
  return response.data.data!;
};

/**
 * Fetch questions for specific level
 * Alternative endpoint for level questions
 * @param levelId MongoDB ObjectId of the level
 * @returns Array of questions for the level
 */
export const getQuestionsByLevel = async (levelId: string): Promise<Question[]> => {
  const response = await axiosInstance.get<ApiResponse<{ questions: Question[] }>>(
    `/questions/level/${levelId}`
  );
  return response.data.data!.questions;
};