/**
 * Leaderboard Screen
 * Displays global rankings and user position
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { getLeaderboard } from '@/api/leaderboardApi';
import { cacheService } from '@/services/cacheService';
import { LeaderboardItem } from '@/components/leaderboard/LeaderboardItem';
import { UserRankCard } from '@/components/leaderboard/UserRankCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { COLORS, FONTS, SPACING } from '@/utils/constants';
import { LeaderboardEntry } from '@/types/game.types';
import { Button } from '@/components/common/Button';
import { GradientBackground } from '@/components/common/GradientBackground';

/**
 * Leaderboard screen with rankings
 */
export const LeaderboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { isOnline, showOfflineBanner } = useNetworkStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [isOnline]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      if (isOnline) {
        const data = await getLeaderboard(100);
        setLeaderboard(data);
        cacheService.cacheLeaderboard(data);
      } else {
        const cached = cacheService.getCachedLeaderboard();
        if (cached) {
          setLeaderboard(cached);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      const cached = cacheService.getCachedLeaderboard();
      if (cached) {
        setLeaderboard(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!isOnline) return;

    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  if (loading && leaderboard.length === 0) {
    return (
      <GradientBackground variant="default">
        <SafeAreaView style={styles.container}>
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
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="default">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <OfflineBanner visible={showOfflineBanner} />

        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top players ranked by score</Text>
        </View>

        {user && <UserRankCard user={user} />}

        <FlashList
          data={leaderboard}
          renderItem={({ item, index }) => (
            <LeaderboardItem
              entry={item}
              index={index}
              isCurrentUser={item.email === user?.email}
            />
          )}
          overrideItemLayout={(layout, item, index) => {
            (layout as any).size = 80; // vertical list item height
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No leaderboard data available
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
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

  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  offlineIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
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
  retryButton: {
    minWidth: 200,
  },
});
