/**
 * Levels Screen
 * Displays all game levels with progress
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '@/store/gameStore';
import { useNetworkStore } from '@/store/networkStore';
import { getPublishedLevels } from '@/api/levelApi';
import { cacheService } from '@/services/cacheService';
import { LevelCard } from '@/components/level/LevelCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { Modal } from '@/components/common/Modal';
import { COLORS, FONTS, SPACING } from '@/utils/constants';
import { Level } from '@/types/game.types';
import { GradientBackground } from '@/components/common/GradientBackground';
import { adMobService } from '@/services/adMobService';

// Add type definition at top of file
type RootStackParamList = {
  Game: { levelId: string };
};

type LevelsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Game'
>;

/**
 * Levels screen with level selection
 */
export const LevelsScreen: React.FC = () => {
  const navigation = useNavigation<LevelsScreenNavigationProp>();
  const { levels, setLevels, setLoadingLevels, isLoadingLevels } =
    useGameStore();
  const { isOnline, showOfflineBanner } = useNetworkStore();
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const levelOpenCount = React.useRef(0);

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

    // Increment counter
    levelOpenCount.current += 1;

    // Show interstitial ad every 2nd level opening
    if (levelOpenCount.current % 2 === 0) {
      const shown = await adMobService.showInterstitialAd();
      if (shown) {
        console.log('[LevelsScreen] Interstitial ad shown');
      }
    }

    navigation.navigate('Game', { levelId: level.id });
  };

  const handleRetry = () => {
    setShowNoDataModal(false);
    if (isOnline) {
      loadLevels();
    }
  };

  if (isLoadingLevels && levels.length === 0) {
    return <LoadingSpinner message="Loading levels..." />;
  }

  // AFTER
  return (
    <GradientBackground variant="default">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <OfflineBanner visible={showOfflineBanner} />

        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Select Level</Text>
            <Text style={styles.subtitle}>Choose a level to start playing</Text>
          </View>
        </View>

        {levels.filter(level => level.totalQuestions > 0).length > 0 ? (
          <FlashList
            data={levels.filter(level => level.totalQuestions > 0)}
            renderItem={({ item, index }) => (
              <LevelCard
                level={item}
                onPress={() => handleLevelPress(item)}
                index={index}
              />
            )}
            overrideItemLayout={(layout, item, index) => {
              (layout as any).size = 80; // vertical list item height
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptySubtext}>
              Levels will appear here once questions are added
            </Text>
          </View>
        )}

        <Modal
          visible={showNoDataModal}
          title="No Internet Connection"
          message="We could not establish a connection to our server. Please connect to the internet to load the game."
          onConfirm={handleRetry}
          confirmText="Retry"
          type="error"
          showCloseButton={false}
        />
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerContainer: {
    paddingTop: SPACING.lg,
  },
  backButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text, // Changed for better visibility
    fontWeight: FONTS.weights.medium,
    opacity: 0.8,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
