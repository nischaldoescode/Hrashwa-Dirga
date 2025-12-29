/**
 * Cache Hook
 * Provides cache management helpers
 */

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useConfigStore } from '@/store/configStore';
import { useAuthStore } from '@/store/authStore';
import { cacheService } from '@/services/cacheService';
import { getPublishedLevels } from '@/api/levelApi';
import { getConfig } from '@/api/configApi';
import { getProfile } from '@/api/authApi';
import { submitAnswer as apiSubmitAnswer } from '@/api/questionApi';
import { useNetworkStore } from '@/store/networkStore';

/**
 * Custom hook for cache operations
 * Handles data loading with offline fallback
 * @returns Cache management methods
 */
export const useCache = () => {
  const { setLevels, setLoadingLevels, setHasLoadedInitialData } = useGameStore();
  const { setConfig, setLoading: setConfigLoading } = useConfigStore();
  const { setUser } = useAuthStore();
  const { isOnline } = useNetworkStore();

  /**
   * Load essential app data
   * Attempts online fetch with offline fallback
   * @returns Success status and error if any
   */
const loadEssentialData = useCallback(async () => {
    try {
      if (isOnline) {
        setLoadingLevels(true);
        setConfigLoading(true);

        const [levelsData, configData, userData] = await Promise.allSettled([
          getPublishedLevels(),
          getConfig(),
          getProfile(),
        ]);

        if (levelsData.status === 'fulfilled') {
          // Check for incomplete levels
          const incompleteLevels = levelsData.value.filter(
            level => level.isUnlocked && !level.isCompleted && level.completedQuestions > 0
          );
          
          if (incompleteLevels.length > 0) {
            const firstIncomplete = incompleteLevels[0];
            useGameStore.getState().setCurrentIncompleteLevel(firstIncomplete);
          } else {
            useGameStore.getState().setCurrentIncompleteLevel(null);
          }
          
          setLevels(levelsData.value);
        } else if (levelsData.status === 'rejected') {
          const cachedLevels = cacheService.getCachedLevels();
          if (cachedLevels) {
            // Check cached levels for incomplete progress
            const incompleteLevels = cachedLevels.filter(
              level => level.isUnlocked && !level.isCompleted && level.completedQuestions > 0
            );
            
            if (incompleteLevels.length > 0) {
              const firstIncomplete = incompleteLevels[0];
              useGameStore.getState().setCurrentIncompleteLevel(firstIncomplete);
            } else {
              useGameStore.getState().setCurrentIncompleteLevel(null);
            }
            
            setLevels(cachedLevels);
          }
        }

        if (configData.status === 'fulfilled') {
          setConfig(configData.value);
        } else if (configData.status === 'rejected') {
          const cachedConfig = cacheService.getCachedConfig();
          if (cachedConfig) {
            setConfig(cachedConfig);
          }
        }

        if (userData.status === 'fulfilled') {
          setUser(userData.value);
        }

        setLoadingLevels(false);
        setConfigLoading(false);
        setHasLoadedInitialData(true);
        cacheService.updateLastSync();

        return { success: true };
     } else {
        const cachedLevels = cacheService.getCachedLevels();
        const cachedConfig = cacheService.getCachedConfig();
        const cachedUser = cacheService.getCachedUser();

        if (cachedLevels) {
          // Check for incomplete levels in offline mode
          const incompleteLevels = cachedLevels.filter(
            level => level.isUnlocked && !level.isCompleted && level.completedQuestions > 0
          );
          
          if (incompleteLevels.length > 0) {
            const firstIncomplete = incompleteLevels[0];
            useGameStore.getState().setCurrentIncompleteLevel(firstIncomplete);
          } else {
            useGameStore.getState().setCurrentIncompleteLevel(null);
          }
          
          setLevels(cachedLevels);
        }
        if (cachedConfig) setConfig(cachedConfig);
        if (cachedUser) setUser(cachedUser);
        
        if (!cachedLevels || !cachedConfig) {
          return { 
            success: false, 
            error: 'No cached data available. Please connect to the internet.' 
          };
        }

        setHasLoadedInitialData(true);
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('Load essential data error:', error);
      return { 
        success: false, 
        error: 'Failed to load data. Please try again.' 
      };
    }
  }, [isOnline]);

  /**
   * Sync offline answers to backend
   * Called when connection restored
   */
  const syncOfflineData = useCallback(async () => {
    if (!isOnline) return;

    const { getOfflineAnswers, clearOfflineAnswers } = useGameStore.getState();
    const offlineAnswers = getOfflineAnswers();

    if (offlineAnswers.length === 0) return;

    console.log(`Syncing ${offlineAnswers.length} offline answers`);

    try {
      for (const answer of offlineAnswers) {
        await apiSubmitAnswer(answer);
      }

      clearOfflineAnswers();
      console.log('Offline sync completed successfully');
    } catch (error) {
      console.error('Offline sync error:', error);
    }
  }, [isOnline]);

  return {
    loadEssentialData,
    syncOfflineData,
  };
};