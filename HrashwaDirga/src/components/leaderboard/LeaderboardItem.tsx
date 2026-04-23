/**
 * leaderboard item component.
 * shows rank badge, flag + country code, username, score, and star.
 * top 3 get medal colors. podium entries get a subtle accent border.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { LeaderboardEntry } from '@/types/game.types';
import { formatNumber } from '@/utils/helpers';
import { getFlagEmoji } from '@/utils/countries';
import { getSmallAvatarUrl } from '@/utils/avatar';

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser?: boolean;
}

const MEDAL_COLORS = {
  1: { bg: '#C4A44A', text: '#FFFFFF', border: '#B8956A' },
  2: { bg: '#9B9B9B', text: '#FFFFFF', border: '#888' },
  3: { bg: '#A0785A', text: '#FFFFFF', border: '#8B6449' },
};

export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  entry,
  index,
  isCurrentUser = false,
}) => {
  const medal = MEDAL_COLORS[entry.rank as keyof typeof MEDAL_COLORS];
  const isTopThree = entry.rank <= 3;
  const flag = entry.country ? getFlagEmoji(entry.country) : '';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).duration(320)}
      style={[
        styles.container,
        isCurrentUser && styles.currentUser,
        isTopThree && !isCurrentUser && styles.topThree,
      ]}
    >
      {/** rank badge */}
      <View
        style={[
          styles.rankBadge,
          medal ? { backgroundColor: medal.bg } : styles.rankBadgeDefault,
        ]}
      >
        <Text
          style={[styles.rankText, { color: medal ? medal.text : COLORS.text }]}
        >
          {entry.rank}
        </Text>
      </View>

      {/** avatar */}
      <FastImage
        source={{
          uri: entry.displayName
            ? getSmallAvatarUrl(entry.displayName)
            : entry.photoURL || '',
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        }}
        style={styles.avatar}
        defaultSource={require('@/assets/images/avatar_placeholder.png')}
      />

      {/** name + country row */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.name, isCurrentUser && styles.currentUserText]}
          numberOfLines={1}
        >
          {entry.displayName}
          {isCurrentUser && ' (You)'}
        </Text>
        {/** flag + country code tag */}
        {flag || entry.country ? (
          <View style={styles.countryTag}>
            {flag ? <Text style={styles.flagText}>{flag}</Text> : null}
            {entry.country ? (
              <Text
                style={[
                  styles.countryCode,
                  isCurrentUser && styles.countryCodeCurrentUser,
                ]}
              >
                {entry.country.toUpperCase()}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/** score */}
      <Text style={[styles.score, isCurrentUser && styles.currentUserText]}>
        {formatNumber(entry.totalScore)}
      </Text>

      {/** star */}
      <MaterialCommunityIcons
        name={isCurrentUser ? 'star' : 'star-outline'}
        size={18}
        color={
          isCurrentUser
            ? COLORS.white
            : isTopThree
            ? COLORS.primary
            : COLORS.textTertiary
        }
        style={styles.star}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topThree: {
    borderColor: 'rgba(184,149,106,0.4)',
    backgroundColor: 'rgba(247,244,240,1)',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  currentUser: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    borderWidth: 2,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  rankBadgeDefault: {
    backgroundColor: '#E8DDD0',
  },
  rankText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    backgroundColor: '#C0B0A0',
    flexShrink: 0,
  },
  avatarInitial: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  currentUserText: {
    color: COLORS.white,
  },
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  flagText: {
    fontSize: 13,
    lineHeight: 16,
  },
  countryCode: {
    fontSize: 10,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textTertiary,
    letterSpacing: 0.6,
  },
  countryCodeCurrentUser: {
    color: 'rgba(255,255,255,0.8)',
  },
  score: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginRight: SPACING.xs,
    flexShrink: 0,
  },
  star: {
    marginLeft: 2,
    flexShrink: 0,
  },
});
