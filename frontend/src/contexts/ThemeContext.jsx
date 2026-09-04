import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('recoveriq_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('recoveriq_theme', theme);
    
    const root = window.document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'theme-light' : 'theme-dark';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.add(mediaQuery.matches ? 'theme-light' : 'theme-dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
