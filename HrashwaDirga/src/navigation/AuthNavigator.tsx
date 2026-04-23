/**
 * Auth Navigator
 * Navigation stack for unauthenticated users
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import SystemNavigationBar from 'react-native-system-navigation-bar';

const Stack = createNativeStackNavigator();

/**
 * Authentication navigation stack
 */
export const AuthNavigator: React.FC = () => {
    React.useEffect(() => {
      SystemNavigationBar.leanBack(); 
      SystemNavigationBar.setNavigationColor('#EFE8E2', 'dark', 'navigation');
      SystemNavigationBar.setNavigationBarDividerColor('#D6CFC8');
      SystemNavigationBar.setNavigationBarContrastEnforced(false);
    }, []);
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};