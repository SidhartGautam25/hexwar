import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayerWallet } from '../../types/game';

interface TreasuryBarProps {
  matchEarnings: PlayerWallet;
  themeColors: {
    cardBackground: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
  };
}

export const TreasuryBar: React.FC<TreasuryBarProps> = ({ matchEarnings, themeColors }) => {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.cardBackground, borderColor: themeColors.border },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.title, { color: themeColors.textSecondary }]}>TREASURY:</Text>
        <View style={styles.item}>
          <Text style={styles.value}>🪙 <Text style={{ color: '#FFB900' }}>{matchEarnings.gold}</Text></Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>🥈 <Text style={{ color: '#C8C8C8' }}>{matchEarnings.silver}</Text></Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>💵 <Text style={{ color: '#4ADE80' }}>{matchEarnings.money}</Text></Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 12,
    fontWeight: '900',
  },
});
