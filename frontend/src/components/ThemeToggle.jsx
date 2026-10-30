import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none border ${
        isDark 
          ? 'bg-[#18181b] border-white/10 hover:border-white/20' 
          : 'bg-[#e4e4e7] border-zinc-300 hover:border-zinc-400'
      } ${className}`}
    >
      <span
        className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-black text-white shadow-md transition-transform duration-300 ${
          isDark ? 'translate-x-7 bg-white text-black' : 'translate-x-1 bg-zinc-800 text-amber-300'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-black" fill="currentColor" strokeWidth={1} />
        ) : (
          <Sun className="h-3 w-3 text-amber-400" />
        )}
      </span>
      {showLabel && (
        <span className="sr-only">{isDark ? 'Dark mode' : 'Light mode'}</span>
      )}
    </button>
  );
};

export default ThemeToggle;
