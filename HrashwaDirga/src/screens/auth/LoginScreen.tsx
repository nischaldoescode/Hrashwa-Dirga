/**
 * Login Screen
 * Google Sign-In authentication screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/common/GradientBackground';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { Image } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

/**
 * Login screen with Google Sign-In
 */
export const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);

    const result = await signInWithGoogle();

    // Don't show error if user cancelled
    if (!result.success && result.error && !result.cancelled) {
      setError(result.error);
    }

    setIsSigningIn(false);
  };

  return (
    <GradientBackground variant="default">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Animated.View
              entering={FadeIn.duration(600).delay(200)}
              style={styles.logoWrapper}
            >
              <Image
                source={require('@/assets/images/splash_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.Text
              entering={SlideInDown.duration(500).delay(400)}
              style={styles.appTitle}
            >
              Hrashwa Dirga
            </Animated.Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue playing and track your progress
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Sign in with Google"
              onPress={handleGoogleSignIn}
              variant="primary"
              size="large"
              fullWidth
              disabled={isSigningIn}
              loading={isSigningIn}
            />

            {isSigningIn && (
              <Text style={styles.loadingText}>Connecting to Google...</Text>
            )}
          </View>
        </View>

        <Modal
          visible={!!error}
          title="Sign In Failed"
          message={
            error || 'An error occurred during sign in. Please try again.'
          }
          onClose={() => setError(null)}
          onConfirm={() => setError(null)}
          confirmText="OK"
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
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoWrapper: {
    width: 160,
    height: 160,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    // Professional shadow
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  textContainer: {
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.sizes.md * 1.5,
    paddingHorizontal: SPACING.md,
  },
  buttonContainer: {
    marginTop: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontWeight: FONTS.weights.medium,
  },
});
