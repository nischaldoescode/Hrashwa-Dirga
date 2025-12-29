/**
 * Main Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '@/screens/game/HomeScreen';
import { LevelsScreen } from '@/screens/game/LevelsScreen';
import { GameScreen } from '@/screens/game/GameScreen';
import { ResultScreen } from '@/screens/game/ResultScreen';
import { LeaderboardScreen } from '@/screens/leaderboard/LeaderboardScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { COLORS, FONTS } from '@/utils/constants';
import { useNavigation, useNavigationState } from '@react-navigation/native';

const Stack = createNativeStackNavigator();
const TopTab = createMaterialTopTabNavigator();

/**
 * Home stack navigator
 */
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Levels" component={LevelsScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
};

/**
 * Custom Tab Bar Component
 */
const CustomTabBar = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'HomeTab', label: 'Home', icon: 'home' },
    { name: 'Leaderboard', label: 'Leaderboard', icon: 'trophy' },
    { name: 'Profile', label: 'Profile', icon: 'account' },
  ];

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
        },
      ]}
    >
      <BlurView blurType="light" blurAmount={15} style={styles.blurView} />
      {tabs.map((tab, index) => {
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => navigation.navigate(tab.name)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isActive ? COLORS.primary : COLORS.textTertiary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? COLORS.primary : COLORS.textTertiary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/**
 * Main tab navigator with swipe gestures
 */
export const MainNavigator: React.FC = () => {
  const navigation = useNavigation();
  const [swipeEnabled, setSwipeEnabled] = React.useState(true);

  // Listen to navigation state to detect Game screen
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e: any) => {
      try {
        const state = e.data.state;
        if (!state || !state.routes || typeof state.index !== 'number') {
          return;
        }

        const currentRoute = state.routes[state.index];
        if (!currentRoute) {
          return;
        }

        // Check if we're on HomeTab stack
        if (currentRoute.name === 'HomeTab' && currentRoute.state) {
          const homeStackState = currentRoute.state;

          // Type guard: ensure index exists and is a number
          if (
            homeStackState &&
            typeof homeStackState.index === 'number' &&
            homeStackState.routes &&
            homeStackState.routes[homeStackState.index]
          ) {
            const currentScreen =
              homeStackState.routes[homeStackState.index].name;

            // Disable swipe on Game and Result screens
            setSwipeEnabled(
              currentScreen !== 'Game' && currentScreen !== 'Result',
            );
          } else {
            setSwipeEnabled(true);
          }
        } else {
          setSwipeEnabled(true);
        }
      } catch (error) {
        console.error('Navigation state listener error:', error);
        setSwipeEnabled(true);
      }
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <TopTab.Navigator
      screenOptions={{
        swipeEnabled: swipeEnabled,
        animationEnabled: true,
        lazy: true,
      }}
      initialRouteName="HomeTab"
      tabBarPosition="bottom"
      tabBar={props => <CustomTabBar {...props} />}
    >
      <TopTab.Screen name="HomeTab" component={HomeStack} />
      <TopTab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <TopTab.Screen name="Profile" component={ProfileScreen} />
    </TopTab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: 12,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    marginTop: 4,
  },
});
