// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add the PCP framework directory to watch folders
config.watchFolders = [
  path.resolve(__dirname, "../wasm4pm-compat"),
  path.resolve(__dirname, '../pcp')
];

config.resolver.assetExts.push('wasm');

// Ensure resolver looks in the correct places
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Exclude sub-node_modules to prevent duplicate/conflicting package resolution
config.resolver.blockList = [
  /.*\/pcp\/node_modules\/.*/,
  /.*\/wasm4pm-compat\/node_modules\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
