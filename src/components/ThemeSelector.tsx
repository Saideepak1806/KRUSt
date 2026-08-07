export type ThemeMode = 'dark';

export function getSavedTheme(): ThemeMode {
  return 'dark';
}

export function applyTheme(_theme?: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.setItem('krust_theme_mode', 'dark');
}

export default function ThemeSelector() {
  return null;
}

