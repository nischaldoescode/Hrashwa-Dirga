/**
 * Questions API Service
 * Handles question CRUD operations
 */

import axiosInstance from "./axios";
import type {
  ApiResponse,
  Question,
  QuestionFormValues,
  PaginationMeta,
} from "@/types";

/**
 * Fetch all questions with pagination
 */
export const getAllQuestions = async (
  page: number = 1,
  limit: number = 50
): Promise<{ questions: Question[]; pagination: PaginationMeta }> => {
  const response = await axiosInstance.get<
    ApiResponse<{ questions: Question[]; pagination: PaginationMeta }>
  >(`/questions/all?page=${page}&limit=${limit}`);
  if (!response.data.data) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Invalid response structure from server");
  }

  return response.data.data!;
};

/**
 * Fetch questions by level ID
 */
export const getQuestionsByLevel = async (
  levelId: string
): Promise<Question[]> => {
  const response = await axiosInstance.get<
    ApiResponse<{ questions: Question[] }>
  >(`/questions/level/${levelId}`);
  if (!response.data.data?.questions) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Invalid response structure from server");
  }

  return response.data.data.questions;
};

/**
 * Fetch single question by ID
 */
export const getQuestionById = async (id: string): Promise<Question> => {
  const response = await axiosInstance.get<ApiResponse<{ question: Question }>>(
    `/questions/${id}`
  );
  if (!response.data.data?.question) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Invalid response structure from server");
  }

  return response.data.data!.question;
};

/**
 * Create new question
 */
export const createQuestion = async (
  data: QuestionFormValues
): Promise<Question> => {
  const response = await axiosInstance.post<
    ApiResponse<{ question: Question }>
  >("/questions", data);
  if (!response.data.data?.question) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Failed to create question - invalid response structure");
  }

  return response.data.data.question;
};

/**
 * Update existing question
 */
export const updateQuestion = async (
  id: string,
  data: Partial<QuestionFormValues>
): Promise<Question> => {
  const response = await axiosInstance.put<ApiResponse<{ question: Question }>>(
    `/questions/${id}`,
    data
  );
  if (!response.data.data?.question) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Failed to update question - invalid response structure");
  }

  return response.data.data.question;
};

/**
 * Delete question
 */
export const deleteQuestion = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/questions/${id}`);
};
