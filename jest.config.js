module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/jest-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|moti)',
  ],
  moduleNameMapper: {
    '^effect$': '<rootDir>/src/framework/supervision/effect-compat',
    '^expo-haptics$': '<rootDir>/src/framework/ui/haptics/expo-haptics-compat',
    '^react$': '<rootDir>/node_modules/react',
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^react-test-renderer$': '<rootDir>/node_modules/react-test-renderer',
    '^@powersync/react-native$': '<rootDir>/src/framework/sync/powersync/powersync-compat',
    '^expo-background-fetch$': '<rootDir>/src/framework/sync/powersync/background-fetch-compat',
    '^expo-task-manager$': '<rootDir>/src/framework/sync/powersync/task-manager-compat',
    '^expo-battery$': '<rootDir>/src/framework/sync/powersync/battery-compat',
    '^expo-network$': '<rootDir>/src/framework/sync/powersync/network-compat',
    '^@pcp/(.*)$': '<rootDir>/src/framework/$1',
    '^@/src/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
};
