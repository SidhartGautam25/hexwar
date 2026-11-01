import { CharacterId, Point } from '../types/game';
import { LevelBoardObstacles } from '../engine/boardObstacleEngine';

export interface PosPowerItem {
  type: string;
  coordinates: Point[];
  color?: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  botDelayMs?: number;
  dots: {
    dot1: CharacterId;
    dot2: CharacterId;
    dot3: CharacterId;
  };
  botDots?: {
    dot1: CharacterId;
    dot2: CharacterId;
    dot3: CharacterId;
  };
  pos_power?: PosPowerItem[];
}

// Symmetrical black box placements for 36x21 grid (Rows 0-35, Cols 0-20)
const LEVEL2_BLACK_BOXES: Point[] = [
  { r: 17, c: 7 }, { r: 17, c: 13 },
  { r: 18, c: 7 }, { r: 18, c: 13 },
];

const LEVEL3_BLACK_BOXES: Point[] = [
  { r: 12, c: 5 }, { r: 12, c: 15 },
  { r: 17, c: 10 }, { r: 18, c: 10 },
  { r: 23, c: 5 }, { r: 23, c: 15 },
  { r: 17, c: 4 }, { r: 18, c: 16 },
];

const LEVEL4_BLACK_BOXES: Point[] = [
  { r: 11, c: 6 }, { r: 11, c: 7 }, { r: 11, c: 13 }, { r: 11, c: 14 },
  { r: 17, c: 9 }, { r: 17, c: 11 }, { r: 18, c: 9 }, { r: 18, c: 11 },
  { r: 24, c: 6 }, { r: 24, c: 7 }, { r: 24, c: 13 }, { r: 24, c: 14 },
];

const LEVEL5_BLACK_BOXES: Point[] = [
  { r: 10, c: 4 }, { r: 10, c: 5 }, { r: 10, c: 15 }, { r: 10, c: 16 },
  { r: 15, c: 9 }, { r: 15, c: 10 }, { r: 15, c: 11 },
  { r: 20, c: 9 }, { r: 20, c: 10 }, { r: 20, c: 11 },
  { r: 25, c: 4 }, { r: 25, c: 5 }, { r: 25, c: 15 }, { r: 25, c: 16 },
  { r: 17, c: 2 }, { r: 18, c: 18 },
];

const LEVEL6_BLACK_BOXES: Point[] = [
  { r: 9, c: 6 }, { r: 9, c: 7 }, { r: 9, c: 13 }, { r: 9, c: 14 },
  { r: 14, c: 3 }, { r: 14, c: 4 }, { r: 14, c: 16 }, { r: 14, c: 17 },
  { r: 17, c: 8 }, { r: 17, c: 12 }, { r: 18, c: 8 }, { r: 18, c: 12 },
  { r: 21, c: 3 }, { r: 21, c: 4 }, { r: 21, c: 16 }, { r: 21, c: 17 },
  { r: 26, c: 6 }, { r: 26, c: 7 }, { r: 26, c: 13 }, { r: 26, c: 14 },
];

const LEVEL7_BLACK_BOXES: Point[] = [
  { r: 9, c: 4 }, { r: 9, c: 5 }, { r: 10, c: 4 }, { r: 10, c: 5 },
  { r: 9, c: 15 }, { r: 9, c: 16 }, { r: 10, c: 15 }, { r: 10, c: 16 },
  { r: 16, c: 9 }, { r: 16, c: 11 }, { r: 19, c: 9 }, { r: 19, c: 11 },
  { r: 17, c: 10 }, { r: 18, c: 10 },
  { r: 25, c: 4 }, { r: 25, c: 5 }, { r: 26, c: 4 }, { r: 26, c: 5 },
  { r: 25, c: 15 }, { r: 25, c: 16 }, { r: 26, c: 15 }, { r: 26, c: 16 },
];

const LEVEL8_BLACK_BOXES: Point[] = [
  { r: 11, c: 5 }, { r: 12, c: 5 }, { r: 13, c: 5 }, { r: 14, c: 5 },
  { r: 11, c: 15 }, { r: 12, c: 15 }, { r: 13, c: 15 }, { r: 14, c: 15 },
  { r: 17, c: 7 }, { r: 17, c: 8 }, { r: 17, c: 12 }, { r: 17, c: 13 },
  { r: 18, c: 7 }, { r: 18, c: 8 }, { r: 18, c: 12 }, { r: 18, c: 13 },
  { r: 21, c: 5 }, { r: 22, c: 5 }, { r: 23, c: 5 }, { r: 24, c: 5 },
  { r: 21, c: 15 }, { r: 22, c: 15 }, { r: 23, c: 15 }, { r: 24, c: 15 },
];

