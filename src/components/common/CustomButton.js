import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

/**
 * CustomButton - Reusable button component
 * @param {string} title - Button text
 * @param {function} onPress - Press handler
 * @param {boolean} loading - Loading state
 * @param {boolean} disabled - Disabled state
 * @param {string} variant - Button variant: 'primary', 'secondary', 'outline'
 * @param {string} icon - Icon name (Ionicons)
 * @param {string} iconPosition - Icon position: 'left', 'right'
 * @param {object} style - Container style override
 * @param {object} textStyle - Text style override
 */
const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const { theme } = useTheme();

  const dynamicStyles = getStyles(theme);

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return dynamicStyles.secondaryButton;
      case 'outline':
        return dynamicStyles.outlineButton;
      case 'danger':
        return dynamicStyles.dangerButton;
      default:
        return dynamicStyles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return dynamicStyles.secondaryText;
      case 'outline':
        return dynamicStyles.outlineText;
      case 'danger':
        return dynamicStyles.dangerText;
      default:
        return dynamicStyles.primaryText;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      case 'danger':
        return theme.colors.white;
      default:
        return theme.colors.white;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        dynamicStyles.button,
        getButtonStyle(),
        isDisabled && dynamicStyles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' ? theme.colors.primary : theme.colors.white
          }
          size="small"
        />
      ) : (
        <View style={dynamicStyles.content}>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={20}
              color={getIconColor()}
              style={dynamicStyles.iconLeft}
            />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={20}
              color={getIconColor()}
              style={dynamicStyles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    button: {
      height: 52,
      borderRadius: theme.borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.surface,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    dangerButton: {
      backgroundColor: theme.colors.error || '#EF4444',
    },
    disabledButton: {
      opacity: 0.5,
    },
    primaryText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.bold,
    },
    secondaryText: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.bold,
    },
    outlineText: {
      color: theme.colors.primary,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.bold,
    },
    dangerText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.bold,
    },
    iconLeft: {
      marginRight: theme.spacing.sm,
    },
    iconRight: {
      marginLeft: theme.spacing.sm,
    },
  });

export default CustomButton;
