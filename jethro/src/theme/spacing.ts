export const Spacing = {
  screenH: 22,   // horizontal screen padding
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  pill:   100,   // pill / badge
  hero:   18,    // hero / feature cards
  md:     16,    // medium cards
  sm:     14,    // small cards
  button: 12,    // button corners
  xs:     10,    // inner elements
  icon:   8,     // icon containers
} as const;

export const ButtonSize = {
  primary:   54,   // primary CTA height
  secondary: 48,   // ghost / secondary
  icon:      40,   // circular icon button
  iconSm:    36,   // smaller circular icon
} as const;

type ShadowProps = {
  shadowColor:   string;
  shadowOffset:  { width: number; height: number };
  shadowOpacity: number;
  shadowRadius:  number;
  elevation:     number;  // Android
};

// Unified cross-platform shadow utility.
// iOS uses shadow* props; Android uses elevation.
// Both are included so you can spread the result into a style object.
export function getShadow(level: 1 | 2 | 3): ShadowProps {
  switch (level) {
    case 1:  // soft card  — 0 4 14 rgba(11,31,59,0.04)
      return {
        shadowColor:   '#0B1F3B',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius:  14,
        elevation:     2,
      };
    case 2:  // feature navy — 0 12 30 rgba(11,31,59,0.18)
      return {
        shadowColor:   '#0B1F3B',
        shadowOffset:  { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius:  30,
        elevation:     8,
      };
    case 3:  // primary CTA  — 0 10 24 rgba(11,31,59,0.25)
      return {
        shadowColor:   '#0B1F3B',
        shadowOffset:  { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius:  24,
        elevation:     10,
      };
  }
}
