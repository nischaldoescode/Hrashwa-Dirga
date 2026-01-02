import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type LinearBackgroundProps = {
  children: React.ReactNode;
};

export const LinearBackground = ({ children }: LinearBackgroundProps) => {
  return (
    <View style={styles.root}>
      {/* Background Image */}
      <Image
        source={require('@/assets/images/login_bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Soft Pinterest-style fade */}
      <LinearGradient
        colors={[
          'rgba(247, 244, 240, 0.0)',
          'rgba(247, 244, 240, 0.85)',
          'rgba(247, 244, 240, 1.0)',
        ]}
        locations={[0, 0.55, 1]}
        style={styles.gradientOverlay}
      />

      {/* Foreground content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F4F0',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
