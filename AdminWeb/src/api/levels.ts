/**
 * Levels API Service
 * Handles level CRUD operations
 */

import axiosInstance from "./axios";
import type { ApiResponse, Level, LevelFormValues } from "@/types";

/**
 * Fetch all levels with question counts
 * Backend returns: { success, data: { levels: Level[] }, cached }
 */
export const getAllLevels = async (): Promise<Level[]> => {
  const response = await axiosInstance.get<ApiResponse<{ levels: Level[] }>>(
    "/levels/all"
  );

  // Safely handle response structure
  if (!response.data.data) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Invalid response structure from server");
  }

  return response.data.data.levels;
};

/**
 * Fetch single level by ID with populated questions
 * Backend returns: { success, data: { level: Level }, cached }
 */
export const getLevelById = async (id: string): Promise<Level> => {
  const response = await axiosInstance.get<ApiResponse<{ level: Level }>>(
    `/levels/${id}`
  );

  if (!response.data.data?.level) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Invalid response structure from server");
  }

  return response.data.data.level;
};

/**
 * Create new level
 */
export const createLevel = async (data: LevelFormValues): Promise<Level> => {
  const response = await axiosInstance.post<ApiResponse<{ level: Level }>>(
    "/levels",
    data
  );
  if (!response.data.data?.level) {
    console.error("Unexpected response structure:", response.data);
    throw new Error("Failed to create level - invalid response structure");
  }
  return response.data.data.level;
};

/**
 * Update existing level
 */
export const updateLevel = async (
  id: string,
  data: Partial<LevelFormValues>
): Promise<Level> => {
  const response = await axiosInstance.put<ApiResponse<{ level: Level }>>(
    `/levels/${id}`,
    data
  );

    if (!response.data.data?.level) {
    console.error('Unexpected response structure:', response.data)
    throw new Error('Failed to update level - invalid response structure')
  }
  
  return response.data.data.level
};

/**
 * Delete level and associated questions
 */
export const deleteLevel = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/levels/${id}`);
};
