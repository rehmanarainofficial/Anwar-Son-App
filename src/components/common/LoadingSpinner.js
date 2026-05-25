import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@config/useTheme';

/**
 * LoadingSpinner - Reusable loading indicator
 * @param {string} size - Spinner size: 'small', 'large'
 * @param {string} color - Spinner color
 * @param {object} style - Container style override
 */
const LoadingSpinner = ({ size = 'large', color, style }) => {
  const { theme } = useTheme();
  const spinnerColor = color || theme.colors.primary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
