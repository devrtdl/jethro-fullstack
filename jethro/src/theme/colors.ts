// Raw design tokens — exact hex values from the Jethro design handoff
export const palette = {
  paper:     '#E5E5DF',
  paperCard: '#FFFFFF',

  navy800: '#0B1F3B',  // primary ink, headings, primary buttons
  navy700: '#142C52',  // navy gradient companion
  navy900: '#050D1F',  // deepest navy (rare)

  gold500: '#D4AF37',  // primary accent
  gold400: '#E8C975',  // highlights on dark surfaces

  inkSoft:  'rgba(11,31,59,0.62)',  // body copy on light bg
  inkMute:  'rgba(11,31,59,0.45)',  // captions, meta on light bg
  hairline: 'rgba(11,31,59,0.10)',  // borders, dividers on light bg

  goldMuted: 'rgba(212,175,55,0.20)',
  liveRed:   '#E2483C',
  success:   '#4CAF7D',
} as const;

export type ThemeColors = {
  background:     string;
  surface:        string;
  surfaceFeature: string;
  ink:            string;
  inkSoft:        string;
  inkMute:        string;
  hairline:       string;
  accent:         string;
  accentSoft:     string;
  accentMuted:    string;
  liveRed:        string;
  success:        string;
  danger:         string;
};

// Light theme — marfim base, navy ink, gold accent
export const light: ThemeColors = {
  background:     palette.paper,
  surface:        palette.paperCard,
  surfaceFeature: palette.navy800,
  ink:            palette.navy800,
  inkSoft:        palette.inkSoft,
  inkMute:        palette.inkMute,
  hairline:       palette.hairline,
  accent:         palette.gold500,
  accentSoft:     palette.gold400,
  accentMuted:    palette.goldMuted,
  liveRed:        palette.liveRed,
  success:        palette.success,
  danger:         palette.liveRed,
};

// Dark theme — navy base (keeps the current dark feel, updated values)
export const dark: ThemeColors = {
  background:     palette.navy800,
  surface:        palette.navy700,
  surfaceFeature: palette.navy900,
  ink:            palette.paper,
  inkSoft:        'rgba(239,239,234,0.72)',
  inkMute:        'rgba(239,239,234,0.45)',
  hairline:       'rgba(239,239,234,0.10)',
  accent:         palette.gold500,
  accentSoft:     palette.gold400,
  accentMuted:    palette.goldMuted,
  liveRed:        palette.liveRed,
  success:        palette.success,
  danger:         palette.liveRed,
};
