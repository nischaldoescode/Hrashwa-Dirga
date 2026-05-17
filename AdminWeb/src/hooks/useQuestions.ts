/**
 * Questions Hook
 * Manages question data and operations
 */

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAllQuestions,
  getQuestionsByLevel,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/api/questions";
import { QUERY_KEYS } from "@/lib/constants";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/axios";
import type { PaginationMeta, Question, QuestionFormValues } from "@/types";

interface QuestionsCachePage {
  questions: Question[];
  pagination?: PaginationMeta;
}

/**
 * Fetch all questions with pagination
 */
/**
 * Fetch all questions with pagination
 * Returns empty data structure if query fails or returns undefined
 *
 * @param {number} page - Current page number (default: 1)
 * @param {number} limit - Items per page (default: 50)
 * @returns Query result with questions data and pagination metadata
 */
export const useQuestions = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.QUESTIONS.ALL, page, limit],
    queryFn: () => getAllQuestions(page, limit),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    placeholderData: keepPreviousData,
  });
};

/**
 * Fetch questions by level ID
 */
export const useQuestionsByLevel = (levelId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.QUESTIONS.BY_LEVEL(levelId),
    queryFn: () => getQuestionsByLevel(levelId),
    enabled: !!levelId,
  });
};

/**
 * Fetch single question by ID
 */
export const useQuestion = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.QUESTIONS.BY_ID(id),
    queryFn: () => getQuestionById(id),
    enabled: !!id,
  });
};

/**
 * Create question mutation
 */
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuestionFormValues) => createQuestion(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUESTIONS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.QUESTIONS.BY_LEVEL(variables.levelId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.ALL });
      toast.success("Question created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Update question mutation
 */
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<QuestionFormValues>;
    }) => updateQuestion(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUESTIONS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.QUESTIONS.BY_ID(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.ALL });
      toast.success("Question updated successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

/**
 * Delete question mutation
 */
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: async (_, deletedQuestionId) => {
      // Step 1: Remove the deleted question from ALL cached pages immediately (optimistic update)
      queryClient.setQueriesData<QuestionsCachePage>(
        { queryKey: QUERY_KEYS.QUESTIONS.ALL },
        (oldData) => {
          if (!oldData?.questions) return oldData;
          const nextTotalCount = Math.max(
            0,
            (oldData.pagination?.totalCount ?? oldData.questions.length) - 1
          );

          return {
            ...oldData,
            questions: oldData.questions.filter((q) => q._id !== deletedQuestionId),
            pagination: oldData.pagination
              ? {
                  ...oldData.pagination,
                  totalCount: nextTotalCount,
                  totalPages: Math.ceil(nextTotalCount / oldData.pagination.limit),
                }
              : oldData.pagination,
          };
        }
      );
      
      // Step 2: Invalidate all question-related queries to force refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUESTIONS.ALL }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUESTIONS.BY_ID(deletedQuestionId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.ALL }),
      ]);
      
      // Step 3: Force immediate refetch of current page
      await queryClient.refetchQueries({ 
        queryKey: QUERY_KEYS.QUESTIONS.ALL,
        type: 'active',
      });
      
      toast.success("Question deleted successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
