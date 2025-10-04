// Metro bundler configuration for React Native
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('svg');

// Fix asset registry path issue
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle missing asset registry path
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add custom resolver for missing-asset-registry-path
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'missing-asset-registry-path') {
    return {
      type: 'empty',
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
