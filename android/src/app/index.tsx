import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_THEMES } from '../constants/theme';
import { LEVELS, getBoardObstaclesForLevel } from '../constants/levels';
import { getCharacter } from '../constants/characters';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentTheme = GAME_THEMES[0]; // Cyber neon theme default

  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);

  const selectedLevel = LEVELS.find((l) => l.id === selectedLevelId) || LEVELS[0];

  const handlePlayGame = () => {
    router.push({
      pathname: '/game',
      params: {
        levelId: String(selectedLevelId),
      },
    });
  };

  const isThreeButtonNav = insets.bottom >= 30;

  return (
    <View style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentTheme.colors.background} />
      
      {/* Top Status Bar Spacer */}
      <View style={{ height: insets.top, backgroundColor: currentTheme.colors.background }} />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: isThreeButtonNav ? 24 : Math.max(insets.bottom, 16) }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Game Logo Header */}
        <View style={styles.logoContainer}>
          <Svg width={80} height={80} viewBox="0 0 80 80">
            {/* Background circular radar grid */}
            <Circle cx={40} cy={40} r={38} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <Circle cx={40} cy={40} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <Circle cx={40} cy={40} r={14} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            {/* Clashing Vectors */}
            <Line x1={20} y1={60} x2={50} y2={30} stroke={currentTheme.colors.p1Shades[0]} strokeWidth={3} strokeLinecap="round" />
            <Line x1={60} y1={60} x2={30} y2={30} stroke={currentTheme.colors.p2Shades[0]} strokeWidth={3} strokeLinecap="round" />
            {/* Glowing nodes */}
            <Circle cx={20} cy={60} r={5} fill={currentTheme.colors.p1Shades[1]} />
            <Circle cx={50} cy={30} r={6} fill={currentTheme.colors.p1Shades[2]} />
            <Circle cx={60} cy={60} r={5} fill={currentTheme.colors.p2Shades[1]} />
            <Circle cx={30} cy={30} r={6} fill={currentTheme.colors.p2Shades[2]} />
          </Svg>
          
          <Text style={[styles.appTitle, { color: currentTheme.colors.textPrimary }]}>
            HEX WAR
          </Text>
          <Text style={[styles.appSubtitle, { color: currentTheme.colors.textSecondary }]}>
            Hexagonal Territory Warfare
          </Text>
        </View>

        {/* Declarative Level Selection Section */}
        <View style={styles.levelsSection}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            SELECT LEVEL
          </Text>

          {LEVELS.map((level) => {
            const isSelected = selectedLevelId === level.id;
            const diffColor =
              level.difficulty === 'easy'
                ? '#10B981'
                : level.difficulty === 'medium'
                ? '#F59E0B'
                : '#EF4444';

            const obstacles = getBoardObstaclesForLevel(level);

            const dotUnits = [
              level.dots.dot1,
              level.dots.dot2,
              level.dots.dot3,
            ];

            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelCard,
                  {
                    backgroundColor: isSelected
                      ? currentTheme.colors.cardBackground
                      : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isSelected
                      ? currentTheme.colors.accent
                      : currentTheme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedLevelId(level.id)}
                activeOpacity={0.75}
              >
                <View style={styles.levelHeaderRow}>
                  <View style={styles.levelTitleGroup}>
                    <Text
                      style={[
                        styles.levelName,
                        { color: isSelected ? currentTheme.colors.accent : currentTheme.colors.textPrimary },
                      ]}
                    >
                      {level.name}
                    </Text>
                    <Text style={[styles.levelTitle, { color: currentTheme.colors.textSecondary }]}>
                      {level.title}
                    </Text>
                  </View>

                  <View style={styles.badgeRow}>
                    {obstacles.blackBoxes.length > 0 && (
                      <View style={styles.obsBadge}>
                        <Text style={styles.obsText}>⬛ {obstacles.blackBoxes.length}</Text>
                      </View>
                    )}
                    <View style={[styles.diffBadge, { backgroundColor: diffColor + '22', borderColor: diffColor }]}>
                      <Text style={[styles.diffText, { color: diffColor }]}>
                        {level.difficulty.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Dots Loadout preview for this level */}
                <View style={styles.dotsPreviewRow}>
                  <Text style={[styles.dotsPreviewLabel, { color: currentTheme.colors.textSecondary }]}>
                    Dots:
                  </Text>
                  <View style={styles.dotsBadgeContainer}>
                    {dotUnits.map((charId, idx) => {
                      const charDef = getCharacter(charId);
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.dotPill,
                            {
                              backgroundColor: isSelected
                                ? currentTheme.colors.accent + '22'
                                : 'rgba(255, 255, 255, 0.06)',
                              borderColor: isSelected
                                ? currentTheme.colors.accent + '55'
                                : 'rgba(255, 255, 255, 0.12)',
                            },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {charDef.avatar && (
                              <Image
                                source={charDef.avatar}
                                style={{ width: 14, height: 14, marginRight: 4 }}
                                resizeMode="contain"
                              />
                            )}
                            <Text
                              style={[
                                styles.dotPillText,
                                {
                                  color: isSelected
                                    ? currentTheme.colors.accent
                                    : currentTheme.colors.textPrimary,
                                },
                              ]}
                            >
                              {charDef.name}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Primary Play Button */}
        <View style={styles.playButtonContainer}>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: currentTheme.colors.accent }]}
            onPress={handlePlayGame}
            activeOpacity={0.8}
          >
            <Text style={styles.playButtonText}>
              START {selectedLevel.name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Utility row for stats and rules */}
        <View style={styles.utilityRow}>
          <TouchableOpacity
            style={[styles.utilityButton, { borderColor: currentTheme.colors.border }]}
            onPress={() => router.push('/rules' as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.utilityButtonText, { color: currentTheme.colors.textPrimary }]}>
              📖 Rules & Guide
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.utilityButton, { borderColor: currentTheme.colors.border }]}
            onPress={() => router.push('/history' as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.utilityButtonText, { color: currentTheme.colors.textPrimary }]}>
              📊 Stats & History
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  levelsSection: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  levelCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 3,
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelTitleGroup: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  levelTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  obsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  obsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5E7EB',
    letterSpacing: 0.5,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dotsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  dotsPreviewLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotsBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  dotPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dotPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  playButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  playButton: {
    borderRadius: 16,
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  utilityButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  utilityButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