const LEVEL9_BLACK_BOXES: Point[] = [
  { r: 8, c: 3 }, { r: 8, c: 4 }, { r: 9, c: 3 },
  { r: 8, c: 16 }, { r: 8, c: 17 }, { r: 9, c: 17 },
  { r: 13, c: 7 }, { r: 13, c: 13 }, { r: 22, c: 7 }, { r: 22, c: 13 },
  { r: 16, c: 4 }, { r: 17, c: 4 }, { r: 18, c: 4 }, { r: 19, c: 4 },
  { r: 16, c: 16 }, { r: 17, c: 16 }, { r: 18, c: 16 }, { r: 19, c: 16 },
  { r: 17, c: 9 }, { r: 17, c: 11 }, { r: 18, c: 9 }, { r: 18, c: 11 },
  { r: 26, c: 3 }, { r: 27, c: 3 }, { r: 27, c: 4 },
  { r: 26, c: 17 }, { r: 27, c: 16 }, { r: 27, c: 17 },
];

const LEVEL10_BLACK_BOXES: Point[] = [
  { r: 9, c: 6 }, { r: 9, c: 7 }, { r: 9, c: 8 }, { r: 9, c: 12 }, { r: 9, c: 13 }, { r: 9, c: 14 },
  { r: 14, c: 2 }, { r: 14, c: 3 }, { r: 14, c: 17 }, { r: 14, c: 18 },
  { r: 17, c: 6 }, { r: 17, c: 7 }, { r: 17, c: 13 }, { r: 17, c: 14 },
  { r: 18, c: 6 }, { r: 18, c: 7 }, { r: 18, c: 13 }, { r: 18, c: 14 },
  { r: 21, c: 2 }, { r: 21, c: 3 }, { r: 21, c: 17 }, { r: 21, c: 18 },
  { r: 26, c: 6 }, { r: 26, c: 7 }, { r: 26, c: 8 }, { r: 26, c: 12 }, { r: 26, c: 13 }, { r: 26, c: 14 },
];

const LEVEL11_BLACK_BOXES: Point[] = [
  { r: 8, c: 5 }, { r: 9, c: 6 }, { r: 10, c: 7 },
  { r: 8, c: 15 }, { r: 9, c: 14 }, { r: 10, c: 13 },
  { r: 13, c: 3 }, { r: 14, c: 3 }, { r: 13, c: 17 }, { r: 14, c: 17 },
  { r: 16, c: 8 }, { r: 16, c: 12 }, { r: 19, c: 8 }, { r: 19, c: 12 },
  { r: 17, c: 5 }, { r: 18, c: 5 }, { r: 17, c: 15 }, { r: 18, c: 15 },
  { r: 21, c: 3 }, { r: 22, c: 3 }, { r: 21, c: 17 }, { r: 22, c: 17 },
  { r: 25, c: 7 }, { r: 26, c: 6 }, { r: 27, c: 5 },
  { r: 25, c: 13 }, { r: 26, c: 14 }, { r: 27, c: 15 },
];

const LEVEL12_BLACK_BOXES: Point[] = [
  { r: 8, c: 4 }, { r: 8, c: 5 }, { r: 9, c: 4 }, { r: 9, c: 5 },
  { r: 8, c: 15 }, { r: 8, c: 16 }, { r: 9, c: 15 }, { r: 9, c: 16 },
  { r: 13, c: 8 }, { r: 13, c: 9 }, { r: 13, c: 11 }, { r: 13, c: 12 },
  { r: 17, c: 3 }, { r: 17, c: 4 }, { r: 17, c: 16 }, { r: 17, c: 17 },
  { r: 18, c: 3 }, { r: 18, c: 4 }, { r: 18, c: 16 }, { r: 18, c: 17 },
  { r: 22, c: 8 }, { r: 22, c: 9 }, { r: 22, c: 11 }, { r: 22, c: 12 },
  { r: 26, c: 4 }, { r: 26, c: 5 }, { r: 27, c: 4 }, { r: 27, c: 5 },
  { r: 26, c: 15 }, { r: 26, c: 16 }, { r: 27, c: 15 }, { r: 27, c: 16 },
  { r: 17, c: 9 }, { r: 17, c: 11 }, { r: 18, c: 9 }, { r: 18, c: 11 },
];

