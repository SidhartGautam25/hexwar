import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TokenPool } from '../../types/game';
import { isFreePlay } from '../../utils/tokenPool';

interface TokenPickerProps {
  tokens: TokenPool;
  selectedToken: number | null;
  onSelectToken: (value: number) => void;
  themeColors: any;
  disabled?: boolean;
  /** Bot row shows the same cards but does not accept a tap. */
  interactive?: boolean;
}

const CARD_COLORS = ['#3B82F6', '#22C55E', '#F5C445', '#8B5CF6', '#F43F5E', '#14B8A6'];

function hexPath(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((-90 + 60 * i) * Math.PI) / 180;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

/** Small hex clusters, one shape per distance token. */
function TokenGlyph({ value }: { value: number }) {
  const r = value >= 6 ? 3.6 : 4.4;
  const dx = r * 1.72;
  const dy = r * 1.5;
  const layouts: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-dx / 2, 0], [dx / 2, 0]],
    3: [[0, -dy * 0.55], [-dx / 2, dy * 0.45], [dx / 2, dy * 0.45]],
    4: [[0, -dy], [-dx / 2, 0], [dx / 2, 0], [0, dy]],
    5: [[0, -dy], [-dx, 0], [0, 0], [dx, 0], [0, dy]],
    6: [
      [-dx, -dy * 0.45],
      [0, -dy * 0.45],
      [dx, -dy * 0.45],
      [-dx / 2, dy * 0.55],
      [dx / 2, dy * 0.55],
      [dx * 1.5, dy * 0.55],
    ],
  };
  const spots = layouts[value] || layouts[1];
  return (
    <Svg width={46} height={36} viewBox="-23 -18 46 36">
      {spots.map(([x, y], index) => (
        <Path
          key={`${value}_${index}`}
          d={hexPath(x, y, r)}
          fill="#F8FAFC"
          stroke="#1F2937"
          strokeWidth={1.1}
        />
      ))}
    </Svg>
  );
}

export const TokenPicker: React.FC<TokenPickerProps> = ({
  tokens,
  selectedToken,
  onSelectToken,
  disabled = false,
  interactive = true,
}) => {
  const freePlay = isFreePlay(tokens);
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5, 6].map((value) => {
        const count = tokens[value] || 0;
        const unlimited = freePlay && value <= 3;
        const isSelected = interactive && selectedToken === value;
        const isDisabled = !interactive || (!unlimited && count === 0) || disabled;
        const color = CARD_COLORS[value - 1];

        return (
          <TouchableOpacity
            key={`token_${value}`}
            disabled={isDisabled}
            style={[
              styles.card,
              {
                backgroundColor: color,
                borderColor: isSelected ? '#FFFFFF' : '#111827',
                borderWidth: isSelected ? 3 : 2,
                opacity: !interactive ? 1 : isDisabled ? 0.38 : 1,
              },
            ]}
            onPress={() => onSelectToken(value)}
            activeOpacity={0.75}
          >
            <Text style={styles.value}>{value}</Text>
            <TokenGlyph value={value} />
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color }]}>{unlimited ? '∞' : count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 4,
  },
  card: {
    flex: 1,
    marginHorizontal: 3,
    height: 74,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  value: {
    position: 'absolute',
    top: 3,
    left: 6,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    bottom: -9,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
