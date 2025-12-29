/**
 * User Rank Card Component
 * Displays current user's rank in leaderboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { User } from '@/types/auth.types';
import { formatNumber, getOrdinal } from '@/utils/helpers';

interface UserRankCardProps {
  user: User;
}

/**
 * Current user's rank card with highlight
 */
export const UserRankCard: React.FC<UserRankCardProps> = ({ user }) => {
  if (!user.rank) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Rank</Text>
      <View style={styles.card}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankNumber}>{getOrdinal(user.rank)}</Text>
        </View>

        <FastImage
          source={{
            uri: user.photoURL || 'https://via.placeholder.com/60',
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.avatar}
        />

        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {user.displayName}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>{formatNumber(user.totalScore)}</Text>
            <Text style={styles.scoreLabel}>points</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 3,
    borderColor: COLORS.primaryDark,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rankBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.primaryDark,
  },
  rankNumber: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginRight: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: FONTS.weights.medium,
    opacity: 0.9,
  },
});