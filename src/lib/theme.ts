// NEXUS AI theme system — design tokens for light and dark modes

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentText: string;
  success: string;
  warning: string;
  error: string;
  errorBg: string;
  codeBg: string;
  codeHeader: string;
  userBubble: string;
  userBubbleText: string;
  assistantBubble: string;
}

export const lightTheme: ThemeColors = {
  bg: '#ffffff',
  bgSecondary: '#f7f7f8',
  bgTertiary: '#ececf1',
  bgHover: '#f0f0f4',
  border: '#e5e5e8',
  text: '#1a1a1a',
  textSecondary: '#52525b',
  textMuted: '#a1a1aa',
  accent: '#0a7c5a',
  accentHover: '#086549',
  accentText: '#ffffff',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  errorBg: '#fef2f2',
  codeBg: '#0d1117',
  codeHeader: '#161b22',
  userBubble: '#0a7c5a',
  userBubbleText: '#ffffff',
  assistantBubble: '#f7f7f8',
};

export const darkTheme: ThemeColors = {
  bg: '#0d0d10',
  bgSecondary: '#151519',
  bgTertiary: '#1c1c22',
  bgHover: '#22222a',
  border: '#2a2a32',
  text: '#e8e8ec',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  accent: '#10b981',
  accentHover: '#059669',
  accentText: '#ffffff',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  errorBg: '#450a0a',
  codeBg: '#0d1117',
  codeHeader: '#161b22',
  userBubble: '#10b981',
  userBubbleText: '#0d0d10',
  assistantBubble: '#151519',
};

export function getThemeColors(theme: Theme): ThemeColors {
  return theme === 'dark' ? darkTheme : lightTheme;
}
