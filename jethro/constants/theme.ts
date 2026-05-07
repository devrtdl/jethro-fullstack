// Backwards-compatibility shim.
// New code should import from @/src/theme — these exports exist so existing
// screens keep building while they are being individually reskinned.
import { Platform } from 'react-native';
import { palette, light, dark } from '@/src/theme/colors';

// Existing screens reference these names directly. Values updated to the new
// design tokens; the old dark-navy look is preserved until each screen is reskinned.
export const JethroColors = {
  navy:        palette.navy800,          // #0B1F3B — was #1B2A4A
  navyDeep:    palette.navy900,          // #050D1F — was #0F1E35
  navySurface: palette.navy700,          // #142C52 — was #243358
  gold:        palette.gold500,          // #D4AF37 — was #C8A951
  goldSoft:    palette.gold400,          // #E8C975 — was #DFC278
  goldMuted:   palette.goldMuted,        // rgba(212,175,55,0.20)
  creme:       palette.paper,            // #EFEFEA — was #F5F3EE
  cremeMuted:  'rgba(239,239,234,0.72)', // readable on dark surfaces
  white:       palette.paperCard,
  muted:       '#8A9BB0',                // kept — legible on dark navy surfaces
  success:     palette.success,
  danger:      palette.liveRed,          // #E2483C — was #E05C5C
  overlay:     'rgba(11,31,59,0.85)',
};

export const Colors = {
  light: {
    text:            light.ink,
    background:      light.background,
    tint:            light.accent,
    icon:            light.inkMute,
    tabIconDefault:  light.inkMute,
    tabIconSelected: light.accent,
  },
  dark: {
    text:            dark.ink,
    background:      dark.background,
    tint:            dark.accent,
    icon:            dark.inkMute,
    tabIconDefault:  dark.inkMute,
    tabIconSelected: dark.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
