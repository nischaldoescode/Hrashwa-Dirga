/**
 * leaderboard screen.
 * podium for top 3, animated list, global/country filter toggle.
 * flag + country code shown on each entry.
 * scroll-aware header with sage green fill border.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { getLeaderboard } from '@/api/leaderboardApi';
import { cacheService } from '@/services/cacheService';
import { LeaderboardItem } from '@/components/leaderboard/LeaderboardItem';
import { UserRankCard } from '@/components/leaderboard/UserRankCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { ScrollAwareHeader } from '@/components/common/ScrollAwareHeader';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { LeaderboardEntry } from '@/types/game.types';
import { Button } from '@/components/common/Button';
import { GradientBackground } from '@/components/common/GradientBackground';
import { getFlagEmoji } from '@/utils/countries';
import { getAvatarUrl } from '@/utils/avatar';
import FastImage from '@d11/react-native-fast-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * animated flash list — wraps FlashList for reanimated scroll handler
 */
type AnyFlashList = React.ComponentType<any>;
const AnimatedFlashList = Animated.createAnimatedComponent(
  FlashList as unknown as AnyFlashList,
);

/** medal colors for podium */
const PODIUM = {
  1: { bg: '#C4A44A', light: 'rgba(196,164,74,0.12)', height: 90 },
  2: { bg: '#9B9B9B', light: 'rgba(155,155,155,0.10)', height: 72 },
  3: { bg: '#A0785A', light: 'rgba(160,120,90,0.10)', height: 60 },
};

interface PodiumCardProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  isCurrentUser: boolean;
}

/**
 * podium card for top 3 entries
 */
const PodiumCard: React.FC<PodiumCardProps> = ({
  entry,
  position,
  isCurrentUser,
}) => {
  const p = PODIUM[position];
  const flag = entry.country ? getFlagEmoji(entry.country) : '';
  const initial = (entry.displayName ?? '?').charAt(0).toUpperCase();

  return (
    <Animated.View
      entering={FadeInDown.delay(position * 80).duration(380)}
      style={[
        styles.podiumCard,
        { marginTop: position === 1 ? 0 : position === 2 ? 20 : 32 },
      ]}
    >
      {/** avatar */}
      <View style={[styles.podiumAvatarRing, { borderColor: p.bg }]}>
        <FastImage
          source={{
            uri: entry.displayName
              ? getAvatarUrl(entry.displayName, 52)
              : entry.photoURL || '',
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.podiumAvatar}
        />
        {/** medal badge */}
        <View style={[styles.podiumMedal, { backgroundColor: p.bg }]}>
          <Text style={styles.podiumMedalText}>{position}</Text>
        </View>
      </View>

      {/** name */}
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.displayName}
        {isCurrentUser ? '\n(You)' : ''}
      </Text>

      {/** flag */}
      {flag ? <Text style={styles.podiumFlag}>{flag}</Text> : null}

      {/** podium block */}
      <View
        style={[
          styles.podiumBlock,
          { height: p.height, backgroundColor: p.bg },
        ]}
      >
        <Text style={styles.podiumScore}>{entry.totalScore}</Text>
        <Text style={styles.podiumPts}>pts</Text>
      </View>
    </Animated.View>
  );
};

