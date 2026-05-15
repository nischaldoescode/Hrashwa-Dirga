/**
 * Levels Hook
 * Manages level data and operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
} from '@/api/levels'
import { QUERY_KEYS } from '@/lib/constants'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/axios'
import type { Level, LevelFormValues, PaginationMeta, Question } from '@/types'

interface QuestionsCachePage {
  questions: Question[]
  pagination?: PaginationMeta
}

/**
 * Fetch all levels
 * Returns empty array if no levels exist or query fails
 * 
 * @returns Query result with array of levels
 */
export const useLevels = () => {
  return useQuery({
    queryKey: QUERY_KEYS.LEVELS.ALL,
    queryFn: getAllLevels,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    placeholderData: [],
  })
}
/**
 * Fetch single level by ID
 */
export const useLevel = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.LEVELS.BY_ID(id),
    queryFn: () => getLevelById(id),
    enabled: !!id,
  })
}

/**
 * Create level mutation
 */
export const useCreateLevel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LevelFormValues) => createLevel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.ALL })
      toast.success('Level created successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

/**
 * Update level mutation
 */
export const useUpdateLevel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LevelFormValues> }) =>
      updateLevel(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.ALL })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.BY_ID(variables.id) })
      toast.success('Level updated successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

/**
 * Delete level mutation
 */
export const useDeleteLevel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteLevel(id),
    onMutate: async (deletedLevelId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.LEVELS.ALL }),
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.QUESTIONS.ALL }),
      ])

      const previousLevels = queryClient.getQueryData<Level[]>(QUERY_KEYS.LEVELS.ALL)
      const previousQuestionPages = queryClient.getQueriesData<QuestionsCachePage>({
        queryKey: QUERY_KEYS.QUESTIONS.ALL,
      })

      queryClient.setQueryData<Level[]>(QUERY_KEYS.LEVELS.ALL, (oldLevels) =>
        oldLevels?.filter((level) => level._id !== deletedLevelId) ?? []
      )

      queryClient.setQueriesData<QuestionsCachePage>(
        { queryKey: QUERY_KEYS.QUESTIONS.ALL },
        (oldData) => {
          if (!oldData?.questions) return oldData

          const questions = oldData.questions.filter(
            (question) => question.levelId?._id !== deletedLevelId
          )
          const removedCount = oldData.questions.length - questions.length

          return {
            ...oldData,
            questions,
            pagination: oldData.pagination
              ? {
                  ...oldData.pagination,
                  totalCount: Math.max(0, oldData.pagination.totalCount - removedCount),
                }
              : oldData.pagination,
          }
        }
      )

      return { previousLevels, previousQuestionPages }
    },
    onSuccess: async (_, deletedLevelId) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.LEVELS.BY_ID(deletedLevelId) })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.ALL }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUESTIONS.ALL }),
      ])

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.LEVELS.ALL,
          type: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.QUESTIONS.ALL,
          type: 'active',
        }),
      ])

      toast.success('Level deleted successfully')
    },
    onError: (error, _deletedLevelId, context) => {
      if (context?.previousLevels) {
        queryClient.setQueryData(QUERY_KEYS.LEVELS.ALL, context.previousLevels)
      }

      context?.previousQuestionPages?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })

      toast.error(getErrorMessage(error))
    },
  })
}
