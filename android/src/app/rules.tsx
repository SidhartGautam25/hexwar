import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAME_THEMES } from '../constants/theme';

export default function RulesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = GAME_THEMES[0];
  const colors = theme.colors;

  const isThreeButtonNav = insets.bottom >= 30;

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Top Status Bar Spacer */}
      <View style={{ height: insets.top, backgroundColor: colors.background }} />

      {/* Header HUD */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.border + '22' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Rules & Characters</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: isThreeButtonNav ? 24 : Math.max(insets.bottom, 16) }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Rules Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>1. Objective & Win Conditions</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            • <Text style={{ color: '#10B981', fontWeight: '800' }}>50% Territory Capture:</Text> The first player to capture 50% or more of the hex grid territory wins immediately!{"\n"}
            • <Text style={{ color: '#EF4444', fontWeight: '800' }}>Complete Elimination:</Text> If all 3 opponent units are completely eliminated, they lose immediately.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.accent }]}>2. The Two Characters (3 Units Total)</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Each player controls 3 units: Two Classic units at the sides, and One Tree unit at the center.{"\n\n"}
            <Text style={{ color: colors.p1Shades[0], fontWeight: '800' }}>⚡ Classic (Sides):</Text>{"\n"}
            • Moves in straight lines across hexes using Distance Tokens (1 to 6).{"\n"}
            • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Radial Capture:</Text> Upon reaching its destination, it captures all hex boxes within a radius equal to the steps moved (e.g. 3-step move captures radius 3).{"\n"}
            • If an opponent cuts its trail line or lands on it directly, the Classic unit is destroyed.{"\n\n"}
            <Text style={{ color: '#10B981', fontWeight: '800' }}>🌲 Tree / Binary Tree (Center):</Text>{"\n"}
            • Its heads can give rise to up to two lines/branches. In each turn, you draw one branch.{"\n"}
            • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Area Capture:</Text> When the second line is drawn from the same head, the entire area between those two lines is captured by the player!{"\n"}
            • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Pruning Defense:</Text> When an opponent cuts a branch of the tree, only that branch and all its descendant sub-branches are pruned and removed. The main root/body remains alive!{"\n"}
            • Direct hit on the tree root completely eliminates the tree.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.accent }]}>3. Movement & Proximity Rules</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Teammate Separation:</Text> A move cannot touch (occupy or be adjacent to) even one hex of any other teammate dot body or line.{"\n"}
            • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Own Body Rule:</Text> A unit can touch at most 1 hex of its own body/line at the starting cell. Moving directly backwards onto its own line is forbidden.{"\n"}
            • <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Black Boxes:</Text> Impassable terrain obstacles. Shots cannot travel through them, and they cannot be captured.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.accent }]}>4. Captured Territory</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Captured hexes are colored with a subtle tint of the player's color (low gradient) so unit bodies and trails remain crisp and easily identifiable. Opponents can recapture enemy territory by covering it with their radial or area captures!
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.backMenuButton, { backgroundColor: colors.accent }]}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.backMenuText}>Back to Home</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: Dimensions.get('window').height < 750 ? 10 : 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: Dimensions.get('window').height < 750 ? 12 : 20,
    marginBottom: Dimensions.get('window').height < 750 ? 12 : 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 14,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  backMenuButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  backMenuText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