export const LeaderboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { isOnline, showOfflineBanner } = useNetworkStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'global' | 'country'>('global');
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      if (isOnline) {
        const country =
          filter === 'country' && user?.country ? user.country : undefined;
        const data = await getLeaderboard(100, country);
        setLeaderboard(data);
        if (filter === 'global') cacheService.cacheLeaderboard(data);
      } else {
        const cached = cacheService.getCachedLeaderboard();
        if (cached) setLeaderboard(cached);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      const cached = cacheService.getCachedLeaderboard();
      if (cached) setLeaderboard(cached);
    } finally {
      setLoading(false);
    }
  }, [isOnline, filter, user?.country]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleRefresh = async () => {
    if (!isOnline) return;
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (loading && leaderboard.length === 0) {
    return (
      <GradientBackground variant="default">
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        {!isOnline ? (
          <View style={styles.offlineContainer}>
            <Text style={styles.offlineIcon}>📡</Text>
            <Text style={styles.offlineTitle}>No Internet Connection</Text>
            <Text style={styles.offlineMessage}>
              Connect to the internet to view the leaderboard
            </Text>
            <Button
              title="Retry"
              onPress={loadLeaderboard}
              variant="primary"
              size="medium"
              style={styles.retryButton}
            />
          </View>
        ) : (
          <LoadingSpinner message="Loading leaderboard..." />
        )}
      </GradientBackground>
    );
  }

  const userFlag = user?.country ? getFlagEmoji(user.country) : '';

  return (
    <GradientBackground variant="default">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollAwareHeader
        title="LEADERBOARD"
        scrollY={scrollY}
        borderColor="#C8D8C0"
        fillColor="#6B8B50"
        bgColor="rgba(247,244,240,0.93)"
        textColor={COLORS.text}
      />

      <OfflineBanner visible={showOfflineBanner} />

      <AnimatedFlashList
        data={rest}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        estimatedItemSize={72}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: 120,
          paddingTop: insets.top + 96,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isOnline ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
              progressViewOffset={insets.top + 96}
            />
          ) : undefined
        }
        ListHeaderComponent={
          <>
            {/** user rank card */}
            {user && <UserRankCard user={user} />}

            {/** global / country filter toggle */}
            <Animated.View
              entering={FadeIn.delay(100).duration(300)}
              style={styles.filterRow}
            >
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'global' && styles.filterTabActive,
                ]}
                onPress={() => setFilter('global')}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === 'global' && styles.filterTabTextActive,
                  ]}
                >
                  Global
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filter === 'country' && styles.filterTabActive,
                ]}
                onPress={() => setFilter('country')}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === 'country' && styles.filterTabTextActive,
                  ]}
                >
                  {userFlag ? `${userFlag} ` : ''}
                  {user?.country ?? 'Country'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/** podium — top 3 */}
            {top3.length === 3 && (
              <Animated.View
                entering={FadeInDown.delay(60).duration(400)}
                style={styles.podiumRow}
              >
                {/** 2nd — left */}
                <PodiumCard
                  entry={top3[1]}
                  position={2}
                  isCurrentUser={top3[1].email === user?.email}
                />
                {/** 1st — center */}
                <PodiumCard
                  entry={top3[0]}
                  position={1}
                  isCurrentUser={top3[0].email === user?.email}
                />
                {/** 3rd — right */}
                <PodiumCard
                  entry={top3[2]}
                  position={3}
                  isCurrentUser={top3[2].email === user?.email}
                />
              </Animated.View>
            )}

            {/** section label */}
            {rest.length > 0 && (
              <Text style={styles.sectionLabel}>Rankings</Text>
            )}
          </>
        }
        renderItem={({
          item,
          index,
        }: {
          item: LeaderboardEntry;
          index: number;
        }) => (
          <LeaderboardItem
            entry={item}
            index={index}
            isCurrentUser={item.email === user?.email}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No leaderboard data available</Text>
          </View>
        }
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  /** filter toggle */
  filterRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: SPACING.lg,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },

  /** podium */
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    maxWidth: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3,
  },
  podiumAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    borderWidth: 2.5,
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  podiumAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.full,
  },
  podiumInitial: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  podiumMedal: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  podiumMedalText: {
    fontSize: 10,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  podiumName: {
    fontSize: 11,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 14,
  },
  podiumFlag: {
    fontSize: 14,
    marginBottom: 4,
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
  },
  podiumScore: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  podiumPts: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONTS.weights.medium,
  },

  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  /** offline / empty */
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  offlineIcon: { fontSize: 56, marginBottom: SPACING.lg },
  offlineTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  offlineMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: { minWidth: 180 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
  },
});
