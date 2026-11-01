import { CharacterId } from '../types/game';

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
  /** Board trail stripe color (alternates with player blue/red on Nova, Bulwark, Reaper). */
  trailAccentColor?: string;
  avatar?: any;
  /** Clean upright hex body image (stays aligned with hex grid). */
  avatarBody?: any;
  /** Inner face layer (eyes and smile that turn toward movement). */
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
    description: 'Direct striker that captures all hexes in radius equal to steps moved.',
    powerName: 'Radial Capture',
    powerDescription: 'Reaching destination captures all hexes within radius equal to steps moved.',
    shape: 'circle',
    dotColor: '#38BDF8',
    lineColor: '#7DD3FC',
    lineStyle: 'solid',
    trailAccentColor: '#0284C7',
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
    description: 'Binary branching unit that captures all area enclosed between branches.',
    powerName: 'Binary Area Capture',
    powerDescription: 'Heads give rise to 2 branches. Area between branches is captured. Branches can be pruned.',
    shape: 'hexagon',
    dotColor: '#10B981',
    lineColor: '#34D399',
    lineStyle: 'glow',
    trailAccentColor: '#059669',
    avatar: require('../../assets/images/characters/char3_bulwark.png'),
    avatarBody: require('../../assets/images/characters/char3_bulwark_body.png'),
    avatarFace: require('../../assets/images/characters/char3_bulwark_face.png'),
    maxTrailLength: 12,
    visibleTrailLength: 12,
    power: 'none',
  },
  bulwark: {
    id: 'bulwark',
    name: 'Bulwark',
    title: 'Emerald Guard',
    description: 'Heavy defense unit with only 2 trail segments.',
    powerName: 'Compact Trail',
    powerDescription: 'Only 2 active trail lines. Shape: arrow.',
    shape: 'arrow',
    dotColor: '#10B981',
    lineColor: '#34D399',
    lineStyle: 'glow',
    trailAccentColor: '#059669',
    avatar: require('../../assets/images/characters/char3_bulwark.png'),
    avatarBody: require('../../assets/images/characters/char3_bulwark_body.png'),
    avatarFace: require('../../assets/images/characters/char3_bulwark_face.png'),
    maxTrailLength: 2,
    visibleTrailLength: 2,
    power: 'armored_front',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    title: 'Star Striker',
    description: 'Agile striker with 3 active trail segments.',
    powerName: 'Agile Trail',
    powerDescription: '3 active trail lines. Shape: star.',
    shape: 'star',
    dotColor: '#F43F5E',
    lineColor: '#FB7185',
    lineStyle: 'dotted',
    trailAccentColor: '#E11D48',
    avatar: require('../../assets/images/characters/char4_nova.png'),
    avatarBody: require('../../assets/images/characters/char4_nova_body.png'),
    avatarFace: require('../../assets/images/characters/char4_nova_face.png'),
    maxTrailLength: 3,
    visibleTrailLength: 3,
    power: 'short_trail',
  },
  reaper: {
    id: 'reaper',
    name: 'Reaper',
    title: 'Amethyst Ghost',
    description: 'Elusive unit leaving only 1 active trail segment.',
    powerName: 'Ghost Trail',
    powerDescription: 'Only 1 active trail line. Minimal vulnerability. Shape: hexagon.',
    shape: 'hexagon',
    dotColor: '#A855F7',
    lineColor: '#C084FC',
    lineStyle: 'dashed',
    trailAccentColor: '#7C3AED',
    avatar: require('../../assets/images/characters/char6_reaper.png'),
    avatarBody: require('../../assets/images/characters/char6_reaper_body.png'),
    avatarFace: require('../../assets/images/characters/char6_reaper_face.png'),
    maxTrailLength: 1,
    visibleTrailLength: 1,
    power: 'ghost_trap',
  },
  robot: {
    id: 'robot',
    name: 'Mecha',
    title: 'Cyber Bot',
    description: 'High-tech robotic unit with cyber visor screen.',
    powerName: 'Cyber Sensor',
    powerDescription: 'Advanced mecha navigation and armored shielding.',
    shape: 'hexagon',
    dotColor: '#00F2FF',
    lineColor: '#38BDF8',
    lineStyle: 'glow',
    trailAccentColor: '#0284C7',
    avatar: require('../../assets/images/characters/char2_robot.png'),
    avatarBody: require('../../assets/images/characters/char2_robot_body.png'),
    avatarFace: require('../../assets/images/characters/char2_robot_face.png'),
    maxTrailLength: 3,
    visibleTrailLength: 3,
    power: 'armored_front',
  },
  cat: {
    id: 'cat',
    name: 'Neko',
    title: 'Golden Cat',
    description: 'Agile feline striker with whiskers.',
    powerName: 'Feline Reflexes',
    powerDescription: 'Quick leaps and nimble ghost agility.',
    shape: 'circle',
    dotColor: '#FBBF24',
    lineColor: '#FDE047',
    lineStyle: 'dashed',
    trailAccentColor: '#D97706',
    avatar: require('../../assets/images/characters/char5_cat.png'),
    avatarBody: require('../../assets/images/characters/char5_cat_body.png'),
    avatarFace: require('../../assets/images/characters/char5_cat_face.png'),
    maxTrailLength: 2,
    visibleTrailLength: 2,
    power: 'ghost_trap',
  },
};

export const DEFAULT_CHARACTER_LOADOUT: CharacterId[] = [
  'classic',
  'tree',
  'classic',
];

export const CHARACTER_LIST = [CHARACTERS.classic, CHARACTERS.tree];

const VALID_IDS: CharacterId[] = ['classic', 'tree', 'nova', 'bulwark', 'reaper', 'robot', 'cat'];

const LEGACY_ID_MAP: Record<string, CharacterId> = {
  phantom: 'nova',
  blitz: 'bulwark',
  fortress: 'reaper',
  fatty: 'classic',
};

function normalizeCharacterId(raw: string): CharacterId | null {
  if (VALID_IDS.includes(raw as CharacterId)) return raw as CharacterId;
  return LEGACY_ID_MAP[raw] ?? null;
}

/** Normalize any persisted or route loadout to valid character ids. */
export function sanitizeCharacterLoadout(loadout: unknown): CharacterId[] {
  if (!Array.isArray(loadout) || loadout.length === 0) {
    return DEFAULT_CHARACTER_LOADOUT;
  }
  const parsed = loadout
    .map((id) => normalizeCharacterId(String(id)))
    .filter((p): p is CharacterId => p !== null);
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
  const id = loadout[slot] ?? 'classic';
  return getCharacter(id);
}

export function parseCharacterLoadout(raw?: string): CharacterId[] {
  if (!raw) return DEFAULT_CHARACTER_LOADOUT;
  return sanitizeCharacterLoadout(raw.split(',').filter(Boolean));
}
