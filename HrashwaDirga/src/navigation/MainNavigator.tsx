/**
 * main navigator.
 * bottom floating tab bar with 3d perspective slide between tabs.
 * active pill wraps icon only, indicator sits below label cleanly.
 * home tab always resets to HomeScreen when tapped.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
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
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import SystemNavigationBar from 'react-native-system-navigation-bar';

const Stack = createNativeStackNavigator();
const TopTab = createMaterialTopTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeStack = () => (
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

const TABS = [
  { name: 'HomeTab', label: 'Home', icon: 'home' },
  { name: 'Leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { name: 'Profile', label: 'Profile', icon: 'account' },
];

const CustomTabBar = React.memo(({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tabName: string) => {
    if (tabName === 'HomeTab') {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'HomeTab',
            state: { index: 0, routes: [{ name: 'Home' }] },
          },
        ],
      });
      return;
    }
    navigation.navigate(tabName);
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        { bottom: Math.max(insets.bottom, 10) + 4 },
      ]}
    >
      <BlurView
        blurType="light"
        blurAmount={20}
        style={StyleSheet.absoluteFillObject}
      />
      {TABS.map((tab, index) => {
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.name)}
            activeOpacity={0.75}
          >
            <View style={styles.iconArea}>
              {isActive && (
                <Animated.View
                  entering={FadeIn.duration(180)}
                  exiting={FadeOut.duration(140)}
                  style={styles.activePill}
                />
              )}
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={isActive ? COLORS.primary : '#6B5D52'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? COLORS.primary : '#6B5D52' },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <Animated.View
                entering={FadeIn.duration(150)}
                exiting={FadeOut.duration(120)}
                style={styles.activeIndicator}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

/**
 * wraps each screen in a 3d perspective container.
 * reads the tab position animated value from the navigation state
 * and applies translateX + rotateY for a card-flip slide feel.
 */
const Screen3DWrapper: React.FC<{
  children: React.ReactNode;
  index: number;
  position: SharedValue<number>;
}> = ({ children, index, position }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1];

    const translateX = interpolate(
      position.value,
      inputRange,
      [-SCREEN_WIDTH * 0.15, 0, SCREEN_WIDTH * 0.15],
      Extrapolation.CLAMP,
    );

    const rotateYDeg = interpolate(
      position.value,
      inputRange,
      [8, 0, -8],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      position.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      position.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { perspective: 1000 },
        { translateX },
        { rotateY: `${rotateYDeg}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[{ flex: 1, backgroundColor: '#F7F4F0' }, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
};

export const MainNavigator: React.FC = () => {
  const navigation = useNavigation();
  const [swipeEnabled, setSwipeEnabled] = React.useState(true);
  /**
   * position tracks the fractional tab index during swipe gesture.
   * 0 = HomeTab, 1 = Leaderboard, 2 = Profile.
   * passed to Screen3DWrapper for the 3d transform.
   */
  const position = useSharedValue(0);

  React.useEffect(() => {
    SystemNavigationBar.setNavigationColor('#EFE8E2', 'dark', 'navigation');
    SystemNavigationBar.setNavigationBarDividerColor('#D6CFC8');
    SystemNavigationBar.setNavigationBarContrastEnforced(false);
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e: any) => {
      try {
        const navState = e.data.state;
        if (!navState?.routes || typeof navState.index !== 'number') return;
        /** update position for 3d effect on discrete tab press */
        const { withTiming } = require('react-native-reanimated');
        position.value = withTiming(navState.index, { duration: 320 });

        const currentRoute = navState.routes[navState.index];
        if (!currentRoute) return;

        if (currentRoute.name === 'HomeTab' && currentRoute.state) {
          const homeState = currentRoute.state;
          if (
            typeof homeState.index === 'number' &&
            homeState.routes?.[homeState.index]
          ) {
            const screen = homeState.routes[homeState.index].name;
            setSwipeEnabled(screen !== 'Game' && screen !== 'Result');
          } else {
            setSwipeEnabled(true);
          }
        } else {
          setSwipeEnabled(true);
        }
      } catch {
        setSwipeEnabled(true);
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <TopTab.Navigator
      screenOptions={{
        swipeEnabled,
        animationEnabled: true,
        lazy: true,
        lazyPreloadDistance: 0,
        sceneStyle: { backgroundColor: '#F7F4F0', flex: 1 },
      }}
      initialRouteName="HomeTab"
      tabBarPosition="bottom"
      tabBar={props => <CustomTabBar {...props} />}
    >
      <TopTab.Screen name="HomeTab">
        {() => (
          <Screen3DWrapper index={0} position={position}>
            <HomeStack />
          </Screen3DWrapper>
        )}
      </TopTab.Screen>
      <TopTab.Screen name="Leaderboard">
        {() => (
          <Screen3DWrapper index={1} position={position}>
            <LeaderboardScreen />
          </Screen3DWrapper>
        )}
      </TopTab.Screen>
      <TopTab.Screen name="Profile">
        {() => (
          <Screen3DWrapper index={2} position={position}>
            <ProfileScreen />
          </Screen3DWrapper>
        )}
      </TopTab.Screen>
    </TopTab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 62,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E5DDD5',
    elevation: 14,
    shadowColor: '#3E362E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconArea: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(184, 149, 106, 0.15)',
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
  },
  activeIndicator: {
    marginTop: 3,
    width: 20,
    height: 2.5,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
