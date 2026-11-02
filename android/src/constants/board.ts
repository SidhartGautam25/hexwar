import { Dot, TokenPool, CharacterId, CurrencyRegion, Point } from '../types/game';
import { DEFAULT_CHARACTER_LOADOUT } from './characters';

export const GRID_CONFIG = {
  ROWS: 25,
  COLS: 15,
  CELL_SIZE: 32,
  MAX_LINE_HISTORY: 4,
};

export const INITIAL_TOKEN_POOL: TokenPool = {
  1: 4,
  2: 4,
  3: 4,
  4: 4,
  5: 4,
  6: 4,
};

export const DOT_POSITIONS: { id: string; player: 1 | 2; pos: { r: number; c: number } }[] = [
  { id: 'p1_1', player: 1, pos: { r: 24, c: 2 } },
  { id: 'p1_2', player: 1, pos: { r: 24, c: 7 } },
  { id: 'p1_3', player: 1, pos: { r: 24, c: 12 } },
  { id: 'p2_1', player: 2, pos: { r: 0, c: 2 } },
  { id: 'p2_2', player: 2, pos: { r: 0, c: 7 } },
  { id: 'p2_3', player: 2, pos: { r: 0, c: 12 } },
];

export function getInitialPositionForDot(dot: Dot): Point {
  if (dot.initialStartPos) {
    return { ...dot.initialStartPos };
  }
  const defaultPos = DOT_POSITIONS.find((def) => def.id === dot.id);
  if (defaultPos) {
    return { ...defaultPos.pos };
  }
  return { ...dot.currentPos };
}

export function resetDotToInitialPosition(dot: Dot): void {
  const initialPos = getInitialPositionForDot(dot);
  dot.currentPos = { ...initialPos };
  dot.initialStartPos = { ...initialPos };
  dot.history = [];
  dot.isAlive = true;
  dot.isStretched = false;
  dot.handPos = undefined;
  dot.handSegment = undefined;
  if (dot.characterId === 'tree') {
    dot.treeNodes = [
      { id: `${dot.id}_root`, pos: { ...initialPos }, parentId: null, childrenIds: [] },
    ];
    dot.treeBranches = [];
    dot.activeHeadNodeId = `${dot.id}_root`;
  }
}

export function createInitialDots(
  playerLoadout: CharacterId[] = DEFAULT_CHARACTER_LOADOUT,
  botLoadout: CharacterId[] = playerLoadout
): Dot[] {
  return DOT_POSITIONS.map((def) => {
    const slot = parseInt(def.id.split('_')[1], 10) - 1;
    const loadout = def.player === 1 ? playerLoadout : botLoadout;
    const charId = loadout[slot] ?? (slot === 1 ? 'tree' : 'classic');
    const isTree = charId === 'tree';
    return {
      id: def.id,
      player: def.player,
      characterId: charId,
      currentPos: { ...def.pos },
      initialStartPos: { ...def.pos },
      history: [],
      isAlive: true,
      treeNodes: isTree
        ? [{ id: `${def.id}_root`, pos: { ...def.pos }, parentId: null, childrenIds: [] }]
        : undefined,
      treeBranches: isTree ? [] : undefined,
      activeHeadNodeId: isTree ? `${def.id}_root` : undefined,
      isStretched: false,
    };
  });
}

export const INITIAL_DOTS: Dot[] = createInitialDots();

/** Region-based treasure: 3 gold, 3 silver, 4 money. */
export const INITIAL_CURRENCY_REGIONS: CurrencyRegion[] = [];

export function createFreshCurrencyRegions(): CurrencyRegion[] {
  return [];
}

/** @deprecated */
export const INITIAL_CURRENCY_PICKUPS = INITIAL_CURRENCY_REGIONS;
export const createFreshCurrencyPickups = createFreshCurrencyRegions;
