import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', showLabel = true }) => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/25 hover:text-white ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {showLabel && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
};

export default ThemeToggle;
