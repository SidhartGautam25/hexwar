import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaperSession } from '../hooks/usePaperSession';
import { GAME_THEMES, GameTheme } from '../constants/theme';
import { GridCanvas } from '../components/canvas/GridCanvas';
import { TokenPicker } from '../components/ui/TokenPicker';
import { Direction } from '../types/game';
import { parseCharacterLoadout } from '../constants/characters';
import { PLAYER_COLORS } from '../constants/gameColors';
import { CollectionPopup } from '../components/ui/CollectionPopup';
import { formatWalletSummary } from '../utils/wallet';
import { GRID_CONFIG } from '../constants/board';
import {
  getLevelById,
  getPlayerLoadoutForLevel,
  getBotLoadoutForLevel,
  getBoardObstaclesForLevel,
  getBotDelayForLevel,
} from '../constants/levels';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    levelId?: string;
    difficulty?: string;
    themeId?: string;
    killEffect?: string;
    lines?: string;
    p1DotColor?: string;
    p1LineColor?: string;
    p2DotColor?: string;
    p2LineColor?: string;
    characters?: string;
  }>();
  const insets = useSafeAreaInsets();
  
  // Declarative Level Setup
  const levelNum = params.levelId ? parseInt(params.levelId, 10) : 1;
  const activeLevel = getLevelById(isNaN(levelNum) ? 1 : levelNum);

  // Difficulty is decided declaratively from level config, with param override if provided
  const difficulty = (params.difficulty === 'easy' || params.difficulty === 'medium' || params.difficulty === 'hard')
    ? params.difficulty
    : activeLevel.difficulty;

  const themeId = params.themeId || 'cyber-neon';
  const killEffect = (params.killEffect === 'collapse' || params.killEffect === 'explode' || params.killEffect === 'dissolve' || params.killEffect === 'monster' || params.killEffect === 'hammer' || params.killEffect === 'burn' || params.killEffect === 'firecracker')
    ? params.killEffect
    : 'collapse';

  // Find theme details
  const activeTheme = GAME_THEMES.find((t) => t.id === themeId) || GAME_THEMES[0];
  const themeColors = activeTheme.colors;

  // Custom Colors
  const p1DotColor = params.p1DotColor || themeColors.p1Shades[0] || PLAYER_COLORS.P1.body;
  const p1LineColor = params.p1LineColor || themeColors.p1Shades[1] || PLAYER_COLORS.P1.accent;
  const p2DotColor = params.p2DotColor || themeColors.p2Shades[0] || PLAYER_COLORS.P2.body;
  const p2LineColor = params.p2LineColor || themeColors.p2Shades[1] || PLAYER_COLORS.P2.accent;

  // Custom Lines & Loadouts
  const selectedLines = params.lines ? params.lines.split(',') : ['solid', 'dotted', 'glow'];
  const characterLoadout = params.characters
    ? parseCharacterLoadout(params.characters)
    : getPlayerLoadoutForLevel(activeLevel);
  const botLoadout = getBotLoadoutForLevel(activeLevel);
  const boardObstacles = getBoardObstaclesForLevel(activeLevel);
  const botDelayMs = getBotDelayForLevel(activeLevel);

  // Layout Measurement state for percentage-wise dynamic allocation
  const [boardLayout, setBoardLayout] = useState<{ width: number; height: number } | null>(null);

  // Initialize session with declarative level configs
  const {
    dots,
    player1Tokens,
    player2Tokens,
    activePlayer,
    winner,
    historyLogs,
    currencyRegions,
    boardFeatures,
    matchEarnings,
    selectedDotId,
    selectedToken,
    selectedDirection,
    activeNotification,
    dismissNotification,
    selectDot,
    selectTreeHead,
    selectToken,
    selectDirection,
    executeMove,
    resetGame,
    capturedHexes,
    p1CapturedCount,
    p2CapturedCount,
    p1Percent,
    p2Percent,
    totalPlayableHexes,
  } = usePaperSession(difficulty, characterLoadout, botLoadout, boardObstacles, botDelayMs);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (winner) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
    }
  }, [winner]);

  const handleExecute = (dir: Direction, dotId: string) => {
    setErrorMsg(null);
    const result = executeMove(dir, dotId);
    if (!result.success && result.error) {
      setErrorMsg(result.error);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const isThreeButtonNav = insets.bottom >= 30;

  return (
    <View style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* Top Status Bar Spacer */}
      <View style={{ height: Math.max(insets.top, 8) + 12, backgroundColor: themeColors.background, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 12 }}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={[styles.backText, { color: themeColors.textSecondary }]}>←</Text>
        </TouchableOpacity>
      </View>
      <StatusBar
        barStyle={activeTheme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.cardBackground}
      />
      
      <View style={styles.flexContainer}>
        {/* Header HUD Section */}
        <View style={styles.hudSection}>
          <TokenPicker
            tokens={player2Tokens}
            selectedToken={null}
            onSelectToken={() => {}}
            themeColors={themeColors}
            interactive={false}
          />

          {/* Territory Control Bar */}
          <View style={styles.territoryBarContainer}>
            <View style={styles.territoryLabelsRow}>
              <Text style={[styles.territoryLabel, { color: p1DotColor }]}>
                Player: {p1Percent}% ({p1CapturedCount})
              </Text>
              <Text style={[styles.territoryGoal, { color: themeColors.textSecondary }]}>
                Goal: 50%
              </Text>
              <Text style={[styles.territoryLabel, { color: p2DotColor }]}>
                Bot: {p2Percent}% ({p2CapturedCount})
              </Text>
            </View>
            <View style={[styles.territoryTrack, { backgroundColor: '#1E293B' }]}>
              <View
                style={[
                  styles.territoryFillP1,
                  { width: `${Math.min(100, p1Percent * 2)}%`, backgroundColor: p1DotColor },
                ]}
              />
              <View style={styles.territoryMidline} />
              <View
                style={[
                  styles.territoryFillP2,
                  { width: `${Math.min(100, p2Percent * 2)}%`, backgroundColor: p2DotColor },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Board Canvas Section with dynamic measurement */}
        <View 
          style={styles.boardSection}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setBoardLayout({ width, height });
          }}
        >
          {errorMsg && (
            <View style={[styles.errorBanner, { borderColor: '#EF4444', backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {boardLayout && (
            <GridCanvas
              dots={dots}
              activePlayer={activePlayer}
              selectedDotId={selectedDotId}
              selectedToken={selectedToken}
              selectedDirection={selectedDirection}
              onSelectDot={selectDot}
              onSelectTreeHead={selectTreeHead}
              themeColors={themeColors}
              killEffect={killEffect}
              onSelectDirection={selectDirection}
              onGestureEnd={handleExecute}
              p1DotColor={p1DotColor}
              p1LineColor={p1LineColor}
              p2DotColor={p2DotColor}
              p2LineColor={p2LineColor}
              selectedLines={selectedLines}
              characterLoadout={characterLoadout}
              currencyRegions={currencyRegions}
              boardFeatures={boardFeatures}
              boardObstacles={boardObstacles}
              capturedHexes={capturedHexes}
              maxHeight={boardLayout.height}
              maxWidth={boardLayout.width}
            />
          )}
        </View>

        {/* Bottom Panel Section */}
        <View style={[styles.bottomSection, { marginBottom: isThreeButtonNav ? 4 : Math.max(insets.bottom, 8) }]}>


          <TokenPicker
            tokens={player1Tokens}
            selectedToken={selectedToken}
            onSelectToken={selectToken}
            themeColors={{
              ...themeColors,
              player1Ink: p1DotColor,
              player1InkLight: p1DotColor + '33',
            }}
            disabled={activePlayer !== 1 || !!winner}
          />
        </View>
      </View>

      <CollectionPopup
        notification={activeNotification}
        themeColors={themeColors}
        onDismiss={dismissNotification}
      />

      {/* Winner Overlay Popup */}
      {winner && (
        <View style={[StyleSheet.absoluteFill, styles.overlayContainer]}>
          <Animated.View
            style={[
              styles.overlayCard,
              {
                backgroundColor: themeColors.cardBackground + 'FB',
                borderColor: themeColors.border,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={[styles.overlaySubtitle, { color: themeColors.textSecondary }]}>
              {activeLevel.name} • {activeLevel.title}
            </Text>
            <Text style={[styles.overlayTitle, { color: winner === 1 ? themeColors.p1Shades[0] : '#EF4444' }]}>
              {winner === 1 ? '🎉 VICTORY' : '💀 DEFEAT'}
            </Text>
            <Text style={[styles.overlayDesc, { color: themeColors.textSecondary }]}>
              {winner === 1
                ? p1Percent >= 50
                  ? 'Victory by Territory! You captured 50%+ of the grid!'
                  : 'Victory! All opponent units eliminated.'
                : p2Percent >= 50
                ? 'Defeat. Bot captured 50%+ of the grid territory.'
                : 'Defeat. All of your units were eliminated.'}
            </Text>

            <View style={[styles.overlayScores, { borderColor: themeColors.border }]}>
              <Text style={[styles.scoreTitle, { color: themeColors.textPrimary }]}>Territory Control</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: p1DotColor }]}>Player Territory:</Text>
                <Text style={[styles.scoreValue, { color: themeColors.textPrimary }]}>
                  {p1Percent}% ({p1CapturedCount} / {totalPlayableHexes})
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: p2DotColor }]}>Bot Territory:</Text>
                <Text style={[styles.scoreValue, { color: themeColors.textPrimary }]}>
                  {p2Percent}% ({p2CapturedCount} / {totalPlayableHexes})
                </Text>
              </View>

              <Text style={[styles.scoreTitle, { color: themeColors.textPrimary, marginTop: 10 }]}>Units Alive</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: themeColors.p1Shades[0] }]}>Player Units:</Text>
                <Text style={[styles.scoreValue, { color: themeColors.textPrimary }]}>
                  {dots.filter((d) => d.player === 1 && d.isAlive).length} / 3
                </Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: themeColors.p2Shades[0] }]}>Bot Units:</Text>
                <Text style={[styles.scoreValue, { color: themeColors.textPrimary }]}>
                  {dots.filter((d) => d.player === 2 && d.isAlive).length} / 3
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.overlayButton, { backgroundColor: themeColors.accent }]}
              onPress={resetGame}
              activeOpacity={0.8}
            >
              <Text style={styles.overlayButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.overlayButtonSecondary, { borderColor: themeColors.border }]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Text style={[styles.overlayButtonSecondaryText, { color: themeColors.textPrimary }]}>Level Select</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
      {Platform.OS === 'android' && isThreeButtonNav && (
        <View style={{ height: insets.bottom, backgroundColor: '#000000', width: '100%' }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
    width: '100%',
  },
  hudSection: {
    width: '100%',
    flexShrink: 0,
  },
  boardSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'stretch',
    position: 'relative',
  },
  bottomSection: {
    width: '100%',
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 8,
    zIndex: 999,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    width: '90%',
    alignItems: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    bottom: 0,
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    fontWeight: '700',
  },
  controlCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  thinkingCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  padWrapper: {
    marginTop: 12,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  overlayCard: {
    width: '88%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
  },
  overlaySubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  overlayTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  overlayDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  overlayScores: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  scoreTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  overlayButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  overlayButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  overlayButtonSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  overlayButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  territoryBarContainer: {
    width: '100%',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
  },
  territoryLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  territoryLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  territoryGoal: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  territoryTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  territoryFillP1: {
    height: '100%',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  territoryMidline: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    marginLeft: -1,
  },
  territoryFillP2: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  unitSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  unitBadge: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