const DEFAULT_DOTS: LevelConfig['dots'] = {
  dot1: 'classic',
  dot2: 'tree',
  dot3: 'classic',
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1',
    title: 'Training Grounds',
    description: 'Easy AI • 3 Units (2 Classic + 1 Tree)',
    difficulty: 'easy',
    botDelayMs: 800,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: [] }],
  },
  {
    id: 2,
    name: 'Level 2',
    title: 'Ink Skirmish',
    description: 'Medium AI • 4 Obstacle Blocks',
    difficulty: 'medium',
    botDelayMs: 800,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL2_BLACK_BOXES }],
  },
  {
    id: 3,
    name: 'Level 3',
    title: 'Tactical Clash',
    description: 'Hard AI (Minimax) • 8 Obstacle Blocks',
    difficulty: 'hard',
    botDelayMs: 30,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL3_BLACK_BOXES }],
  },
  {
    id: 4,
    name: 'Level 4',
    title: 'Iron Pillars',
    description: 'Medium AI • 12 Obstacle Blocks',
    difficulty: 'medium',
    botDelayMs: 500,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL4_BLACK_BOXES }],
  },
  {
    id: 5,
    name: 'Level 5',
    title: 'Divided Valley',
    description: 'Hard AI • 16 Obstacle Blocks',
    difficulty: 'hard',
    botDelayMs: 30,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL5_BLACK_BOXES }],
  },
  {
    id: 6,
    name: 'Level 6',
    title: 'Citadel Maze',
    description: 'Hard AI (Minimax) • 20 Obstacle Blocks',
    difficulty: 'hard',
    botDelayMs: 30,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL6_BLACK_BOXES }],
  },
  {
    id: 7,
    name: 'Level 7',
    title: 'The Crossfire',
    description: 'Hard AI • 22 Bunker Blocks',
    difficulty: 'hard',
    botDelayMs: 30,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL7_BLACK_BOXES }],
  },
  {
    id: 8,
    name: 'Level 8',
    title: 'Twin Corridors',
    description: 'Hard AI • 24 Canal Blocks',
    difficulty: 'hard',
    botDelayMs: 30,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL8_BLACK_BOXES }],
  },
  {
    id: 9,
    name: 'Level 9',
    title: 'Fortress Rings',
    description: 'Hard AI • 28 Fortress Blocks',
    difficulty: 'hard',
    botDelayMs: 150,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL9_BLACK_BOXES }],
  },
  {
    id: 10,
    name: 'Level 10',
    title: 'The Gauntlet',
    description: 'Hard AI • 28 Gauntlet Blocks',
    difficulty: 'hard',
    botDelayMs: 30,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL10_BLACK_BOXES }],
  },
  {
    id: 11,
    name: 'Level 11',
    title: 'Spiderweb Labyrinth',
    description: 'Hard AI • 30 Labyrinth Blocks',
    difficulty: 'hard',
    botDelayMs: 30,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL11_BLACK_BOXES }],
  },
  {
    id: 12,
    name: 'Level 12',
    title: 'Grand Citadel',
    description: 'Hard AI • 36 Citadel Blocks',
    difficulty: 'hard',
    botDelayMs: 150,
    dots: DEFAULT_DOTS,
    pos_power: [{ type: 'BLACK_BOX', coordinates: LEVEL12_BLACK_BOXES }],
  },
];

export function getBotDelayForLevel(level: LevelConfig): number {
  return level.botDelayMs ?? 800;
}

export function getPlayerLoadoutForLevel(level: LevelConfig): [CharacterId, CharacterId, CharacterId] {
  return [level.dots.dot1, level.dots.dot2, level.dots.dot3];
}

export function getBotLoadoutForLevel(level: LevelConfig): [CharacterId, CharacterId, CharacterId] {
  if (level.botDots) {
    return [level.botDots.dot1, level.botDots.dot2, level.botDots.dot3];
  }
  return getPlayerLoadoutForLevel(level);
}

function getCoordinatesForPowerType(level: LevelConfig, type: string): Point[] {
  if (!level.pos_power) return [];
  const normalized = type.toUpperCase();
  if (Array.isArray(level.pos_power)) {
    return level.pos_power
      .filter((p) => p.type && p.type.toUpperCase() === normalized)
      .flatMap((p) => p.coordinates ?? []);
  }
  return [];
}

export function getBoardObstaclesForLevel(level: LevelConfig): LevelBoardObstacles {
  return {
    blackBoxes: getCoordinatesForPowerType(level, 'BLACK_BOX'),
    proximityTraps: [],
    zoneTraps: [],
  };
}

export function getBlackBoxesForLevel(level: LevelConfig): Point[] {
  return getBoardObstaclesForLevel(level).blackBoxes;
}

export function getLevelById(id: number): LevelConfig {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

/** Backward compatibility alias */
export const AI_LEVELS = LEVELS.map((l) => ({
  id: l.difficulty,
  name: `${l.name}: ${l.title}`,
  level: l.id,
  description: l.description,
}));
