/**
 * Auth Navigator
 * Navigation stack for unauthenticated users
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

/**
 * Authentication navigation stack
 */
export const AuthNavigator: React.FC = () => {
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