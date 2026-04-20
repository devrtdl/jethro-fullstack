import { Platform } from 'react-native';

export const JethroColors = {
  navy: '#1B2A4A',
  navyDeep: '#0F1E35',
  navySurface: '#243358',
  gold: '#C8A951',
  goldSoft: '#DFC278',
  goldMuted: 'rgba(200, 169, 81, 0.20)',
  creme: '#F5F3EE',
  cremeMuted: '#E8E5DE',
  white: '#FFFFFF',
  muted: '#8A9BB0',
  success: '#4CAF7D',
  danger: '#E05C5C',
  overlay: 'rgba(27, 42, 74, 0.85)',
};

export const Colors = {
  light: {
    text: JethroColors.navy,
    background: JethroColors.creme,
    tint: JethroColors.gold,
    icon: JethroColors.muted,
    tabIconDefault: JethroColors.muted,
    tabIconSelected: JethroColors.gold,
  },
  dark: {
    text: JethroColors.creme,
    background: JethroColors.navy,
    tint: JethroColors.gold,
    icon: JethroColors.muted,
    tabIconDefault: JethroColors.muted,
    tabIconSelected: JethroColors.gold,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
