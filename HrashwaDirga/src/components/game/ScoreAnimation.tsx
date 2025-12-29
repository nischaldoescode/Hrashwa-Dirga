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
          <Text style={styles.label}>Score Earned</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.plusSign}>+</Text>
            <AnimatedText style={styles.score}>
              {Math.round(scoreValue.value)}
            </AnimatedText>
          </View>
          <Text style={styles.totalScore}>Total Score: {totalScore}</Text>
        </>
      ) : (
        <>
          <Text style={styles.wrongEmoji}>😞</Text>
          <Text style={styles.wrongLabel}>Wrong Answer</Text>
          <Text style={styles.wrongMessage}>+0 points</Text>
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
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusSign: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.success,
    marginRight: SPACING.xs,
  },
  score: {
    fontSize: FONTS.sizes.display,
    fontWeight: FONTS.weights.bold,
    color: COLORS.success,
  },
  totalScore: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  wrongEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  wrongLabel: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  wrongMessage: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textSecondary,
  },
});
