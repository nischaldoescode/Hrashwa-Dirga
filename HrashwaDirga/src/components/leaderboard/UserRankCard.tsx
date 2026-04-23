/**
 * user rank card component.
 * shows current user rank, score, and completed levels in a highlighted card.
 * matches the design with ribbon badge in top-right corner.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { User } from '@/types/auth.types';
import { formatNumber, getOrdinal } from '@/utils/helpers';
import { getLargeAvatarUrl } from '@/utils/avatar';

interface UserRankCardProps {
  user: User;
}

export const UserRankCard: React.FC<UserRankCardProps> = ({ user }) => {
  if (!user.rank) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/** ribbon badge top-right */}
        <View style={styles.ribbonContainer}>
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>#{user.rank}</Text>
          </View>
          {/** ribbon tail triangle */}
          <View style={styles.ribbonTail} />
        </View>

        <Text style={styles.yourRankLabel}>Your Rank</Text>

        <View style={styles.row}>
          {/** avatar with initial fallback */}
          <View style={styles.avatarContainer}>
            <FastImage
              source={{
                uri: user.username
                  ? getLargeAvatarUrl(user.username)
                  : user.photoURL ||
                    getLargeAvatarUrl(user.displayName ?? 'user'),
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.infoContainer}>
            {/** rank badge inline */}
            <View style={styles.inlineBadge}>
              <Text style={styles.inlineBadgeText}>#{user.rank}</Text>
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {user.displayName}
            </Text>
          </View>
        </View>

        {/** score and levels row */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            Score:{' '}
            <Text style={styles.statValue}>
              {formatNumber(user.totalScore)} Pts
            </Text>
          </Text>
          <Text style={styles.statText}>
            Completed Levels:{' '}
            <Text style={styles.statValue}>{user.completedLevels ?? 0}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: '#E8DDD0',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#C8B89A',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  yourRankLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: '#4ABFBF',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  infoContainer: {
    flex: 1,
  },
  inlineBadge: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  inlineBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  name: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  statsRow: {
    gap: 4,
  },
  statText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  statValue: {
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  /** ribbon corner badge */
  ribbonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  ribbon: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomLeftRadius: RADIUS.md,
    minWidth: 52,
    alignItems: 'center',
  },
  ribbonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  ribbonTail: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 52,
    borderBottomWidth: 10,
    borderLeftColor: COLORS.primaryDark,
    borderBottomColor: 'transparent',
    alignSelf: 'flex-end',
  },
});
