/**
 * Question Card Component
 * Displays question with animated entrance
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

interface QuestionCardProps {
  questionText: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ questionText }) => {
  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(100)}
      style={styles.container}
    >
      <Animated.View entering={SlideInRight.duration(400).delay(200)}>
        <Text style={styles.questionText}>{questionText}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl, // Increased padding
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  questionText: {
    fontSize: FONTS.sizes.xxl, // Larger font
    fontWeight: FONTS.weights.bold, // Bolder weight
    color: COLORS.text,
    lineHeight: FONTS.sizes.xxl * 1.4,
    textAlign: 'center', // Center alignment
  },
});