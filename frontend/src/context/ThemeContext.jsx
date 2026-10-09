import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const readSavedTheme = () => {
  try {
    return localStorage.getItem('campux_theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readSavedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');

    try {
      localStorage.setItem('campux_theme', theme);
    } catch {
      // Keep the selected theme for this session if storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
