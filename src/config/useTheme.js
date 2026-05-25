import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

/**
 * Custom hook to access theme throughout the app
 * Usage: const {theme, themeName, setTheme} = useTheme();
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default useTheme;
