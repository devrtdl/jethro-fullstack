// Font family identifiers — keys must match the export names from @expo-google-fonts/*
// so that useFonts registers them under these exact fontFamily strings.
export const FontFamily = {
  serifRegular:        'CormorantGaramond_400Regular',
  serifMedium:         'CormorantGaramond_500Medium',
  serifSemiBold:       'CormorantGaramond_600SemiBold',
  serifMediumItalic:   'CormorantGaramond_500Medium_Italic',
  serifSemiBoldItalic: 'CormorantGaramond_600SemiBold_Italic',
  sansRegular:         'Inter_400Regular',
  sansMedium:          'Inter_500Medium',
  sansSemiBold:        'Inter_600SemiBold',
  sansBold:            'Inter_700Bold',
  monoRegular:         'JetBrainsMono_400Regular',
  monoMedium:          'JetBrainsMono_500Medium',
} as const;

export type FontFamilyKey = keyof typeof FontFamily;

// Type ramp — sized for iPhone 16 Pro (402×874), density-independent units match design px 1:1
export const TypeScale = {
  heroDisplay: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 36,
    lineHeight: 40,    // ~1.1
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 30,
    lineHeight: 33,
  },
  h2: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 22,
    lineHeight: 27,
  },
  h3: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 19,
    lineHeight: 24,
  },
  cardTitle: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  cardTitleLg: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  bodyLarge: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 15,
    lineHeight: 24,    // 1.6
  },
  body: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 14,
    lineHeight: 22,    // 1.57
  },
  bodySm: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 13.5,
    lineHeight: 21,
  },
  eyebrow: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
  },
  eyebrowLg: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2.5,
  },
  tabLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 10.5,
    lineHeight: 14,
  },
  caption: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 11,
    lineHeight: 16,
  },
  timecode: {
    fontFamily: FontFamily.monoRegular,
    fontSize: 11,
    lineHeight: 16,
  },
  timecodeMd: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 13,
    lineHeight: 18,
  },
} as const;

export type TypeScaleKey = keyof typeof TypeScale;

