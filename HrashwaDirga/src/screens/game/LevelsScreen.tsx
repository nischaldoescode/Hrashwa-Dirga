/**
 * levels screen.
 * displays all game levels in a 2-column grid.
 * uses scroll-aware header with uppercase "LEVELS" title.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  FadeIn,
} from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '@/store/gameStore';
import { useNetworkStore } from '@/store/networkStore';
import { getPublishedLevels } from '@/api/levelApi';
import { cacheService } from '@/services/cacheService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { Modal } from '@/components/common/Modal';
import { ScrollAwareHeader } from '@/components/common/ScrollAwareHeader';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { Level } from '@/types/game.types';
import { GradientBackground } from '@/components/common/GradientBackground';
import { adMobService } from '@/services/adMobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** card takes half screen minus padding and gap */
const CARD_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;

type RootStackParamList = {
  Game: { levelId: string };
};

type LevelsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Game'
>;

/** pair levels into rows of 2 for grid rendering */
const pairLevels = (levels: Level[]): (Level | null)[][] => {
  const pairs: (Level | null)[][] = [];
  for (let i = 0; i < levels.length; i += 2) {
    pairs.push([levels[i], levels[i + 1] ?? null]);
  }
  return pairs;
};

export const LevelsScreen: React.FC = () => {
  const navigation = useNavigation<LevelsScreenNavigationProp>();
  const { levels, setLevels, setLoadingLevels, isLoadingLevels } =
    useGameStore();
  const { isOnline, showOfflineBanner } = useNetworkStore();
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const levelOpenCount = React.useRef(0);
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    loadLevels();
  }, [isOnline]);

  const loadLevels = async () => {
    if (isOnline) {
      try {
        setLoadingLevels(true);
        const data = await getPublishedLevels();
        setLevels(data);
      } catch (error) {
        console.error('Failed to load levels:', error);
        const cached = cacheService.getCachedLevels();
        if (cached) {
          setLevels(cached);
        } else {
          setShowNoDataModal(true);
        }
      } finally {
        setLoadingLevels(false);
      }
    } else {
      const cached = cacheService.getCachedLevels();
      if (cached && cached.length > 0) {
        setLevels(cached);
      } else {
        setShowNoDataModal(true);
      }
    }
  };

  const handleLevelPress = async (level: Level) => {
    if (!level.isUnlocked) return;

    /**
     * if level is already fully completed, navigate directly to Result
     * instead of going through GameScreen (which would show greyed options).
     * the ResultScreen handles already-completed levels gracefully.
     */
    if (level.isCompleted) {
      navigation.navigate('Game', { levelId: level.id });
      return;
    }

    levelOpenCount.current += 1;
    if (levelOpenCount.current % 2 === 0) {
      await adMobService.showInterstitialAd();
    }
    navigation.navigate('Game', { levelId: level.id });
  };

  const handleRetry = () => {
    setShowNoDataModal(false);
    if (isOnline) loadLevels();
  };

  if (isLoadingLevels && levels.length === 0) {
    return <LoadingSpinner message="Loading levels..." />;
  }

  const filteredLevels = levels.filter(l => l.totalQuestions > 0);
  const pairedLevels = pairLevels(filteredLevels);

  return (
    <GradientBackground variant="default">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <OfflineBanner visible={showOfflineBanner} />

      {/** uppercase scroll-aware header — same look as image */}
      <ScrollAwareHeader
        title="LEVELS"
        scrollY={scrollY}
        borderColor="#D4C0B8"
        fillColor="#A0634A"
        bgColor="rgba(247,244,240,0.93)"
        textColor={COLORS.text}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Select Level</Text>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleAccent} />
            <Text style={styles.screenSubtitle}>
              Choose a level to start playing
            </Text>
          </View>
          {/** completed count badge */}
          {filteredLevels.filter(l => l.isCompleted).length > 0 && (
            <View style={styles.completedBadgeRow}>
              <Text style={styles.completedBadgeText}>
                {filteredLevels.filter(l => l.isCompleted).length} of{' '}
                {filteredLevels.length} completed
              </Text>
            </View>
          )}
        </View>

        {filteredLevels.length > 0 ? (
          pairedLevels.map((pair, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {pair.map((level, colIndex) =>
                level ? (
                  <LevelCard
                    key={level.id}
                    level={level}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    onPress={() => handleLevelPress(level)}
                  />
                ) : (
                  /** empty placeholder to maintain grid alignment */
                  <View key="empty" style={styles.emptyCard} />
                ),
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptySubtext}>
              Levels will appear here once questions are added
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      <Modal
        visible={showNoDataModal}
        title="No Internet Connection"
        message="We could not connect to our server. Please connect to the internet."
        onConfirm={handleRetry}
        confirmText="Retry"
        type="error"
        showCloseButton={false}
      />
    </GradientBackground>
  );
};

interface LevelCardProps {
  level: Level;
  rowIndex: number;
  colIndex: number;
  onPress: () => void;
}

/**
 * individual level card — large square with number centered.
 * tan = completed/unlocked, sage green = locked/available.
 */
const LevelCard: React.FC<LevelCardProps> = ({
  level,
  rowIndex,
  colIndex,
  onPress,
}) => {
  const isCompleted = level.isCompleted;
  const isLocked = !level.isUnlocked;

  /**
   * color scheme matches image:
   * completed = tan/beige (#C4B49A)
   * available = sage green (#7B9E7B)
   * locked = muted tan
   */
  const cardBg = isCompleted ? '#C4B49A' : isLocked ? '#D6CBBB' : '#7B9E7B';

  return (
    <Animated.View
      entering={FadeIn.delay((rowIndex * 2 + colIndex) * 80).duration(350)}
    >
      <TouchableOpacity
        style={[styles.levelCard, { backgroundColor: cardBg }]}
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={0.75}
      >
        <Text
          style={[
            styles.levelNumber,
            {
              color: isCompleted ? '#6B5540' : isLocked ? '#9B8B7E' : '#4A6741',
            },
          ]}
        >
          {level.levelNumber ?? level.id}
        </Text>

        {/** completed checkmark badge */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedCheck}>✓</Text>
          </View>
        )}

        {/** locked overlay icon */}
        {isLocked && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedIcon}>🔒</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  titleBlock: {
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  screenTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  screenSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weights.medium,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  levelCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    /** soft shadow matching image */
    shadowColor: '#8B6F47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  levelNumber: {
    fontSize: 72,
    fontWeight: FONTS.weights.bold,
    lineHeight: 80,
  },
  completedBadge: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: '#F7F4F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B6F47',
  },
  completedCheck: {
    fontSize: 16,
    color: '#6B8B50',
    fontWeight: FONTS.weights.bold,
  },
  lockedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  lockedIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },

  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  subtitleAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#A0634A',
  },
  completedBadgeRow: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(107,139,80,0.12)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(107,139,80,0.25)',
  },
  completedBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semiBold,
    color: '#6B8B50',
  },
});
