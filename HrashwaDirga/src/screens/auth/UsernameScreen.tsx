/**
 * username setup screen.
 * shown after first login when user has no username.
 * country is auto-detected from device locale synchronously,
 * then refined via ip geolocation in background.
 * scrollable — all content accessible on small screens.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/common/GradientBackground';
import { Button } from '@/components/common/Button';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import axiosInstance from '@/api/axiosConfig';
import { useAuthStore } from '@/store/authStore';
import {
  getDeviceCountrySync,
  getDeviceCountryAsync,
  getFlagEmoji,
  getCountryName,
} from '@/utils/countries';
import { getAvatarUrl } from '@/utils/avatar';

const SuggestionChip: React.FC<{
  name: string;
  index: number;
  onSelect: (name: string) => void;
  selected: boolean;
}> = ({ name, index, onSelect, selected }) => (
  <Animated.View entering={SlideInRight.delay(index * 90).duration(280)}>
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={() => onSelect(name)}
      activeOpacity={0.72}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        @{name}
      </Text>
    </TouchableOpacity>
  </Animated.View>
);

const LetterReveal: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.letterRevealRow}>
    <Text style={styles.letterRevealAt}>@</Text>
    {text.split('').map((char, i) => (
      <Animated.Text
        key={i}
        entering={FadeInDown.delay(i * 60).duration(200)}
        style={styles.letterRevealChar}
      >
        {char}
      </Animated.Text>
    ))}
  </View>
);

export const UsernameScreen: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  /**
   * getDeviceCountrySync is synchronous — safe for useState initializer.
   * no TypeScript error, no async warning.
   */
  const [detectedCountry, setDetectedCountry] = useState<string>(() =>
    getDeviceCountrySync(),
  );

  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputScale = useSharedValue(1);
  const inputAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  useEffect(() => {
    loadSuggestions();
    /**
     * refine country detection with ip geolocation in background.
     * updates silently if a more accurate result is found.
     */
    getDeviceCountryAsync().then(country => {
      setDetectedCountry(country);
    });
  }, []);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await axiosInstance.get('/auth/suggest-usernames');
      setSuggestions(res.data.suggestions?.slice(0, 5) || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    const clean = text.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 10);
    setUsername(clean);
    setAvailability('idle');
    setConfirmed(false);

    if (checkTimeout.current) clearTimeout(checkTimeout.current);

    if (clean.length >= 3) {
      setAvailability('checking');
      checkTimeout.current = setTimeout(async () => {
        try {
          const res = await axiosInstance.get(`/auth/check-username/${clean}`);
          const isAvailable = res.data.available;
          setAvailability(isAvailable ? 'available' : 'taken');
          inputScale.value = withSequence(
            withSpring(1.03, { damping: 10 }),
            withSpring(1),
          );
        } catch {
          setAvailability('idle');
        }
      }, 500);
    }
  };

  const handleSelectSuggestion = (name: string) => {
    setUsername(name);
    setAvailability('available');
    setConfirmed(false);
    inputScale.value = withSequence(
      withSpring(1.04, { damping: 8 }),
      withSpring(1),
    );
  };

  const handleConfirm = () => {
    if (availability !== 'available' || username.length < 3) return;
    setConfirmed(true);
  };

  const handleSubmit = async () => {
    if (submitting || !user) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/auth/set-username', {
        username: username.toLowerCase().trim(),
        country: detectedCountry,
      });
      if (res.data.success) {
        /**
         * spread full user object and override username + country.
         * AppNavigator watches user.username — setting it here
         * immediately unmounts UsernameScreen and shows MainNavigator.
         * backend now also returns username in getProfile so subsequent
         * profile refreshes won't clear the username again.
         */
        setUser({
          ...user,
          username: username.toLowerCase().trim(),
          country: detectedCountry,
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (msg.includes('taken') || err?.response?.status === 409) {
        setAvailability('taken');
      }
      setConfirmed(false);
    } finally {
      setSubmitting(false);
    }
  };

  const availabilityColor =
    availability === 'available'
      ? '#6B8B50'
      : availability === 'taken'
      ? COLORS.error
      : COLORS.textTertiary;

  const availabilityText =
    availability === 'available'
      ? 'Available'
      : availability === 'taken'
      ? 'Already taken'
      : availability === 'checking'
      ? 'Checking...'
      : '';

  const flag = getFlagEmoji(detectedCountry);
  const countryName = getCountryName(detectedCountry);

  return (
    <GradientBackground variant="default">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/**
           * ScrollView wraps all content so nothing is cut off
           * on small screens or when keyboard is open.
           */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <Text style={styles.heading}>Pick your username</Text>
              <Text style={styles.subheading}>
                This is what others see on the leaderboard. Your real name and
                email stay private.
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(160).duration(400)}
              style={styles.countryBadge}
            >
              <Text style={styles.countryBadgeText}>
                {flag} Playing from {countryName}
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(240).duration(400)}>
              <Animated.View style={inputAnimStyle}>
                <View
                  style={[
                    styles.inputWrapper,
                    availability === 'available' && styles.inputWrapperValid,
                    availability === 'taken' && styles.inputWrapperInvalid,
                  ]}
                >
                  <Text style={styles.atSign}>@</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="your-name"
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    maxLength={10}
                    returnKeyType="done"
                  />
                  {availability === 'checking' && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </View>

                {/** live avatar preview */}
                {username.length >= 2 && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    style={styles.avatarPreviewRow}
                  >
                    <FastImage
                      source={{
                        uri: getAvatarUrl(username, 64),
                        priority: FastImage.priority.high,
                        cache: FastImage.cacheControl.web,
                      }}
                      style={styles.avatarPreview}
                    />
                    <View style={styles.avatarPreviewInfo}>
                      <Text style={styles.avatarPreviewLabel}>Your avatar</Text>
                      <Text style={styles.avatarPreviewSub}>
                        Unique to your username — automatically generated
                      </Text>
                    </View>
                  </Animated.View>
                )}

                {availabilityText ? (
                  <Text
                    style={[
                      styles.availabilityText,
                      { color: availabilityColor },
                    ]}
                  >
                    {availability === 'available' ? '✓  ' : '✗  '}
                    {availabilityText}
                  </Text>
                ) : (
                  <Text style={styles.hintText}>
                    Up to 10 characters — letters, numbers, and hyphens only
                  </Text>
                )}
              </Animated.View>
            </Animated.View>

            {confirmed && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.revealContainer}
              >
                <LetterReveal text={username} />
                <Text style={styles.revealLabel}>
                  Your username is confirmed
                </Text>
              </Animated.View>
            )}

            {!confirmed && (
              <Animated.View entering={FadeInDown.delay(320).duration(400)}>
                <Text style={styles.suggestLabel}>
                  {loadingSuggestions
                    ? 'Finding available names...'
                    : 'Available for you'}
                </Text>
                <View style={styles.chipRow}>
                  {loadingSuggestions ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    suggestions.map((s, i) => (
                      <SuggestionChip
                        key={s}
                        name={s}
                        index={i}
                        selected={username === s}
                        onSelect={handleSelectSuggestion}
                      />
                    ))
                  )}
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              {!confirmed ? (
                <Button
                  title="Confirm Username"
                  onPress={handleConfirm}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={availability !== 'available' || username.length < 3}
                  style={styles.actionButton}
                />
              ) : (
                <Button
                  title={submitting ? 'Setting up...' : 'Start Playing'}
                  onPress={handleSubmit}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={submitting}
                  disabled={submitting}
                  style={styles.actionButton}
                />
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: 80,
  },
  heading: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subheading: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  countryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(184,149,106,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(184,149,106,0.28)',
    marginBottom: SPACING.xl,
  },
  countryBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 56,
    gap: 4,
  },
  inputWrapperValid: { borderColor: '#6B8B50' },
  inputWrapperInvalid: { borderColor: COLORS.error },
  atSign: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.xl,
    color: COLORS.text,
    fontWeight: FONTS.weights.semiBold,
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184,149,106,0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(184,149,106,0.2)',
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.md,
  },
  avatarPreview: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: '#E8DDD0',
    flexShrink: 0,
  },
  avatarPreviewInfo: {
    flex: 1,
  },
  avatarPreviewLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: 3,
  },
  avatarPreviewSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  availabilityText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    marginTop: SPACING.xs,
    marginLeft: 2,
    marginBottom: SPACING.md,
  },
  hintText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    marginLeft: 2,
    marginBottom: SPACING.md,
  },
  revealContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(107,139,80,0.08)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(107,139,80,0.22)',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  letterRevealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  letterRevealAt: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: '#6B8B50',
    marginRight: 2,
  },
  letterRevealChar: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  revealLabel: {
    fontSize: FONTS.sizes.sm,
    color: '#6B8B50',
    fontWeight: FONTS.weights.medium,
  },
  suggestLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: FONTS.weights.medium,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  chip: {
    backgroundColor: 'rgba(184,149,106,0.1)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(184,149,106,0.25)',
  },
  chipSelected: {
    backgroundColor: 'rgba(184,149,106,0.25)',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold,
  },
  chipTextSelected: {
    color: COLORS.primaryDark,
  },
  actionButton: { marginTop: SPACING.sm },
});
