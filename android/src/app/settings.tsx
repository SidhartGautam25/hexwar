import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_THEMES, KILL_EFFECTS } from '../constants/theme';
import {
  CHARACTER_LIST,
  parseCharacterLoadout,
} from '../constants/characters';
import { CharacterId } from '../types/game';
import { getSavedCharacterLoadout, saveCharacterLoadout } from '../utils/characterConfig';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export default function SettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
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

  const difficulties: { id: 'easy' | 'medium' | 'hard'; label: string; desc: string }[] = [
    { id: 'easy', label: 'Easy', desc: 'Predictable paths. Great for training.' },
    { id: 'medium', label: 'Medium', desc: 'Greedy heuristic. Looks for immediate cuts.' },
    { id: 'hard', label: 'Hard', desc: 'Minimax lookahead. Avoids counter-attacks.' },
  ];

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    (params.difficulty as any) || 'medium'
  );
  const [themeId, setThemeId] = useState<string>(params.themeId || 'cyber-neon');
  const [killEffect, setKillEffect] = useState<'collapse' | 'explode' | 'dissolve' | 'monster' | 'hammer' | 'burn' | 'firecracker'>(
    (params.killEffect as any) || 'collapse'
  );

  const currentTheme = GAME_THEMES.find((t) => t.id === themeId) || GAME_THEMES[0];

  const getThemeDefaultColors = (themeId: string) => {
    switch (themeId) {
      case 'emerald-gold':
        return { p1: '#00FF66', p2: '#FFB900' };
      case 'steel-ember':
        return { p1: '#00F2FF', p2: '#FF2A2A' };
      case 'cosmic-nebula':
        return { p1: '#9B51E0', p2: '#FE53BB' };
      case 'cyber-neon':
      default:
        return { p1: '#00E5FF', p2: '#FF3B6B' };
    }
  };

  // Custom Colors States
  const [p1DotColor, setP1DotColor] = useState<string>(() => {
    if (params.p1DotColor) return params.p1DotColor;
    return getThemeDefaultColors(params.themeId || 'cyber-neon').p1;
  });
  const [p1LineColor, setP1LineColor] = useState<string>(() => {
    if (params.p1LineColor) return params.p1LineColor;
    return getThemeDefaultColors(params.themeId || 'cyber-neon').p1;
  });
  const [p2DotColor, setP2DotColor] = useState<string>(() => {
    if (params.p2DotColor) return params.p2DotColor;
    return getThemeDefaultColors(params.themeId || 'cyber-neon').p2;
  });
  const [p2LineColor, setP2LineColor] = useState<string>(() => {
    if (params.p2LineColor) return params.p2LineColor;
    return getThemeDefaultColors(params.themeId || 'cyber-neon').p2;
  });

  // Line Style configurations
  const [selectedLines, setSelectedLines] = useState<string[]>(
    params.lines ? params.lines.split(',') : ['solid', 'dotted', 'glow']
  );

  const [characterLoadout, setCharacterLoadout] = useState<CharacterId[]>(() =>
    parseCharacterLoadout(params.characters)
  );

  useEffect(() => {
    if (!params.characters) {
      getSavedCharacterLoadout().then(setCharacterLoadout);
    }
  }, [params.characters]);

  const setSlotCharacter = (slot: number, charId: CharacterId) => {
    setCharacterLoadout((prev) => {
      const next: CharacterId[] = [...prev];
      next[slot] = charId;
      return next;
    });
  };

  const COLOR_PALETTE = [
    { value: '#00E5FF', label: 'Electric Blue' },
    { value: '#FF3B6B', label: 'Neon Red' },
    { value: '#00FF66', label: 'Green' },
    { value: '#FFB900', label: 'Gold' },
    { value: '#FF2A2A', label: 'Red' },
    { value: '#9B51E0', label: 'Purple' },
  ];

  const availableLineStyles = [
    { id: 'solid', label: 'Solid Vector', desc: 'Continuous solid neon track' },
    { id: 'dotted', label: 'Micro Dot', desc: 'Dotted spacing trail' },
    { id: 'glow', label: 'Neon Aura', desc: 'Dual-layered outer glow' },
    { id: 'dashed', label: 'Dash Track', desc: 'Segmented dashes guide' },
    { id: 'dashdot', label: 'Pulse Segment', desc: 'Alternating dash and dot pulses' },
    { id: 'outline', label: 'Double Rail', desc: 'Parallel side rails outline' },
  ];

  const getColorLabel = (currentValue: string) => {
    const matched = COLOR_PALETTE.find(c => c.value.toLowerCase() === currentValue.toLowerCase());
    return matched ? matched.label : 'Custom';
  };

  const renderShapePreview = (shapeId: string, color: string) => {
    switch (shapeId) {
      case 'arrow':
        return (
          <Svg width={20} height={20} viewBox="-10 -10 20 20">
            <Path d="M 0,-9 L 8,7 L 0,3 L -8,7 Z" fill={color} />
            <Path d="M 0,-4 L 3,3 L 0,1 L -3,3 Z" fill="#FFFFFF" opacity={0.65} />
          </Svg>
        );
      case 'hexagon':
        return (
          <Svg width={20} height={20} viewBox="-10 -10 20 20">
            <Path d="M 0,-8 L 7,-4 L 7,4 L 0,8 L -7,4 L -7,-4 Z" fill={color} />
            <Path d="M 0,-4 L 3.5,-2 L 3.5,2 L 0,4 L -3.5,2 L -3.5,-2 Z" fill="#FFFFFF" opacity={0.65} />
          </Svg>
        );
      case 'star':
        return (
          <Svg width={20} height={20} viewBox="-10 -10 20 20">
            <Path d="M 0,-9 Q 0,-2 7,0 Q 0,2 0,9 Q 0,2 -7,0 Q 0,-2 0,-9 Z" fill={color} />
            <Circle cx={0} cy={0} r={2} fill="#FFFFFF" opacity={0.65} />
          </Svg>
        );
      case 'circle':
      default:
        return (
          <Svg width={20} height={20} viewBox="-10 -10 20 20">
            <Circle cx={0} cy={0} r={7.8} fill={color} />
            <Circle cx={-1.5} cy={-1.5} r={1.8} fill="#FFFFFF" opacity={0.65} />
          </Svg>
        );
    }
  };

  const handleSelectTheme = (newThemeId: string) => {
    setThemeId(newThemeId);
    const defaults = getThemeDefaultColors(newThemeId);
    setP1DotColor(defaults.p1);
    setP1LineColor(defaults.p1);
    setP2DotColor(defaults.p2);
    setP2LineColor(defaults.p2);
  };

  const handleBack = async () => {
    if (selectedLines.length !== 3) return;
    await saveCharacterLoadout(characterLoadout);
    router.replace({
      pathname: '/',
      params: {
        difficulty,
        themeId,
        killEffect,
        lines: selectedLines.join(','),
        p1DotColor,
        p1LineColor,
        p2DotColor,
        p2LineColor,
        characters: characterLoadout.join(','),
      },
    });
  };

  const isThreeButtonNav = insets.bottom >= 30;
  const isShortScreen = Dimensions.get('window').height < 750;

  return (
    <View style={[styles.safeArea, { backgroundColor: currentTheme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentTheme.colors.background} />
      
      {/* Top Status Bar Spacer */}
      <View style={{ height: insets.top, backgroundColor: currentTheme.colors.background }} />

      {/* Header Row */}
      <View style={[styles.header, { borderBottomColor: currentTheme.colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: currentTheme.colors.border }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: currentTheme.colors.textPrimary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.colors.textPrimary }]}>
          Configurations
        </Text>
        <View style={{ width: 68 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: isThreeButtonNav ? 24 : Math.max(insets.bottom, 16) }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Intelligence Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            Intelligence Level
          </Text>
          {difficulties.map((diff) => {
            const isSelected = difficulty === diff.id;
            return (
              <TouchableOpacity
                key={diff.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: currentTheme.colors.cardBackground,
                    borderColor: isSelected ? currentTheme.colors.accent : currentTheme.colors.border,
                  },
                ]}
                onPress={() => setDifficulty(diff.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? currentTheme.colors.accent : currentTheme.colors.textSecondary,
                        backgroundColor: isSelected ? currentTheme.colors.accent : 'transparent',
                      },
                    ]}
                  />
                  <Text style={[styles.cardTitle, { color: currentTheme.colors.textPrimary }]}>
                    {diff.label}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: currentTheme.colors.textSecondary }]}>
                  {diff.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Character Roster — same 3 for you and bot */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            Character Roster (You & Bot)
          </Text>
          <Text style={[styles.rosterHint, { color: currentTheme.colors.textSecondary }]}>
            Each character defines dot shape and power. Both sides use the same roster.
          </Text>
          {[0, 1, 2].map((slot) => (
            <View key={`slot_${slot}`} style={{ marginBottom: 14 }}>
              <Text style={[styles.slotLabel, { color: currentTheme.colors.textPrimary }]}>
                Dot {slot + 1}
              </Text>
              {CHARACTER_LIST.map((char) => {
                const isSelected = characterLoadout[slot] === char.id;
                return (
                  <TouchableOpacity
                    key={`${slot}_${char.id}`}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: currentTheme.colors.cardBackground,
                        borderColor: isSelected ? char.dotColor : currentTheme.colors.border,
                      },
                    ]}
                    onPress={() => setSlotCharacter(slot as 0 | 1 | 2, char.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      {char.avatar ? (
                        <Image
                          source={char.avatar}
                          style={{ width: 28, height: 28, marginRight: 8 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={{ marginRight: 8 }}>{renderShapePreview(char.shape, char.dotColor)}</View>
                      )}
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected ? char.dotColor : currentTheme.colors.textSecondary,
                            backgroundColor: isSelected ? char.dotColor : 'transparent',
                          },
                        ]}
                      />
                      <Text style={[styles.cardTitle, { color: currentTheme.colors.textPrimary }]}>
                        {char.name} — {char.title}
                      </Text>
                    </View>
                    <Text style={[styles.cardDesc, { color: currentTheme.colors.textSecondary }]}>
                      {char.powerName}: {char.powerDescription}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Grid Aesthetics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            Grid Aesthetics
          </Text>
          {GAME_THEMES.map((theme) => {
            const isSelected = themeId === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: currentTheme.colors.cardBackground,
                    borderColor: isSelected ? currentTheme.colors.accent : currentTheme.colors.border,
                  },
                ]}
                onPress={() => handleSelectTheme(theme.id)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? currentTheme.colors.accent : currentTheme.colors.textSecondary,
                        backgroundColor: isSelected ? currentTheme.colors.accent : 'transparent',
                        marginRight: 10,
                      },
                    ]}
                  />
                  <Text style={[styles.themeName, { color: currentTheme.colors.textPrimary }]}>
                    {theme.name}
                  </Text>
                </View>

                {/* Dot Color Previews */}
                <View style={styles.previewContainer}>
                  <View style={styles.shadeGroup}>
                    {theme.colors.p1Shades.map((shade, i) => (
                      <View key={`p1_${i}`} style={[styles.previewDot, { backgroundColor: shade }]} />
                    ))}
                  </View>
                  <Text style={[styles.vsText, { color: currentTheme.colors.textSecondary }]}>vs</Text>
                  <View style={styles.shadeGroup}>
                    {theme.colors.p2Shades.map((shade, i) => (
                      <View key={`p2_${i}`} style={[styles.previewDot, { backgroundColor: shade }]} />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Elimination Effects */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            Elimination Effect
          </Text>
          {KILL_EFFECTS.map((effect) => {
            const isSelected = killEffect === effect.id;
            return (
              <TouchableOpacity
                key={effect.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: currentTheme.colors.cardBackground,
                    borderColor: isSelected ? currentTheme.colors.accent : currentTheme.colors.border,
                  },
                ]}
                onPress={() => setKillEffect(effect.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? currentTheme.colors.accent : currentTheme.colors.textSecondary,
                        backgroundColor: isSelected ? currentTheme.colors.accent : 'transparent',
                      },
                    ]}
                  />
                  <Text style={[styles.cardTitle, { color: currentTheme.colors.textPrimary }]}>
                    {effect.name}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: currentTheme.colors.textSecondary }]}>
                  {effect.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Color Configurations */}
        <View style={[styles.section, isShortScreen && { marginBottom: 14 }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            Color Adaptations
          </Text>
          <View style={[styles.colorCard, { backgroundColor: currentTheme.colors.cardBackground, borderColor: currentTheme.colors.border }]}>
            
            {/* Player 1 Colors */}
            <Text style={[styles.colorSectionHeader, { color: currentTheme.colors.accent }]}>Your Assets (Player 1)</Text>
            
            <View style={styles.colorSubLabelRow}>
              <Text style={[styles.colorSubLabel, { color: currentTheme.colors.textPrimary }]}>Dot Color</Text>
              <Text style={[styles.colorSelectedValueText, { color: currentTheme.colors.textSecondary }]}>
                {getColorLabel(p1DotColor)}
              </Text>
            </View>
            <View style={styles.paletteRow}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = p1DotColor.toLowerCase() === color.value.toLowerCase();
                return (
                  <TouchableOpacity
                    key={`p1dot_${color.value}`}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      isSelected && { borderColor: '#FFFFFF', borderWidth: 2.5 }
                    ]}
                    onPress={() => setP1DotColor(color.value)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={styles.colorCheckContainer}>
                        <Text style={styles.colorCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.colorSubLabelRow}>
              <Text style={[styles.colorSubLabel, { color: currentTheme.colors.textPrimary }]}>Line Color</Text>
              <Text style={[styles.colorSelectedValueText, { color: currentTheme.colors.textSecondary }]}>
                {getColorLabel(p1LineColor)}
              </Text>
            </View>
            <View style={styles.paletteRow}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = p1LineColor.toLowerCase() === color.value.toLowerCase();
                return (
                  <TouchableOpacity
                    key={`p1line_${color.value}`}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      isSelected && { borderColor: '#FFFFFF', borderWidth: 2.5 }
                    ]}
                    onPress={() => setP1LineColor(color.value)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={styles.colorCheckContainer}>
                        <Text style={styles.colorCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 }} />

            {/* Player 2 Colors */}
            <Text style={[styles.colorSectionHeader, { color: currentTheme.colors.p2Shades[0] }]}>Bot Assets (Player 2)</Text>
            
            <View style={styles.colorSubLabelRow}>
              <Text style={[styles.colorSubLabel, { color: currentTheme.colors.textPrimary }]}>Dot Color</Text>
              <Text style={[styles.colorSelectedValueText, { color: currentTheme.colors.textSecondary }]}>
                {getColorLabel(p2DotColor)}
              </Text>
            </View>
            <View style={styles.paletteRow}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = p2DotColor.toLowerCase() === color.value.toLowerCase();
                return (
                  <TouchableOpacity
                    key={`p2dot_${color.value}`}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      isSelected && { borderColor: '#FFFFFF', borderWidth: 2.5 }
                    ]}
                    onPress={() => setP2DotColor(color.value)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={styles.colorCheckContainer}>
                        <Text style={styles.colorCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.colorSubLabelRow}>
              <Text style={[styles.colorSubLabel, { color: currentTheme.colors.textPrimary }]}>Line Color</Text>
              <Text style={[styles.colorSelectedValueText, { color: currentTheme.colors.textSecondary }]}>
                {getColorLabel(p2LineColor)}
              </Text>
            </View>
            <View style={styles.paletteRow}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = p2LineColor.toLowerCase() === color.value.toLowerCase();
                return (
                  <TouchableOpacity
                    key={`p2line_${color.value}`}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      isSelected && { borderColor: '#FFFFFF', borderWidth: 2.5 }
                    ]}
                    onPress={() => setP2LineColor(color.value)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={styles.colorCheckContainer}>
                        <Text style={styles.colorCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        </View>

        {/* Custom Line Configurations */}
        <View style={[styles.section, isShortScreen && { marginBottom: 14 }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.textSecondary }]}>
            Line Segment Configurations (Select Exactly 3)
          </Text>
          
          {selectedLines.length !== 3 && (
            <View style={[styles.warningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}>
              <Text style={[styles.warningText, { color: '#EF4444' }]}>
                ⚠️ Select exactly 3 styles to apply configurations. (Selected: {selectedLines.length}/3)
              </Text>
            </View>
          )}

          {availableLineStyles.map((style) => {
            const isChecked = selectedLines.includes(style.id);
            return (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.optionCard,
                  isShortScreen && { padding: 10, marginBottom: 8 },
                  {
                    backgroundColor: currentTheme.colors.cardBackground,
                    borderColor: isChecked ? currentTheme.colors.accent : currentTheme.colors.border,
                  },
                ]}
                onPress={() => {
                  if (isChecked) {
                    setSelectedLines(selectedLines.filter((l) => l !== style.id));
                  } else {
                    setSelectedLines([...selectedLines, style.id]);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isChecked ? currentTheme.colors.accent : currentTheme.colors.textSecondary,
                        backgroundColor: isChecked ? currentTheme.colors.accent : 'transparent',
                      },
                    ]}
                  >
                    {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={[styles.cardTitle, { color: currentTheme.colors.textPrimary }]}>
                    {style.label}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: currentTheme.colors.textSecondary }]}>
                  {style.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Apply Settings Button */}
        <TouchableOpacity
          style={[
            styles.applyButton,
            { backgroundColor: selectedLines.length === 3 ? currentTheme.colors.accent : 'rgba(255, 255, 255, 0.05)' },
          ]}
          disabled={selectedLines.length !== 3}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.applyButtonText,
            { color: selectedLines.length === 3 ? '#000000' : 'rgba(255, 255, 255, 0.2)' }
          ]}>
            Apply Configurations
          </Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
  },
  backButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  rosterHint: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 24,
  },
  themeCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadeGroup: {
    flexDirection: 'row',
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  vsText: {
    fontSize: 11,
    marginHorizontal: 8,
    fontWeight: '700',
  },
  applyButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  colorCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  colorSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  colorSubLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  colorSubLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  colorSelectedValueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  colorCheckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCheckMark: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shapePreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 6,
  },
  shapeOptionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shapeCheckOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00FF66',
    borderRadius: 8,
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#020617',
  },
  shapeCheckMark: {
    color: '#020617',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  warningBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
});
