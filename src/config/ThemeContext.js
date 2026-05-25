import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, defaultTheme } from './themes';

const THEME_STORAGE_KEY = '@app_theme';

// Create Theme Context
export const ThemeContext = createContext({
  theme: defaultTheme,
  themeName: 'midnightBlue',
  setTheme: () => {},
});

/**
 * ThemeProvider - Manages theme state and persistence
 */
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [currentThemeName, setCurrentThemeName] = useState('monochrome');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedThemeName = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeName && themes[savedThemeName]) {
        setCurrentTheme(themes[savedThemeName]);
        setCurrentThemeName(savedThemeName);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async themeName => {
    try {
      if (themes[themeName]) {
        setCurrentTheme(themes[themeName]);
        setCurrentThemeName(themeName);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);
      }
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const value = {
    theme: currentTheme,
    themeName: currentThemeName,
    setTheme: changeTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
