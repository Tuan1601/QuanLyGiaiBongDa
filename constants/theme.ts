/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#B91C3C';  // Football red
const tintColorDark = '#DC2626';

export const Colors = {
  light: {
    primary: '#B91C3C',      // Football red
    secondary: '#059669',    // Grass green
    accent: '#F59E0B',       // Golden yellow
    background: '#FFFFFF',
    card: '#F8FAFC',
    surface: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    win: '#059669',
    draw: '#F59E0B',
    lose: '#DC2626',
    warning: '#F59E0B',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    gradient: {
      primary: ['#B91C3C', '#DC2626'],
      secondary: ['#059669', '#10B981'],
      surface: ['#F8FAFC', '#F1F5F9', '#FFFFFF'],
    },
  },
  dark: {
    primary: '#DC2626',
    secondary: '#10B981',
    accent: '#FBBF24',
    background: '#0F172A',
    card: '#1E293B',
    surface: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#475569',
    win: '#10B981',
    draw: '#FBBF24',
    lose: '#EF4444',
    warning: '#FBBF24',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    gradient: {
      primary: ['#DC2626', '#EF4444'],
      secondary: ['#10B981', '#34D399'],
      surface: ['#0F172A', '#1E293B', '#334155'],
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
