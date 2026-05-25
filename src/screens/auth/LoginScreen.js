import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput, CustomButton } from '@components/common';
import { useLoginMutation } from '@api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@store/slices/authSlice';
import { useTheme } from '@config/useTheme';

const AnimatedTypingText = ({ text, style }) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      // Loop the animation
      const resetTimeout = setTimeout(() => {
        setDisplayText('');
        setIndex(0);
      }, 3000);
      return () => clearTimeout(resetTimeout);
    }
  }, [index, text]);

  return <Text style={style}>{displayText}|</Text>;
};

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    company: 'CRM',
  });

  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  const dynamicStyles = getStyles(theme);

  // Validate form
  const validateForm = () => {
    let isValid = true;

    if (!formData.username.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      isValid = false;
    }

    if (!formData.password.trim()) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      isValid = false;
    } else if (formData.password.length < 3) {
      setErrors(prev => ({
        ...prev,
        password: 'Password must be at least 3 characters',
      }));
      isValid = false;
    }

    return isValid;
  };

  // Handle login
  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await login({
        username: formData.username,
        password: formData.password,
        company: formData.company,
      }).unwrap();

      dispatch(
        setCredentials({
          user: result.user,
          company: result.user.company_user_code || formData.company,
        }),
      );
    } catch (error) {
      console.log('Login error:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={dynamicStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            centerContent={true}
            showsVerticalScrollIndicator={false}
          >
            <View style={dynamicStyles.innerContainer}>
              {/* Header Section */}
              <View style={dynamicStyles.header}>
                <View style={dynamicStyles.logoContainer}>
                  <Text style={dynamicStyles.logoText}>Kmivo</Text>
                  <View
                    style={[
                      dynamicStyles.logoBar,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    dynamicStyles.subtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Sign in to continue to your account
                </Text>
              </View>

              {/* Form Section */}
              <View style={dynamicStyles.formContainer}>
                <CustomInput
                  label="Username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChangeText={value => handleInputChange('username', value)}
                  error={errors.username}
                  leftIcon="person-outline"
                  keyboardType="default"
                  autoCapitalize="none"
                  returnKeyType="next"
                />

                <CustomInput
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={value => handleInputChange('password', value)}
                  error={errors.password}
                  leftIcon="lock-closed-outline"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <CustomButton
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                  style={dynamicStyles.loginButton}
                  icon="arrow-forward-outline"
                  iconPosition="right"
                />
              </View>
            </View>

            {/* Footer Links - Outside innerContainer to push to bottom if space allows */}
            <View style={dynamicStyles.footer}>
              <AnimatedTypingText
                text="Powered by Kmivo"
                style={[
                  dynamicStyles.footerText,
                  { color: theme.colors.textSecondary },
                ]}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    innerContainer: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoContainer: {
      marginBottom: 20,
      alignItems: 'center',
    },
    logoText: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 1,
    },
    logoBar: {
      width: 40,
      height: 4,
      marginTop: 4,
      borderRadius: 2,
    },
    subtitle: {
      fontSize: 23,
      textAlign: 'center',
      fontFamily:
        Platform.OS === 'ios' ? 'DancingScript-Regular' : 'DancingScript',
    },
    formContainer: {
      width: '100%',
    },
    loginButton: {
      marginTop: 24,
    },
    footer: {
      marginTop: 40,
      paddingVertical: 24,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 25,
      fontWeight: '600',
      letterSpacing: 0.5,
      fontFamily:
        Platform.OS === 'ios' ? 'DancingScript-Regular' : 'DancingScript',
    },
  });

export default LoginScreen;
