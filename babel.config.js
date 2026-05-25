module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@config': './src/config',
          '@api': './src/api',
          '@store': './src/store',
          '@routes': './src/routes',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be last
  ],
};
