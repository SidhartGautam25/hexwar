import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Direction } from '../../types/game';

interface DirectionPadProps {
  selectedDirection: Direction | null;
  onSelectDirection: (dir: Direction) => void;
  themeColors: any;
}

const HEX_PAD: { dir: Direction; label: string; angle: number }[] = [
  { dir: 'E', label: '→', angle: 0 },
  { dir: 'SE', label: '↘', angle: 60 },
  { dir: 'SW', label: '↙', angle: 120 },
  { dir: 'W', label: '←', angle: 180 },
  { dir: 'NW', label: '↖', angle: 240 },
  { dir: 'NE', label: '↗', angle: 300 },
];

export const DirectionPad: React.FC<DirectionPadProps> = ({
  selectedDirection,
  onSelectDirection,
  themeColors,
}) => {
  const size = 168;
  const button = 46;
  const radius = 54;

  return (
    <View style={[styles.container, { borderColor: themeColors.border, width: size, height: size }]}>
      <View
        style={[
          styles.center,
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: themeColors.cardBackground,
            left: (size - 36) / 2,
            top: (size - 36) / 2,
          },
        ]}
      >
        <Text style={[styles.centerText, { color: themeColors.gridDot }]}>⬡</Text>
      </View>
      {HEX_PAD.map((item) => {
        const rad = (item.angle * Math.PI) / 180;
        const left = size / 2 + Math.cos(rad) * radius - button / 2;
        const top = size / 2 + Math.sin(rad) * radius - button / 2;
        const isSelected = selectedDirection === item.dir;
        return (
          <TouchableOpacity
            key={item.dir}
            style={[
              styles.cell,
              {
                width: button,
                height: button,
                borderRadius: button / 2,
                left,
                top,
                backgroundColor: isSelected ? themeColors.player1Ink : themeColors.cardBackground,
                borderColor: themeColors.border,
              },
            ]}
            onPress={() => onSelectDirection(item.dir)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.arrowText,
                {
                  color: isSelected ? '#FFFFFF' : themeColors.textPrimary,
                  fontWeight: isSelected ? '700' : 'normal',
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 90,
    alignSelf: 'center',
    backgroundColor: '#F4F7FB',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 1,
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  centerText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
