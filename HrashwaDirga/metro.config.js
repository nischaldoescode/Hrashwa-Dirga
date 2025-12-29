const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');


/**
 * Metro configuration for React Native
 * Optimized for fast bundling and asset handling
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname, 'src')],
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'ts', 'tsx'],
    assetExts: defaultConfig.resolver.assetExts.filter(ext => !['svg'].includes(ext)),
  },
  transformer: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);