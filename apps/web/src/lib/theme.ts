export const THEME_STORAGE_KEY = 'life-ops-theme';

export type ThemeName = 'light' | 'dark' | 'dracula';

export type ThemeOption = {
  id: ThemeName;
  label: string;
  description: string;
  swatches: [string, string, string];
};

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', label: '浅色', description: 'Apple Light', swatches: ['#edf2f8', '#0a84ff', '#34c759'] },
  { id: 'dark', label: '深色', description: 'MacOS Graphite', swatches: ['#17181c', '#0a84ff', '#30d158'] },
  { id: 'dracula', label: 'Dracula', description: 'Purple Neon Dark', swatches: ['#1d1f2b', '#bd93f9', '#ff79c6'] },
];

export function isThemeName(value: string | null): value is ThemeName {
  return value === 'light' || value === 'dark' || value === 'dracula';
}

export function getSystemTheme(): ThemeName {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'dark';

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeName(storedTheme)) return storedTheme;

  return getSystemTheme();
}

export function applyTheme(theme: ThemeName, root: HTMLElement = document.documentElement) {
  root.dataset.theme = theme;
  root.classList.remove('light', 'dark', 'dracula');

  if (theme === 'light') {
    root.classList.add('light');
    root.style.colorScheme = 'light';
    return;
  }

  root.classList.add('dark');

  if (theme === 'dracula') {
    root.classList.add('dracula');
  }

  root.style.colorScheme = 'dark';
}

export function persistTheme(theme: ThemeName) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
