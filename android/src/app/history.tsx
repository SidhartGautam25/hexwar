import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_THEMES } from '../constants/theme';
import { getStats, resetStats, GameStats } from '../utils/stats';
import { getWallet, formatWalletSummary } from '../utils/wallet';
import { PlayerWallet } from '../types/game';
import { getMatchHistory } from '../utils/matchHistory';
import { MatchRecord } from '../types/history';
import { getCharacter } from '../constants/characters';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = GAME_THEMES[0];
  const colors = theme.colors;

  const [stats, setStats] = useState<GameStats>({ gamesPlayed: 0, wins: 0, losses: 0 });
  const [wallet, setWallet] = useState<PlayerWallet>({ gold: 0, silver: 0, money: 0 });
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  const loadData = async () => {
    const [loadedStats, loadedWallet, loadedMatches] = await Promise.all([
      getStats(),
      getWallet(),
      getMatchHistory(),
    ]);
    setStats(loadedStats);
    setWallet(loadedWallet);
    setMatches(loadedMatches);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = async () => {
    await resetStats();
    await loadData();
  };

  const winRatio = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const isThreeButtonNav = insets.bottom >= 30;
  const isShortScreen = Dimensions.get('window').height < 750;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={{ height: insets.top, backgroundColor: colors.background }} />

      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.border + '22' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Stats & History</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isThreeButtonNav ? 20 : Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>Your Treasury</Text>
          <Text style={[styles.walletText, { color: colors.accent }]}>{formatWalletSummary(wallet)}</Text>
          <Text style={[styles.walletHint, { color: colors.textSecondary }]}>
            Saved on device — persists until app is uninstalled
          </Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>Performance Overview</Text>

          <View style={styles.statGroup}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.gamesPlayed}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Matches</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.p1Shades[0] }]}>{winRatio}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Win Rate</Text>
            </View>
          </View>

          <View style={[styles.horizontalDivider, { backgroundColor: colors.border }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Victories:</Text>
            <Text style={[styles.detailValue, { color: colors.p1Shades[0] }]}>{stats.wins} Wins</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Defeats:</Text>
            <Text style={[styles.detailValue, { color: '#EF4444' }]}>{stats.losses} Losses</Text>
          </View>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>Match History</Text>
          {matches.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No matches recorded yet. Play a game to build your history!
            </Text>
          ) : (
            matches.slice(0, 20).map((match) => (
              <View
                key={match.id}
                style={[styles.matchRow, { borderColor: colors.border }]}
              >
                <View style={styles.matchHeader}>
                  <Text style={[styles.matchResult, { color: match.winner === 1 ? colors.p1Shades[0] : '#EF4444' }]}>
                    {match.winner === 1 ? 'Victory' : 'Defeat'}
                  </Text>
                  <Text style={[styles.matchDate, { color: colors.textSecondary }]}>
                    {formatDate(match.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.matchDetail, { color: colors.textSecondary }]}>
                  {match.difficulty} · {match.moveCount} moves · {formatWalletSummary(match.earnings)}
                </Text>
                <Text style={[styles.matchChars, { color: colors.textPrimary }]}>
                  {match.characterIds.map((id) => getCharacter(id).name).join(' · ')}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.resetButton, { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetText}>Reset Win/Loss Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: colors.accent }]}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {Platform.OS === 'android' && isThreeButtonNav && (
        <View style={{ height: insets.bottom, backgroundColor: '#000000', width: '100%' }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Dimensions.get('window').height < 750 ? 10 : 16,
    borderBottomWidth: 1.5,
  },
  backButton: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: Dimensions.get('window').height < 750 ? 12 : 16,
    paddingVertical: Dimensions.get('window').height < 750 ? 6 : 8,
  },
  backText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    padding: Dimensions.get('window').height < 750 ? 12 : 20,
  },
  statsCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: Dimensions.get('window').height < 750 ? 16 : 24,
    marginBottom: Dimensions.get('window').height < 750 ? 12 : 16,
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  walletText: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  walletHint: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: Dimensions.get('window').height < 750 ? 28 : 36,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    width: 1.5,
    height: Dimensions.get('window').height < 750 ? 36 : 48,
  },
  horizontalDivider: {
    width: '100%',
    height: 1,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  detailLabel: { fontSize: 14, fontWeight: '600' },
  detailValue: { fontSize: 14, fontWeight: '800' },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingVertical: 12,
  },
  matchRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matchResult: { fontSize: 14, fontWeight: '800' },
  matchDate: { fontSize: 11, fontWeight: '600' },
  matchDetail: { fontSize: 12, marginBottom: 2 },
  matchChars: { fontSize: 12, fontWeight: '700' },
  resetButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 12,
  },
  resetText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  homeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 8,
  },
  homeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
