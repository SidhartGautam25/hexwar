import React from 'react';
import { G, Circle, Path, Rect, Line } from 'react-native-svg';

interface GlyphProps {
  cx: number;
  cy: number;
  size: number;
}

/** Gold coin — embossed disc with star. */
export const GoldCoinGlyph: React.FC<GlyphProps> = ({ cx, cy, size }) => {
  const r = size * 0.36;
  const sw = Math.max(0.8, size * 0.035);
  return (
    <G opacity={0.72}>
      <Circle cx={cx} cy={cy + size * 0.02} r={r} fill="#6B4E12" opacity={0.25} />
      <Circle cx={cx} cy={cy} r={r} fill="#A67C2A" stroke="#7A5C1E" strokeWidth={sw} />
      <Circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke="#C9A84C" strokeWidth={sw * 0.7} opacity={0.7} />
      <Path
        d={`M ${cx} ${cy - r * 0.42} L ${cx + r * 0.1} ${cy - r * 0.12} L ${cx + r * 0.4} ${cy - r * 0.12} L ${cx + r * 0.16} ${cy + r * 0.06} L ${cx + r * 0.26} ${cy + r * 0.4} L ${cx} ${cy + r * 0.2} L ${cx - r * 0.26} ${cy + r * 0.4} L ${cx - r * 0.16} ${cy + r * 0.06} L ${cx - r * 0.4} ${cy - r * 0.12} L ${cx - r * 0.1} ${cy - r * 0.12} Z`}
        fill="#C9A84C"
        fillOpacity={0.65}
        stroke="#7A5C1E"
        strokeWidth={sw * 0.4}
      />
    </G>
  );
};

/** Silver coin — cool metallic disc with inner ring. */
export const SilverCoinGlyph: React.FC<GlyphProps> = ({ cx, cy, size }) => {
  const r = size * 0.36;
  const sw = Math.max(0.8, size * 0.035);
  return (
    <G opacity={0.72}>
      <Circle cx={cx} cy={cy + size * 0.02} r={r} fill="#475569" opacity={0.2} />
      <Circle cx={cx} cy={cy} r={r} fill="#94A3B8" stroke="#64748B" strokeWidth={sw} />
      <Circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke="#B8C4D4" strokeWidth={sw * 0.65} opacity={0.65} />
      <Circle cx={cx} cy={cy} r={r * 0.38} fill="none" stroke="#94A3B8" strokeWidth={sw * 0.55} opacity={0.6} />
      <Line
        x1={cx - r * 0.55}
        y1={cy - r * 0.2}
        x2={cx + r * 0.55}
        y2={cy - r * 0.2}
        stroke="#64748B"
        strokeWidth={sw * 0.5}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Line
        x1={cx - r * 0.55}
        y1={cy + r * 0.2}
        x2={cx + r * 0.55}
        y2={cy + r * 0.2}
        stroke="#64748B"
        strokeWidth={sw * 0.5}
        strokeLinecap="round"
        opacity={0.7}
      />
    </G>
  );
};

