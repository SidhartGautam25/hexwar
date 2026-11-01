import React from 'react';
import { G, Path, Circle } from 'react-native-svg';
import { RegionOrigin } from '../../types/gridRegion';
import { BracketStyle, RegionNodeStyle } from '../../constants/regionNodeStyles';
import { regionLabelPosition, regionPolygonPath } from '../../utils/regionRender';

interface RegionNodeFrameProps {
  origin: RegionOrigin;
  style: RegionNodeStyle;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  glyph: React.ReactNode;
  /** Softer fill and glow for treasure regions. */
  subtle?: boolean;
}

function InternalGlow({
  cx,
  cy,
  radius,
  fill,
  accent,
  cornerStyle,
  subtle = false,
}: {
  cx: number;
  cy: number;
  radius: number;
  fill: string;
  accent: string;
  cornerStyle: BracketStyle;
  subtle?: boolean;
}) {
  const outerOpacity = subtle ? 0.18 : 0.35;
  const midOpacity = subtle ? 0.08 : 0.18;
  const innerOpacity = subtle ? 0.05 : 0.12;

  return (
    <G>
      <Circle cx={cx} cy={cy} r={radius * 1.05} fill={fill} opacity={outerOpacity} />
      <Circle cx={cx} cy={cy} r={radius * 0.72} fill={accent} opacity={midOpacity} />
      <Circle cx={cx} cy={cy} r={radius * 0.42} fill={accent} opacity={innerOpacity} />
      {cornerStyle === 'stack' && (
        <Circle
          cx={cx}
          cy={cy}
          r={radius * 0.58}
          fill="none"
          stroke={accent}
          strokeWidth={0.7}
          opacity={subtle ? 0.1 : 0.22}
          strokeDasharray="2,2"
        />
      )}
      {cornerStyle === 'shield' && (
        <Circle
          cx={cx}
          cy={cy}
          r={radius * 0.62}
          fill="none"
          stroke={accent}
          strokeWidth={1}
          opacity={0.3}
        />
      )}
    </G>
  );
}

export const RegionNodeFrame: React.FC<RegionNodeFrameProps> = ({
  origin,
  style,
  cellSize,
  offsetX,
  offsetY,
  glyph,
  subtle = false,
}) => {
  const { x: cx, y: cy } = regionLabelPosition(origin, cellSize, offsetX, offsetY);
  const sw = Math.max(1.1, cellSize * 0.038);
  const glowR = cellSize * 0.62;

  return (
    <G opacity={subtle ? 0.78 : 0.96}>
      <Path
        d={regionPolygonPath(origin, cellSize, offsetX, offsetY, 0.04)}
        fill={style.fill}
        stroke={style.primary}
        strokeWidth={sw * 0.55}
        strokeDasharray={style.borderDash}
        opacity={subtle ? 0.5 : 0.8}
      />

      <InternalGlow
        cx={cx}
        cy={cy - 1}
        radius={glowR}
        fill={style.innerGlow}
        accent={style.secondary}
        cornerStyle={style.bracketStyle}
        subtle={subtle}
      />

      {glyph}
    </G>
  );
};
