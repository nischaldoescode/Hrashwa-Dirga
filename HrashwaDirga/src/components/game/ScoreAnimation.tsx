/**
 * Score Animation Component
 * Displays score earned with animated counter
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING } from '@/utils/constants';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface ScoreAnimationProps {
  score: number;
  totalScore: number;
  visible: boolean;
  isCorrect: boolean;
}

/**
 * Animated score display with counting effect
 */
export const ScoreAnimation: React.FC<ScoreAnimationProps> = ({
  score,
  totalScore,
  visible,
  isCorrect,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scoreValue = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
      });
      opacity.value = withTiming(1, { duration: 300 });
      scoreValue.value = withDelay(
        200,
        withTiming(score, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        }),
      );
    } else {
      scale.value = 0;
      opacity.value = 0;
      scoreValue.value = 0;
    }
  }, [visible, score]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {isCorrect ? (
        <>
          <View style={styles.correctBadge}>
            <Text style={styles.correctBadgeText}>Correct</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.plusSign}>+</Text>
            <AnimatedText style={styles.score}>
              {Math.round(scoreValue.value)}
            </AnimatedText>
            <Text style={styles.scoreUnit}> pts</Text>
          </View>
          <Text style={styles.totalScore}>Running total: {totalScore}</Text>
        </>
      ) : (
        <>
          <View style={styles.wrongBadge}>
            <Text style={styles.wrongBadgeText}>Incorrect</Text>
          </View>
          <Text style={styles.wrongMessage}>No points this time</Text>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  /** correct state */
  correctBadge: {
    backgroundColor: 'rgba(45,122,79,0.1)',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(45,122,79,0.25)',
    marginBottom: SPACING.sm,
  },
  correctBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: '#2D7A4F',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  plusSign: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.success,
    lineHeight: 52,
  },
  score: {
    fontSize: FONTS.sizes.display,
    fontWeight: FONTS.weights.bold,
    color: COLORS.success,
  },
  scoreUnit: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.success,
    lineHeight: 48,
    opacity: 0.75,
  },
  totalScore: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  /** wrong state */
  wrongBadge: {
    backgroundColor: 'rgba(197,48,48,0.08)',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,48,48,0.2)',
    marginBottom: SPACING.sm,
  },
  wrongBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.error,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  wrongMessage: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
});