/** Standard coin stack — two green coins. */
export const MoneyCoinGlyph: React.FC<GlyphProps> = ({ cx, cy, size }) => {
  const r = size * 0.3;
  const sw = Math.max(0.7, size * 0.03);
  const offset = size * 0.1;
  const drawCoin = (ox: number, oy: number, fill: string, stroke: string) => (
    <G>
      <Circle cx={cx + ox} cy={cy + oy + size * 0.015} r={r} fill="#14532D" opacity={0.18} />
      <Circle cx={cx + ox} cy={cy + oy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />
      <Path
        d={`M ${cx + ox - r * 0.22} ${cy + oy + r * 0.05} Q ${cx + ox} ${cy + oy - r * 0.32} ${cx + ox + r * 0.22} ${cy + oy + r * 0.05} Q ${cx + ox} ${cy + oy + r * 0.28} ${cx + ox - r * 0.22} ${cy + oy + r * 0.05} Z`}
        fill="none"
        stroke="#5A9E72"
        strokeWidth={sw * 0.65}
        opacity={0.55}
      />
    </G>
  );
  return (
    <G opacity={0.72}>
      {drawCoin(-offset, offset, '#2D6B47', '#1F4D32')}
      {drawCoin(offset, -offset, '#3D8F5F', '#2D6B47')}
    </G>
  );
};

/** Sanctuary shield. */
export const ShieldGlyph: React.FC<GlyphProps> = ({ cx, cy, size }) => {
  const h = size * 0.42;
  const w = size * 0.34;
  const sw = Math.max(0.8, size * 0.035);
  return (
    <G>
      <Path
        d={`M ${cx} ${cy - h} L ${cx + w} ${cy - h * 0.55} L ${cx + w} ${cy + h * 0.15} Q ${cx} ${cy + h * 0.95} ${cx - w} ${cy + h * 0.15} L ${cx - w} ${cy - h * 0.55} Z`}
        fill="#38BDF8"
        fillOpacity={0.35}
        stroke="#0EA5E9"
        strokeWidth={sw}
      />
      <Path
        d={`M ${cx} ${cy - h * 0.72} L ${cx + w * 0.55} ${cy - h * 0.38} L ${cx + w * 0.55} ${cy + h * 0.05} Q ${cx} ${cy + h * 0.62} ${cx - w * 0.55} ${cy + h * 0.05} L ${cx - w * 0.55} ${cy - h * 0.38} Z`}
        fill="none"
        stroke="#BAE6FD"
        strokeWidth={sw * 0.55}
      />
    </G>
  );
};

/** Trail purge — danger erase node. */
export const TrailEraseGlyph: React.FC<GlyphProps> = ({ cx, cy, size }) => {
  const sw = Math.max(0.8, size * 0.035);
  const r = size * 0.22;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r * 1.15} fill="#7F1D1D" opacity={0.35} />
      <Circle cx={cx} cy={cy - r * 0.15} r={r} fill="#EF4444" stroke="#B91C1C" strokeWidth={sw} />
      <Circle cx={cx - r * 0.35} cy={cy - r * 0.2} r={r * 0.18} fill="#450A0A" />
      <Circle cx={cx + r * 0.35} cy={cy - r * 0.2} r={r * 0.18} fill="#450A0A" />
      <Path
        d={`M ${cx - r * 0.45} ${cy + r * 0.35} Q ${cx} ${cy + r * 0.65} ${cx + r * 0.45} ${cy + r * 0.35}`}
        fill="none"
        stroke="#450A0A"
        strokeWidth={sw * 0.8}
        strokeLinecap="round"
      />
      <Line
        x1={cx - r * 0.55}
        y1={cy + r * 0.75}
        x2={cx + r * 0.55}
        y2={cy + r * 0.75}
        stroke="#FCA5A5"
        strokeWidth={sw * 0.7}
        strokeDasharray={`${size * 0.06},${size * 0.05}`}
        strokeLinecap="round"
      />
    </G>
  );
};

/** Forced lock — padlock. */
export const LockGlyph: React.FC<GlyphProps> = ({ cx, cy, size }) => {
  const sw = Math.max(0.8, size * 0.035);
  const bw = size * 0.3;
  const bh = size * 0.24;
  const sh = size * 0.2;
  return (
    <G>
      <Path
        d={`M ${cx - bw * 0.55} ${cy - bh * 0.2} V ${cy - bh * 0.2 - sh} A ${bw * 0.55} ${sh} 0 0 1 ${cx + bw * 0.55} ${cy - bh * 0.2 - sh} V ${cy - bh * 0.2}`}
        fill="none"
        stroke="#FCA5A5"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Rect
        x={cx - bw}
        y={cy - bh * 0.15}
        width={bw * 2}
        height={bh * 1.4}
        rx={size * 0.05}
        fill="#EF4444"
        fillOpacity={0.85}
        stroke="#B91C1C"
        strokeWidth={sw}
      />
      <Circle cx={cx} cy={cy + bh * 0.25} r={size * 0.045} fill="#FEE2E2" />
    </G>
  );
};
