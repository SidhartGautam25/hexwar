import React from 'react';
import { Circle, G } from 'react-native-svg';
import { Point } from '../../types/game';
import { cellToPixel } from '../../engine/geometry';

interface TrapPointMarkersProps {
  trapPoints: Point[];
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

export const TrapPointMarkers: React.FC<TrapPointMarkersProps> = ({
  trapPoints,
  cellSize,
  offsetX,
  offsetY,
}) => {
  if (trapPoints.length === 0) return null;

  const radius = Math.max(2.2, cellSize * 0.09);

  return (
    <G>
      {trapPoints.map((point) => {
        const { x: cx, y: cy } = cellToPixel(point, cellSize, offsetX, offsetY);
        return (
          <G key={`trap_${point.r}_${point.c}`}>
            <Circle cx={cx} cy={cy} r={radius + 2} fill="#EF4444" opacity={0.25} />
            <Circle cx={cx} cy={cy} r={radius} fill="#EF4444" stroke="#FCA5A5" strokeWidth={0.8} />
          </G>
        );
      })}
    </G>
  );
};
