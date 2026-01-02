/**
 * Level Card Component
 * Displays level information with lock state in grid layout
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { Level } from '@/types/game.types';
import { calculatePercentage } from '@/utils/helpers';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.md * 2) / 3;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface LevelCardProps {
  level: Level;
  onPress: () => void;
  index: number;
}

export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  onPress,
  index,
}) => {
  const progress = calculatePercentage(
    level.completedQuestions,
    level.totalQuestions,
  );

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const waterLevel = useSharedValue(level.isCompleted ? 1 : 0); // ADD THIS

  const waterAnimatedStyle = useAnimatedStyle(() => ({
    height: `${waterLevel.value * 100}%`,
  }));

  React.useEffect(() => {
    if (level.isCompleted) {
      // Reset first, then animate
      waterLevel.value = 0;
      waterLevel.value = withTiming(1, {
        duration: 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      waterLevel.value = 0;
    }
  }, [level.isCompleted, level.id]); // Added level.id dependency

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotateZ: `${rotate.value}deg` }],
  }));
  const handlePressIn = () => {
    if (level.isUnlocked) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    } else {
      // Shake animation for locked levels
      rotate.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    if (level.isUnlocked) {
      ReactNativeHapticFeedback.trigger('impactMedium');
      onPress();
    } else {
      ReactNativeHapticFeedback.trigger('notificationWarning');
    }
  };

  return (
    <AnimatedTouchable
      entering={FadeIn.delay(index * 80).duration(400)}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!level.isUnlocked}
      activeOpacity={0.9}
      style={[
        styles.container,
        animatedStyle,
        !level.isUnlocked && styles.locked,
        level.isCompleted && styles.completed,
      ]}
    >
      {/* Water fill animation for completed levels */}
      {level.isCompleted && (
        <Animated.View style={[styles.waterFill, waterAnimatedStyle]} />
      )}

      <View style={styles.header}>
        <Text
          style={[styles.levelNumber, !level.isUnlocked && styles.lockedText]}
        >
          {level.levelNumber}
        </Text>
      </View>

      <View style={styles.iconContainer}>
        {!level.isUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
        {level.isCompleted && <Text style={styles.checkIcon}>✓</Text>}
        {level.isUnlocked && !level.isCompleted && (
          <Text style={styles.playIcon}>▶</Text>
        )}
      </View>

      <Text
        style={[styles.levelName, !level.isUnlocked && styles.lockedText]}
        numberOfLines={2}
      >
        {level.levelName}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text
          style={[styles.progressText, !level.isUnlocked && styles.lockedText]}
        >
          {level.completedQuestions}/{level.totalQuestions}
        </Text>
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    margin: SPACING.xs,
    borderWidth: 3, // Thicker border
    borderColor: COLORS.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  locked: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  completed: {
    borderColor: COLORS.success,
    borderWidth: 4, // Even thicker for completed
    backgroundColor: '#F0FDF4', // Subtle green tint
  },
  header: {
    width: '100%',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    textShadowColor: 'rgba(184, 149, 106, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  iconContainer: {
    width: 60, // Larger icon container
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  lockIcon: {
    fontSize: FONTS.sizes.xxl,
  },
  checkIcon: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.success,
  },
  playIcon: {
    fontSize: FONTS.sizes.xxl,
    color: COLORS.primary,
    marginLeft: 4,
  },
  levelName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: FONTS.sizes.md * 1.3,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6, // Thicker progress bar
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textSecondary,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  lockedText: {
    color: COLORS.textTertiary,
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(45, 122, 79, 0.15)', // More subtle
    borderRadius: RADIUS.xl,
    zIndex: 0,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
