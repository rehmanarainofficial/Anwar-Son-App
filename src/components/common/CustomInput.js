import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

/**
 * CustomInput - Reusable input component
 * @param {string} label - Input label
 * @param {string} value - Input value
 * @param {function} onChangeText - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {boolean} secureTextEntry - Password field
 * @param {string} error - Error message
 * @param {string} leftIcon - Left icon name (Ionicons)
 * @param {string} rightIcon - Right icon name (Ionicons)
 * @param {string} keyboardType - Keyboard type
 * @param {boolean} editable - Whether input is editable
 * @param {object} containerStyle - Container style override
 */
const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  leftIcon,
  rightIcon,
  keyboardType = 'default',
  editable = true,
  containerStyle,
  ...props
}) => {
  const { theme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const dynamicStyles = getStyles(theme);

  return (
    <View style={[dynamicStyles.container, containerStyle]}>
      {label && <Text style={dynamicStyles.label}>{label}</Text>}

      <View
        style={[
          dynamicStyles.inputContainer,
          isFocused && dynamicStyles.inputContainerFocused,
          error && dynamicStyles.inputContainerError,
          !editable && dynamicStyles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={
              isFocused ? theme.colors.primary : theme.colors.textSecondary
            }
            style={dynamicStyles.leftIcon}
          />
        )}

        <TextInput
          style={[
            dynamicStyles.input,
            leftIcon && dynamicStyles.inputWithLeftIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={dynamicStyles.eyeIcon}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <Icon
            name={rightIcon}
            size={20}
            color={theme.colors.textSecondary}
            style={dynamicStyles.rightIcon}
          />
        )}
      </View>

      {error && <Text style={dynamicStyles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      height: 52,
    },
    inputContainerFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    inputContainerError: {
      borderColor: theme.colors.error,
    },
    inputContainerDisabled: {
      backgroundColor: theme.colors.darkGray,
      opacity: 0.6,
    },
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    inputWithLeftIcon: {
      marginLeft: theme.spacing.sm,
    },
    leftIcon: {
      marginRight: theme.spacing.xs,
    },
    rightIcon: {
      marginLeft: theme.spacing.xs,
    },
    eyeIcon: {
      padding: theme.spacing.xs,
    },
    errorText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    },
  });

export default CustomInput;
