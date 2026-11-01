import { CharacterId } from '../types/game';
import { PLAYER_COLORS } from './gameColors';

export type DotShape = 'circle' | 'arrow' | 'hexagon' | 'star';
export type LineStyle = 'solid' | 'dotted' | 'glow' | 'dashed' | 'dashdot' | 'outline';
export type CharacterPower = 'none' | 'short_trail' | 'armored_front' | 'ghost_trap';

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  powerName: string;
  powerDescription: string;
  shape: DotShape;
  dotColor: string;
  lineColor: string;
  lineStyle: LineStyle;
  trailAccentColor?: string;
  avatar?: any;
  avatarBody?: any;
  avatarFace?: any;
  maxTrailLength: number;
  visibleTrailLength: number;
  power: CharacterPower;
}

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    title: 'Cyan Striker',
    description: 'Paints 2 layers of surrounding hex boxes on every move.',
    powerName: '2-Layer Paint',
    powerDescription: 'Paints 2 layers of surrounding hex boxes on every move.',
    shape: 'circle',
    dotColor: PLAYER_COLORS.P1.body,
    lineColor: PLAYER_COLORS.P1.accent,
    lineStyle: 'solid',
    trailAccentColor: PLAYER_COLORS.P1.body,
    avatar: require('../../assets/images/characters/char1_classic.png'),
    avatarBody: require('../../assets/images/characters/char1_classic_body.png'),
    avatarFace: require('../../assets/images/characters/char1_classic_face.png'),
    maxTrailLength: 4,
    visibleTrailLength: 4,
    power: 'none',
  },
  tree: {
    id: 'tree',
    name: 'Tree',
    title: 'Branch Weaver',
    description: 'Stretches body to new point, then on second move captures section in between and paints 5 nearby hexes.',
    powerName: 'Stretch & Capture',
    powerDescription: 'Body stretches to point; next move captures section in between and relocates head.',
    shape: 'hexagon',
    dotColor: PLAYER_COLORS.P1.body,
    lineColor: PLAYER_COLORS.P1.accent,
    lineStyle: 'glow',
    trailAccentColor: PLAYER_COLORS.P1.body,
    avatar: require('../../assets/images/characters/char3_bulwark.png'),
    avatarBody: require('../../assets/images/characters/char3_bulwark_body.png'),
    avatarFace: require('../../assets/images/characters/char3_bulwark_face.png'),
    maxTrailLength: 12,
    visibleTrailLength: 12,
    power: 'none',
  },
  bulwark: {
    id: 'bulwark',
    name: 'Classic',
    title: 'Cyan Striker',
    description: 'Paints 5 nearby hex boxes.',
    powerName: 'Nearby Paint',
    powerDescription: 'Paints 5 nearby hex boxes.',
    shape: 'circle',
    dotColor: '#38BDF8',
    lineColor: '#7DD3FC',
    lineStyle: 'solid',
    maxTrailLength: 4,
    visibleTrailLength: 4,
    power: 'none',
  },
  nova: {
    id: 'nova',
    name: 'Classic',
    title: 'Cyan Striker',
    description: 'Paints 5 nearby hex boxes.',
    powerName: 'Nearby Paint',
    powerDescription: 'Paints 5 nearby hex boxes.',
    shape: 'circle',
    dotColor: '#38BDF8',
    lineColor: '#7DD3FC',
    lineStyle: 'solid',
    maxTrailLength: 4,
    visibleTrailLength: 4,
    power: 'none',
  },
  reaper: {
    id: 'reaper',
    name: 'Classic',
    title: 'Cyan Striker',
    description: 'Paints 5 nearby hex boxes.',
    powerName: 'Nearby Paint',
    powerDescription: 'Paints 5 nearby hex boxes.',
    shape: 'circle',
    dotColor: '#38BDF8',
    lineColor: '#7DD3FC',
    lineStyle: 'solid',
    maxTrailLength: 4,
    visibleTrailLength: 4,
    power: 'none',
  },
  robot: {
    id: 'robot',
    name: 'Classic',
    title: 'Cyan Striker',
    description: 'Paints 5 nearby hex boxes.',
    powerName: 'Nearby Paint',
    powerDescription: 'Paints 5 nearby hex boxes.',
    shape: 'circle',
    dotColor: '#38BDF8',
    lineColor: '#7DD3FC',
    lineStyle: 'solid',
    maxTrailLength: 4,
    visibleTrailLength: 4,
    power: 'none',
  },
  cat: {
    id: 'cat',
    name: 'Classic',
    title: 'Cyan Striker',
    description: 'Paints 5 nearby hex boxes.',
    powerName: 'Nearby Paint',
    powerDescription: 'Paints 5 nearby hex boxes.',
    shape: 'circle',
    dotColor: '#38BDF8',
    lineColor: '#7DD3FC',
    lineStyle: 'solid',
    maxTrailLength: 4,
    visibleTrailLength: 4,
    power: 'none',
  },
};

export const DEFAULT_CHARACTER_LOADOUT: CharacterId[] = [
  'classic',
  'tree',
  'classic',
];

export const CHARACTER_LIST = [CHARACTERS.classic, CHARACTERS.tree];

const VALID_IDS: CharacterId[] = ['classic', 'tree'];

function normalizeCharacterId(raw: string): CharacterId {
  if (raw === 'tree') return 'tree';
  return 'classic';
}

/** Normalize any persisted or route loadout to valid character ids. */
export function sanitizeCharacterLoadout(loadout: unknown): CharacterId[] {
  if (!Array.isArray(loadout) || loadout.length === 0) {
    return DEFAULT_CHARACTER_LOADOUT;
  }
  const parsed = loadout
    .map((id) => normalizeCharacterId(String(id)));
  if (parsed.length === 0) return DEFAULT_CHARACTER_LOADOUT;
  return parsed;
}

export function getCharacter(id: CharacterId): CharacterDefinition {
  return CHARACTERS[id] ?? CHARACTERS.classic;
}

export function getCharacterForDot(
  dotId: string,
  loadout: CharacterId[]
): CharacterDefinition {
  const slot = parseInt(dotId.split('_')[1] || '1', 10) - 1;
  const id = loadout[slot] ?? (slot === 1 ? 'tree' : 'classic');
  return getCharacter(id);
}

export function parseCharacterLoadout(raw?: string): CharacterId[] {
  if (!raw) return DEFAULT_CHARACTER_LOADOUT;
  return sanitizeCharacterLoadout(raw.split(',').filter(Boolean));
}
