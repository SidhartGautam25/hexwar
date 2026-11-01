import React from 'react';
import { G, Path, Circle, Image as SvgImage } from 'react-native-svg';
import { Point } from '../../types/game';
import { cellToPixel, hexPolygonPath } from '../../engine/geometry';

export interface HexChainCell {
  point: Point;
  /** Fill inside the white ring (head uses character color, body uses player blue/red). */
  fill?: string;
  /** Head hex uses a double white ring; body uses a single solid ring. */
  isHead?: boolean;
  /** Whether this head is the currently active/selected dot */
  isActiveHead?: boolean;
  /** Character avatar image for the head */
  avatar?: any;
  /** Clean upright hex body image */
  avatarBody?: any;
  /** Inner face layer (eyes and smile) */
  avatarFace?: any;
  /** Facing direction rotation degrees for the head */
  rotation?: number;
}

interface HexChainProps {
  cells: HexChainCell[];
  color: string;
  hexSize: number;
  offsetX: number;
  offsetY: number;
  /**
   * trail: black rim, white ring(s), player/character fill.
   * hint: pale dashed hexes, kept visually separate from a real line.
   * threat: full trail-style hexes in kill colors (drawn above real trails).
   */
  variant?: 'trail' | 'hint' | 'threat';
  /** Black outer rim on trail hexes. */
  borderColor?: string;
}

export const KILL_HINT_BORDER = '#FF4D00';
export const KILL_HINT_FILL = '#FFE94A';

/** Smoothly breathes/twinkles between normal size (1.0) and active size (1.20) */
export function useTwinkleScale(isActive: boolean): number {
  const [scale, setScale] = React.useState(1.0);

  React.useEffect(() => {
    if (!isActive) {
      setScale(1.0);
      return;
    }
    let startTime = Date.now();
    let frameId: number;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = (elapsed % 1100) / 1100;
      const pulse = (1 - Math.cos(2 * Math.PI * t)) / 2;
      setScale(1.0 + pulse * 0.20);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isActive]);

  return scale;
}

export function TrailHex({
  x,
  y,
  hexSize,
  fill,
  borderColor,
  isHead,
  isActiveHead = false,
  avatar,
  avatarBody,
  avatarFace,
  rotation = 0,
}: {
  x: number;
  y: number;
  hexSize: number;
  fill: string;
  borderColor: string;
  isHead: boolean;
  isActiveHead?: boolean;
  avatar?: any;
  avatarBody?: any;
  avatarFace?: any;
  rotation?: number;
}) {
  const twinkleScale = useTwinkleScale(isActiveHead);
  const rimRadius = hexSize * (isHead ? 0.92 : 0.9);
  const fillRadius = hexSize * (isHead ? 0.52 : 0.62);

  // If head has character artwork: render upright body + directional face!
  if (isHead && (avatarBody || avatar)) {
    const baseBody = avatarBody ?? avatar;
    const baseFace = avatarFace;
    const imgSize = hexSize * 2.18;

    // Directional glance offset: face looks slightly toward the move direction
    const rad = ((rotation - 90) * Math.PI) / 180;
    const glanceDist = hexSize * 0.08;
    const faceDx = Math.cos(rad) * glanceDist;
    const faceDy = Math.sin(rad) * glanceDist;

    return (
      <G transform={`translate(${x}, ${y}) scale(${twinkleScale})`}>
        {/* 1. Hex head body: ALWAYS properly inclined/upright, 0 rotation, all sides aligned with hex box */}
        <SvgImage
          href={baseBody}
          x={-imgSize / 2}
          y={-imgSize / 2}
          width={imgSize}
          height={imgSize}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* 2. Face (eyes, smile): faces in the direction of movement */}
        {baseFace && (
          <G transform={`translate(${faceDx}, ${faceDy}) rotate(${rotation})`}>
            <SvgImage
              href={baseFace}
              x={-imgSize / 2}
              y={-imgSize / 2}
              width={imgSize}
              height={imgSize}
              preserveAspectRatio="xMidYMid meet"
            />
          </G>
        )}
      </G>
    );
  }

  return (
    <G transform={isHead ? `translate(${x}, ${y}) scale(${twinkleScale})` : undefined}>
      <Path
        d={hexPolygonPath(isHead ? 0 : x, isHead ? 0 : y, rimRadius)}
        fill={borderColor}
      />
      {isHead ? (
        <G>
          <Path d={hexPolygonPath(0, 0, hexSize * 0.84)} fill="#FFFFFF" />
          <Path d={hexPolygonPath(0, 0, hexSize * 0.72)} fill={borderColor} />
          <Path d={hexPolygonPath(0, 0, hexSize * 0.64)} fill="#FFFFFF" />
        </G>
      ) : (
        <Path d={hexPolygonPath(x, y, hexSize * 0.76)} fill="#FFFFFF" />
      )}
      <Path
        d={hexPolygonPath(isHead ? 0 : x, isHead ? 0 : y, fillRadius)}
        fill={fill}
      />
    </G>
  );
}

export const HexChain: React.FC<HexChainProps> = ({
  cells,
  color,
  hexSize,
  offsetX,
  offsetY,
  variant = 'trail',
  borderColor = '#000000',
}) => {
  if (cells.length === 0) return null;

  if (variant === 'threat') {
    const last = cells.length - 1;
    return (
      <G>
        {cells.map((cell, index) => {
          const { x, y } = cellToPixel(cell.point, hexSize, offsetX, offsetY);
          const isHead = index === last;
          return (
            <G key={`kill_${cell.point.r}_${cell.point.c}`}>
              <TrailHex
                x={x}
                y={y}
                hexSize={hexSize}
                fill={cell.fill ?? KILL_HINT_FILL}
                borderColor={KILL_HINT_BORDER}
                isHead={isHead}
              />
            </G>
          );
        })}
      </G>
    );
  }

  if (variant === 'hint') {
    return (
      <G>
        {cells.map((cell) => {
          const { x, y } = cellToPixel(cell.point, hexSize, offsetX, offsetY);
          return (
            <G key={`hint_${cell.point.r}_${cell.point.c}`}>
              <Path
                d={hexPolygonPath(x, y, hexSize * 0.72)}
                fill={color}
                fillOpacity={0.22}
                stroke={color}
                strokeOpacity={0.98}
                strokeWidth={Math.max(1.6, hexSize * 0.09)}
                strokeDasharray={`${Math.max(3, hexSize * 0.22)} ${Math.max(2, hexSize * 0.14)}`}
              />
            </G>
          );
        })}
      </G>
    );
  }

  return (
    <G>
      {[...cells]
        .sort((a, b) => {
          if (a.isHead && !b.isHead) return 1;
          if (!a.isHead && b.isHead) return -1;
          return 0;
        })
        .map((cell) => {
          const { x, y } = cellToPixel(cell.point, hexSize, offsetX, offsetY);
          const fill = cell.fill ?? color;
          return (
            <G key={`body_${cell.point.r}_${cell.point.c}`}>
              <TrailHex
                x={x}
                y={y}
                hexSize={hexSize}
                fill={fill}
                borderColor={borderColor}
                isHead={cell.isHead === true}
                isActiveHead={cell.isActiveHead === true}
                avatar={cell.avatar}
                avatarBody={cell.avatarBody}
                avatarFace={cell.avatarFace}
                rotation={cell.rotation}
              />
            </G>
          );
        })}
    </G>
  );
};
