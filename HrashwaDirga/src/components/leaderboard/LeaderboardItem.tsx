/**
 * Leaderboard Item Component
 * Displays individual leaderboard entry
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { LeaderboardEntry } from '@/types/game.types';
import { formatNumber, getOrdinal } from '@/utils/helpers';

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser?: boolean;
}

/**
 * Leaderboard entry with rank, avatar, name, and score
 */
export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  entry,
  index,
  isCurrentUser = false,
}) => {
  const getRankColor = () => {
    switch (entry.rank) {
      case 1:
        return COLORS.warning;
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return COLORS.textSecondary;
    }
  };

  const getMedal = () => {
    switch (entry.rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      style={[styles.container, isCurrentUser && styles.currentUser]}
    >
      <View style={styles.rankContainer}>
        {getMedal() ? (
          <Text style={styles.medal}>{getMedal()}</Text>
        ) : (
          <Text style={[styles.rank, { color: getRankColor() }]}>
            {getOrdinal(entry.rank)}
          </Text>
        )}
      </View>

      <FastImage
        source={{
          uri: entry.photoURL || 'https://via.placeholder.com/40',
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={styles.avatar}
      />

      <View style={styles.infoContainer}>
        <Text
          style={[styles.name, isCurrentUser && styles.currentUserText]}
          numberOfLines={1}
        >
          {entry.displayName}
          {isCurrentUser && ' (You)'}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {entry.email}
        </Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.score, isCurrentUser && styles.currentUserText]}>
          {formatNumber(entry.totalScore)}
        </Text>
        <Text style={styles.scoreLabel}>points</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 2, // Thicker border
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUser: {
    backgroundColor: COLORS.primary, // Changed from primaryDark
    borderColor: COLORS.primaryDark,
    borderWidth: 3,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  medal: {
    fontSize: FONTS.sizes.xl,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
  },
  infoContainer: {
    flex: 1,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  name: {
    fontSize: FONTS.sizes.lg, // Larger font
    fontWeight: FONTS.weights.bold, // Bolder
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: FONTS.sizes.md, // Larger font
    color: COLORS.text, // Changed from textSecondary
    fontWeight: FONTS.weights.medium, // Added weight
    opacity: 0.8, // Add opacity instead
  },
  score: {
    fontSize: FONTS.sizes.xl, // Larger font
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: FONTS.sizes.sm, // Larger font
    color: COLORS.text, // Changed from textSecondary
    fontWeight: FONTS.weights.medium, // Added weight
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  currentUserText: {
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
