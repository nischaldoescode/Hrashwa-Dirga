/**
 * Babel configuration for React Native
 * Includes Reanimated plugin for high-performance animations
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@services': './src/services',
          '@utils': './src/utils',
          '@api': './src/api',
          '@types': './src/types',
          '@hooks': './src/hooks',
          '@assets': './src/assets',
        },
      },
    ],
    'react-native-reanimated/plugin', // keep it last
  ],
};
