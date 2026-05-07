import Svg, { Circle } from 'react-native-svg';

import { palette } from '@/src/theme/colors';

type Props = {
  size?: number;
};

// 5 px gold dot with 8 px glow ring at 30% opacity
export function DotGold({ size = 5 }: Props) {
  const glow = size + 6;
  const total = glow + 4; // viewBox padding

  return (
    <Svg
      width={total}
      height={total}
      viewBox={`0 0 ${total} ${total}`}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {/* glow ring */}
      <Circle
        cx={total / 2}
        cy={total / 2}
        r={glow / 2}
        fill={palette.gold500}
        opacity={0.3}
      />
      {/* dot */}
      <Circle
        cx={total / 2}
        cy={total / 2}
        r={size / 2}
        fill={palette.gold500}
      />
    </Svg>
  );
}
