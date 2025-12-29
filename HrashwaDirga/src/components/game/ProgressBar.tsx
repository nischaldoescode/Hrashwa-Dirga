/**
 * Progress Bar Component
 * Shows completion progress for current level
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

/**
 * Animated progress bar with percentage display
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
}) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress}%`, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    }),
  }));

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.stats}>
            {current} / {total}
          </Text>
        </View>
      )}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, animatedStyle]} />
      </View>
      <Text style={styles.percentage}>
        {current === total && progress === 100
          ? 'Last Question'
          : `${Math.round(progress)}% Complete`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  stats: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.cardLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  percentage: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
