import React, { useEffect } from 'react';
import { Circle, G, Path, Rect, Line } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Dot } from '../../types/game';
import { BoardFeatureInstance } from '../../types/boardFeatures';
import { cellToPixel, getMovementRotationDegrees } from '../../engine/geometry';
import { isDotProtectedAtPosition } from '../../features/boardFeatureQueries';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

interface BaseDotMarkerProps {
  dot: Dot;
  color: string;
  isSelected: boolean;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  killEffect: 'collapse' | 'explode' | 'dissolve' | 'monster' | 'hammer' | 'burn' | 'firecracker';
  themeColors: any;
  shape?: 'circle' | 'arrow' | 'hexagon' | 'diamond' | 'square' | 'star';
  boardFeatures?: BoardFeatureInstance[];
}

export const BaseDotMarker: React.FC<BaseDotMarkerProps> = ({
  dot,
  color,
  isSelected,
  cellSize,
  offsetX,
  offsetY,
  killEffect,
  themeColors,
  shape = 'circle',
  boardFeatures = [],
}) => {
  if (!dot || !dot.currentPos) return null;

  const { x: cx, y: cy } = cellToPixel(dot.currentPos, cellSize, offsetX, offsetY);
  const markerScale = Math.min(0.62, (cellSize * 0.46) / 8);
  const facingRotation = getMovementRotationDegrees(dot);
  const isShielded = dot.isAlive && isDotProtectedAtPosition(dot.currentPos, boardFeatures);

  const pulse = useSharedValue(1.0);
  const aliveVal = useSharedValue(dot.isAlive ? 1.0 : 0.0);

  // Pulse animation on selection
  useEffect(() => {
    if (isSelected && dot.isAlive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(1.0, { duration: 250 });
    }
  }, [isSelected, dot.isAlive]);

  // Transition aliveVal from 1.0 to 0.0 on death
  useEffect(() => {
    if (!dot.isAlive) {
      aliveVal.value = withTiming(0.0, { duration: 2500 });
    } else {
      aliveVal.value = 1.0;
    }
  }, [dot.isAlive]);

  const shapeProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    let scale = val;
    let opacity = val;
    if (killEffect === 'monster' || killEffect === 'hammer') {
      if (val >= 0.4) {
        opacity = (val - 0.4) / 0.6;
        scale = opacity;
      } else {
        opacity = 0;
        scale = 0;
      }
    }
    const s = pulse.value * scale;
    return {
      opacity,
      transform: [{ scale: s }],
    };
  });

  const killerColor = themeColors ? (dot.player === 1 ? themeColors.p2Shades[0] : themeColors.p1Shades[0]) : '#EF4444';



  // Effect 1: Blackhole Implosion props (peaks at mid-point, then fades to 0)
  const collapseRingProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    let opacity = 0;
    if (val > 0.4) {
      opacity = (1.0 - val) / 0.6;
    } else {
      opacity = val / 0.4;
    }
    return {
      r: 3.5 + (1 - val) * 8,
      opacity: opacity,
    };
  });

  // Effect 2: Supernova Burst props
  const explodeRingProps = useAnimatedProps(() => {
    const rVal = 7.8 + (1 - aliveVal.value) * 22;
    const opVal = aliveVal.value * (1 - aliveVal.value) * 2.5; // peaks at mid point
    return {
      r: rVal,
      opacity: Math.max(0, Math.min(opVal, 1.0)),
    };
  });

  const craterProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    let opacity = 0;
    if (val > 0.4) {
      opacity = (1.0 - val) / 0.6;
    } else {
      opacity = val / 0.4;
    }
    return {
      opacity: opacity,
    };
  });

  // Effect 3: Digital Dissolve props
  const dissolveProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    let opacity = 0;
    if (val > 0.4) {
      opacity = 0.45 * ((1.0 - val) / 0.6);
    } else {
      opacity = 0.45 * (val / 0.4);
    }
    return {
      opacity: opacity,
    };
  });

  // Effect 4: Monster Chomper props
  // Effect 4: Monster Chomper props
  const topJawProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    const progress = Math.max(0, Math.min((val - 0.4) / 0.6, 1.0));
    const ty = -28 * progress;
    let opacity = 0;
    if (val >= 0.4) {
      opacity = (1 - val) / 0.6;
    } else {
      opacity = val / 0.4;
    }
    return {
      transform: [{ translateY: ty }],
      opacity: Math.max(0, Math.min(opacity, 1.0)),
    };
  });

  const bottomJawProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    const progress = Math.max(0, Math.min((val - 0.4) / 0.6, 1.0));
    const ty = 28 * progress;
    let opacity = 0;
    if (val >= 0.4) {
      opacity = (1 - val) / 0.6;
    } else {
      opacity = val / 0.4;
    }
    return {
      transform: [{ translateY: ty }],
      opacity: Math.max(0, Math.min(opacity, 1.0)),
    };
  });

  const hammerProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    const progress = Math.max(0, Math.min((val - 0.4) / 0.6, 1.0));
    const rotation = -70 * progress;

    let opacity = 0;
    if (val >= 0.4) {
      opacity = (1 - val) / 0.6;
    } else {
      opacity = val / 0.4;
    }
    return {
      transform: [
        { translateX: 60 * progress },
        { translateY: -70 * progress },
        { rotate: `${rotation}deg` },
      ],
      opacity: Math.max(0, Math.min(opacity, 1.0)),
    };
  });

  const shardProps = (angle: number, maxDist: number) => {
    return useAnimatedProps(() => {
      const val = aliveVal.value;
      if (val >= 0.4) {
        return {
          cx: cx,
          cy: cy,
          opacity: 0,
        };
      }
      const progress = (0.4 - val) / 0.4;
      const dist = progress * maxDist;
      const opacity = 1 - progress;
      const rad = (angle * Math.PI) / 180;
      return {
        cx: cx + Math.cos(rad) * dist,
        cy: cy + Math.sin(rad) * dist,
        opacity: opacity,
      };
    });
  };

  const shard1Props = shardProps(0, 32);
  const shard2Props = shardProps(60, 32);
  const shard3Props = shardProps(120, 32);
  const shard4Props = shardProps(180, 32);
  const shard5Props = shardProps(240, 32);
  const shard6Props = shardProps(300, 32);

  // Effect 6: Incinerating Flame (rising, scaling, fading flames)
  const flameRedProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    const progress = 1.0 - val;
    const scale = progress * 1.5;
    const ty = -18 * progress;
    const opacity = progress < 0.85 ? 1.0 - progress / 0.85 : 0;
    return {
      transform: [{ translateY: ty }, { scale }],
      opacity,
    };
  });

  const flameOrangeProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    const progress = 1.0 - val;
    const scale = progress * 1.25;
    const ty = -24 * progress;
    const opacity = progress < 0.75 ? 1.0 - progress / 0.75 : 0;
    return {
      transform: [{ translateY: ty }, { scale }],
      opacity,
    };
  });

  const flameYellowProps = useAnimatedProps(() => {
    const val = aliveVal.value;
    const progress = 1.0 - val;
    const scale = progress * 0.95;
    const ty = -30 * progress;
    const opacity = progress < 0.65 ? 1.0 - progress / 0.65 : 0;
    return {
      transform: [{ translateY: ty }, { scale }],
      opacity,
    };
  });

  // Effect 7: Firecracker Burst (8 colorful radial shooting sparks)
  const firecrackerSparkProps = (angle: number, colorHex: string) => {
    return useAnimatedProps(() => {
      const val = aliveVal.value;
      const progress = 1.0 - val;
      const maxDist = 38;
      const dist = progress * maxDist;
      const opacity = progress < 0.9 ? 1.0 - (progress / 0.9) : 0;
      const rad = (angle * Math.PI) / 180;
      return {
        cx: cx + Math.cos(rad) * dist,
        cy: cy + Math.sin(rad) * dist,
        opacity: opacity,
        r: 3.8 * (1.0 - progress),
        fill: colorHex,
      };
    });
  };

  const firecrackerSpark1Props = firecrackerSparkProps(0, '#FF007F');
  const firecrackerSpark2Props = firecrackerSparkProps(45, '#FDE047');
  const firecrackerSpark3Props = firecrackerSparkProps(90, '#00F2FF');
  const firecrackerSpark4Props = firecrackerSparkProps(135, '#39FF14');
  const firecrackerSpark5Props = firecrackerSparkProps(180, '#FF5F1F');
  const firecrackerSpark6Props = firecrackerSparkProps(225, '#B026FF');
  const firecrackerSpark7Props = firecrackerSparkProps(270, '#FFFF00');
  const firecrackerSpark8Props = firecrackerSparkProps(315, '#00FFFF');
  const renderShape = () => {
    switch (shape) {
      case 'arrow':
        return (
          <G>
            <Path d="M 0,-7 L 6.5,5.5 L 0,2.5 L -6.5,5.5 Z" fill={color} />
          </G>
        );
      case 'hexagon':
        return (
          <G>
            <Path d="M 0,-8 L 7,-4 L 7,4 L 0,8 L -7,4 L -7,-4 Z" fill={color} />
          </G>
        );
      case 'diamond':
        return (
          <G>
            <Path d="M 0,-9 L 8,0 L 0,9 L -8,0 Z" fill={color} />
          </G>
        );
      case 'square':
        return (
          <G>
            <Rect x={-7} y={-7} width={14} height={14} rx={1.5} fill={color} />
          </G>
        );
      case 'star':
        return (
          <G>
            <Path d="M 0,-9 Q 0,-2 7,0 Q 0,2 0,9 Q 0,2 -7,0 Q 0,-2 0,-9 Z" fill={color} />
          </G>
        );
      case 'circle':
      default:
        return (
          <G>
            <Circle cx={0} cy={0} r={6.2} fill={color} />
          </G>
        );
    }
  };

  return (
    <G>
      {isShielded && (
        <Circle
          cx={cx}
          cy={cy}
          r={Math.max(6, cellSize * 0.36)}
          fill="none"
          stroke="#38BDF8"
          strokeWidth={1.4}
          strokeOpacity={0.85}
          strokeDasharray="3, 2"
        />
      )}

      {/* Core Shape (Animated Transform, Pulse & Fade) */}
      <G transform={`translate(${cx}, ${cy}) rotate(${facingRotation}) scale(${markerScale})`}>
        <AnimatedG animatedProps={shapeProps}>
          {renderShape()}
        </AnimatedG>
      </G>

      {/* Render selected elimination visual trace (Drawn ON TOP of core dot) */}
      {killEffect === 'collapse' && (
        <AnimatedCircle
          cx={cx}
          cy={cy}
          fill="#000000"
          stroke={color}
          strokeWidth={1.2}
          animatedProps={collapseRingProps}
        />
      )}

      {killEffect === 'explode' && (
        <G>
          {/* Nova Shockwave */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            fill="none"
            stroke={color}
            strokeWidth={2}
            animatedProps={explodeRingProps}
          />
          {/* Leftover Crater */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={5.5}
            fill="none"
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="2, 2"
            animatedProps={craterProps}
          />
        </G>
      )}

      {killEffect === 'dissolve' && (
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={9.0}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          strokeDasharray="2, 3"
          animatedProps={dissolveProps}
        />
      )}

      {killEffect === 'monster' && (
        <G transform={`translate(${cx}, ${cy})`}>
          {/* Menacing Cyber Beast Top Jaw */}
          <AnimatedG animatedProps={topJawProps}>
            <Path
              d="M -28,-4 Q 0,-30 28,-4 L 28,0 L 18,-14 L 10,0 L 0,-16 L -10,0 L -18,-14 L -28,0 Z"
              fill="#0F172A"
              stroke={killerColor}
              strokeWidth={2.0}
            />
            {/* Angry Slanted Laser Eyes */}
            <Path d="M -13,-15 L -4,-11 L -9,-7 Z" fill={killerColor} />
            <Path d="M 13,-15 L 4,-11 L 9,-7 Z" fill={killerColor} />
          </AnimatedG>

          {/* Menacing Cyber Beast Bottom Jaw */}
          <AnimatedG animatedProps={bottomJawProps}>
            <Path
              d="M -28,4 Q 0,30 28,4 L 28,0 L 18,14 L 10,0 L 0,16 L -10,0 L -18,14 L -28,0 Z"
              fill="#0F172A"
              stroke={killerColor}
              strokeWidth={2.0}
            />
          </AnimatedG>
        </G>
      )}

      {killEffect === 'hammer' && (
        <G transform={`translate(${cx}, ${cy})`}>
          {/* Cybernetic Energy Warhammer */}
          <AnimatedG animatedProps={hammerProps}>
            {/* Dark carbon-fiber handle */}
            <Rect
              x={-3}
              y={-70}
              width={6}
              height={65}
              rx={1}
              fill="#1E293B"
              stroke="#475569"
              strokeWidth={0.8}
            />
            {/* Heavy guard */}
            <Rect
              x={-8}
              y={-72}
              width={16}
              height={4}
              rx={1}
              fill="#64748B"
            />
            {/* Glowing neon handle conduit */}
            <Line
              x1={0}
              y1={-68}
              x2={0}
              y2={-8}
              stroke={killerColor}
              strokeWidth={1.2}
              opacity={0.8}
            />
            {/* Heavy multi-faceted warhammer head */}
            <Path
              d="M -24,-94 L -16,-106 L 16,-106 L 24,-94 L 24,-82 L 16,-70 L -16,-70 L -24,-82 Z"
              fill="#334155"
              stroke={killerColor}
              strokeWidth={2.2}
            />
            {/* Engraved glowing reactor core */}
            <Rect
              x={-10}
              y={-92}
              width={20}
              height={8}
              rx={2}
              fill={killerColor}
              opacity={0.9}
            />
          </AnimatedG>

          {/* Flying Fragments in all 6 directions (crashing) */}
          <AnimatedCircle r={4.5} fill={color} animatedProps={shard1Props} />
          <AnimatedCircle r={4.5} fill={color} animatedProps={shard2Props} />
          <AnimatedCircle r={4.5} fill={color} animatedProps={shard3Props} />
          <AnimatedCircle r={4.5} fill={color} animatedProps={shard4Props} />
          <AnimatedCircle r={4.5} fill={color} animatedProps={shard5Props} />
          <AnimatedCircle r={4.5} fill={color} animatedProps={shard6Props} />
        </G>
      )}

      {killEffect === 'burn' && (
        <G transform={`translate(${cx}, ${cy})`}>
          {/* Flame Red */}
          <AnimatedG animatedProps={flameRedProps}>
            <Path
              d="M 0,-15 Q -10,0 0,10 Q 10,0 0,-15 Z"
              fill="#EF4444"
            />
          </AnimatedG>
          {/* Flame Orange */}
          <AnimatedG animatedProps={flameOrangeProps}>
            <Path
              d="M 0,-12 Q -8,0 0,8 Q 8,0 0,-12 Z"
              fill="#F97316"
            />
          </AnimatedG>
          {/* Flame Yellow */}
          <AnimatedG animatedProps={flameYellowProps}>
            <Path
              d="M 0,-9 Q -6,0 0,6 Q 6,0 0,-9 Z"
              fill="#FBBF24"
            />
          </AnimatedG>
        </G>
      )}

      {killEffect === 'firecracker' && (
        <G>
          <AnimatedCircle animatedProps={firecrackerSpark1Props} />
          <AnimatedCircle animatedProps={firecrackerSpark2Props} />
          <AnimatedCircle animatedProps={firecrackerSpark3Props} />
          <AnimatedCircle animatedProps={firecrackerSpark4Props} />
          <AnimatedCircle animatedProps={firecrackerSpark5Props} />
          <AnimatedCircle animatedProps={firecrackerSpark6Props} />
          <AnimatedCircle animatedProps={firecrackerSpark7Props} />
          <AnimatedCircle animatedProps={firecrackerSpark8Props} />
        </G>
      )}

    </G>
  );
};
