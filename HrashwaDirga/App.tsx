/**
 * Root App Component
 * Main entry point for the Hrashwa-Dirga application
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useConfigStore } from '@/store/configStore';
import { getConfig } from '@/api/configApi';
import { cacheService } from '@/services/cacheService';
import { adMobService } from '@/services/adMobService';

/**
 * Root application component
 * Wraps app with necessary providers
 */
const App: React.FC = () => {
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getConfig();
        useConfigStore.getState().setConfig(config);
        await adMobService.initialize();
      } catch (error) {
        // Load from cache
        const cachedConfig = cacheService.getCachedConfig();
        if (cachedConfig) {
          useConfigStore.getState().setConfig(cachedConfig);
        }
      }
    };

    loadConfig();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
