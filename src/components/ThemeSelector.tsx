import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Deep obsidian canvas with high-contrast text',
    icon: <Moon className="w-4 h-4 text-emerald-400" />,
    previewBg: '#0b0f19',
    previewCard: '#0f172a',
    previewAccent: '#10b981',
    isDark: true,
  },
  {
    id: 'light',
    name: 'Light Mode',
    description: 'Crisp, high-contrast studio light theme',
    icon: <Sun className="w-4 h-4 text-amber-500" />,
    previewBg: '#ffffff',
    previewCard: '#ffffff',
    previewAccent: '#059669',
    isDark: false,
  },
];

const STORAGE_KEY = 'krust_theme_mode';

export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'dark';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const active = getSavedTheme();
    setCurrentTheme(active);
    applyTheme(active);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const isDark = currentTheme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className="text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium py-1.5 px-3 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm group"
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-emerald-400 transition-transform group-hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform group-hover:rotate-45" />
        )}
      </div>
      <span className="font-mono text-xs font-semibold">
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
}

