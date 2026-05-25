/**
 * App Theme Configuration
 * Professional design system with color palette, typography, spacing, and more
 */

const theme = {
  // Color Palette
  colors: {
    // Primary Colors
    deepBlack: '#030812',
    darkNavy: '#0D2F56',
    mediumBlue: '#1E496D',
    lightGray: '#C0C4C3',
    darkGray: '#565B5F',
    accentBlue: '#0037FA',
    softBlue: '#6E8BA0',

    // Semantic Colors
    primary: '#0037FA',
    primaryDark: '#0D2F56',
    background: '#030812',
    surface: '#1E496D',
    text: '#C0C4C3',
    textSecondary: '#6E8BA0',
    textDark: '#565B5F',
    border: '#565B5F',

    // Status Colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  // Typography
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      semiBold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing System (based on 4px grid)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
  },

  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },

  // Layout
  layout: {
    containerPadding: 16,
    screenPadding: 20,
    cardPadding: 16,
  },
};

export default theme;
