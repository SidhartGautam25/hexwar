import React from 'react';
import { Line, G } from 'react-native-svg';
import { LineSegment as LineSegmentType } from '../../types/game';

interface LineSegmentProps {
  segment: LineSegmentType;
  color: string;
  index: number; // Index in the history array (0 to length-1)
  historyLength: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  selectedLines: string[];
}

export const LineSegment: React.FC<LineSegmentProps> = ({
  segment,
  color,
  index,
  historyLength,
  cellSize,
  offsetX,
  offsetY,
  selectedLines,
}) => {
  const x1 = segment.start.c * cellSize + offsetX;
  const y1 = segment.start.r * cellSize + offsetY;
  const x2 = segment.end.c * cellSize + offsetX;
  const y2 = segment.end.r * cellSize + offsetY;

  // Extract dot number from segment ID (e.g. "p1_2_line_..." => "2")
  const dotId = segment.id.split('_line_')[0];
  const dotNumber = dotId.split('_')[1] || '1';

  // Calculate age properties. Newest segment is at index (historyLength - 1)
  const ageFromNewest = historyLength - 1 - index;

  let baseOpacity = 1.0;
  if (ageFromNewest === 2) {
    baseOpacity = 0.3; // Oldest segment
  } else if (ageFromNewest === 1) {
    baseOpacity = 0.65; // Middle segment
  }

  // Get active line style based on dot number index
  const dotIdx = Math.max(0, Math.min(2, parseInt(dotNumber) - 1));
  const activeStyle = selectedLines[dotIdx] || 'solid';

  switch (activeStyle) {
    case 'dotted':
      // Dotted spacing trail
      return (
        <Line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={3.5}
          strokeOpacity={baseOpacity}
          strokeLinecap="round"
          strokeDasharray="1, 5"
        />
      );

    case 'glow':
      // Glowing neon-style dual line
      return (
        <G>
          <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={9}
            strokeOpacity={baseOpacity * 0.25}
            strokeLinecap="round"
          />
          <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={2.5}
            strokeOpacity={baseOpacity}
            strokeLinecap="round"
          />
        </G>
      );

    case 'dashed':
      // Dashed track segment
      return (
        <Line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={3}
          strokeOpacity={baseOpacity}
          strokeLinecap="round"
          strokeDasharray="6, 4"
        />
      );

    case 'dashdot':
      // Alternating dash and dot pulses
      return (
        <Line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={3}
          strokeOpacity={baseOpacity}
          strokeLinecap="round"
          strokeDasharray="8, 4, 1, 4"
        />
      );

    case 'outline':
      // Double rail hollow track (draws thick background underneath, colored borders, and a thin center stripe of background color)
      return (
        <G>
          <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={4.5}
            strokeOpacity={baseOpacity}
            strokeLinecap="round"
          />
          <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#090D16" // Dark core background color
            strokeWidth={2.0}
            strokeOpacity={baseOpacity}
            strokeLinecap="round"
          />
        </G>
      );

    case 'solid':
    default:
      // Simple plain solid line
      return (
        <Line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={3}
          strokeOpacity={baseOpacity}
          strokeLinecap="round"
        />
      );
  }
};
