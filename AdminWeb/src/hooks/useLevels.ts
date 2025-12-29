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
import type { LevelFormValues } from '@/types'

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEVELS.ALL })
      toast.success('Level deleted successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}