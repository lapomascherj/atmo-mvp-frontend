import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isCollapsed = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme from local storage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem('atmo-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialDarkMode = savedTheme 
      ? savedTheme === 'dark'
      : prefersDark;
    
    setIsDarkMode(initialDarkMode);
    applyTheme(initialDarkMode);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
    localStorage.setItem('atmo-theme', newDarkMode ? 'dark' : 'light');
  };

  const applyTheme = (darkMode: boolean) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`${
        isCollapsed ? 'w-10 h-10' : 'px-3 py-2'
      } flex items-center justify-center gap-2 rounded-xl bg-black/30 border border-white/10 hover:bg-black/40 transition-all duration-300`}
    >
      {isDarkMode ? (
        <>
          <Moon size={16} className="text-white/70" />
          {!isCollapsed && <span className="text-white/70 text-sm">Dark</span>}
        </>
      ) : (
        <>
          <Sun size={16} className="text-white/70" />
          {!isCollapsed && <span className="text-white/70 text-sm">Light</span>}
        </>
      )}
    </button>
  );
};

export default ThemeToggle; 