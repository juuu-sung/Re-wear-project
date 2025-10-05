// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');

// Expo의 기본 설정을 가져옵니다. (이 부분이 JPG, PNG 등을 처리합니다)
const config = getDefaultConfig(__dirname);

// SVG를 처리하기 위한 설정을 기본 설정에 추가합니다.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;