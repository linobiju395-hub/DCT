import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center p-0.5 bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 rounded-lg text-xs">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'light'
            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-medium'
            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
        title="Light Mode"
        aria-label="Light mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'dark'
            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-medium'
            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
        title="Dark Mode"
        aria-label="Dark mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-medium'
            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
        title="Follow System Theme"
        aria-label="System theme"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
