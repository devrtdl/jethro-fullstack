import Svg, { Line, Polygon } from 'react-native-svg';

import { palette } from '@/src/theme/colors';

type Props = {
  width?: number;
  color?: string;
};

// Filete: ─────◆ ▶ ◆─────  (~70 px wide, 12 px tall)
export function Ornament({ width = 70, color = palette.gold500 }: Props) {
  const h = 12;
  const mid = h / 2;
  const diamondSize = 3.5;
  const arrowSize = 4;
  const center = width / 2;

  // Horizontal lines end/start positions
  const lineInset = 10;
  const leftDiamondX = lineInset + 12;
  const rightDiamondX = width - leftDiamondX;

  return (
    <Svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {/* left line */}
      <Line
        x1={lineInset}
        y1={mid}
        x2={leftDiamondX - diamondSize - 2}
        y2={mid}
        stroke={color}
        strokeWidth={0.75}
        opacity={0.8}
      />
      {/* left diamond */}
      <Polygon
        points={`
          ${leftDiamondX},${mid - diamondSize}
          ${leftDiamondX + diamondSize},${mid}
          ${leftDiamondX},${mid + diamondSize}
          ${leftDiamondX - diamondSize},${mid}
        `}
        fill={color}
        opacity={0.9}
      />
      {/* center arrow (▶) */}
      <Polygon
        points={`
          ${center - arrowSize},${mid - arrowSize}
          ${center + arrowSize},${mid}
          ${center - arrowSize},${mid + arrowSize}
        `}
        fill={color}
      />
      {/* right diamond */}
      <Polygon
        points={`
          ${rightDiamondX},${mid - diamondSize}
          ${rightDiamondX + diamondSize},${mid}
          ${rightDiamondX},${mid + diamondSize}
          ${rightDiamondX - diamondSize},${mid}
        `}
        fill={color}
        opacity={0.9}
      />
      {/* right line */}
      <Line
        x1={rightDiamondX + diamondSize + 2}
        y1={mid}
        x2={width - lineInset}
        y2={mid}
        stroke={color}
        strokeWidth={0.75}
        opacity={0.8}
      />
    </Svg>
  );
}
