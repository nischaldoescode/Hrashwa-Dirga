/**
 * gradient background component.
 * solid background color prevents logo bleed-through on android.
 * linear gradient sits on top for the warm cream effect.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'game';
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'default',
}) => {
  const colors =
    variant === 'game'
      ? ['#F7F4F0', '#FBF8F3', '#FDFCFB', '#F9F6F2']
      : ['#F7F4F0', '#FAF7F3', '#FCFAF7', '#F5F2EE'];

  return (
    /**
     * outer View with solid color prevents any transparent frame flash.
     * this is what stops the splash logo from bleeding through on android.
     */
    <View style={styles.root}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    /** solid cream — matches gradient start so no flash */
    backgroundColor: '#F7F4F0',
  },
  gradient: {
    flex: 1,
  },
});