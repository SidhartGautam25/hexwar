import { BoardFeatureInstance, ForcedMoveByPlayer } from './boardFeatures';

export type { BoardFeatureInstance, BoardFeatureTypeId, ForcedMoveByPlayer } from './boardFeatures';
export { EMPTY_FORCED_MOVE } from './boardFeatures';

export interface Point {
  r: number; // Row index (0-indexed)
  c: number; // Column index (0-indexed)
}

/** Passable kill-zone hex with a shared color family. */
export interface ZoneTrapCell {
  point: Point;
  color: string;
}

export interface LineSegment {
  id: string; // Unique ID for key mapping in React Native SVG
  start: Point;
  end: Point;
}

export type CharacterId = 'classic' | 'tree' | 'nova' | 'bulwark' | 'reaper' | 'robot' | 'cat';
export type CurrencyType = 'gold' | 'silver' | 'money';

export interface PlayerWallet {
  gold: number;
  silver: number;
  money: number;
}

/** Treasure hex — collected when a player's dot lands on this cell. */
export interface CurrencyRegion {
  id: string;
  origin: import('./gridRegion').RegionOrigin;
  type: CurrencyType;
  value: number;
  collected: boolean;
}

/** @deprecated Use CurrencyRegion */
export type CurrencyPickup = CurrencyRegion;

export interface TreeNode {
  id: string;
  pos: Point;
  parentId: string | null;
  childrenIds: string[]; // Up to 2 children in binary tree
}

export interface TreeBranch {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  start: Point;
  end: Point;
}

export interface Dot {
  id: string; // Unique identifier, e.g., "p1_1", "p2_3"
  player: 1 | 2;
  characterId: CharacterId;
  currentPos: Point;
  history: LineSegment[]; // Line history queue for Classic (and visible branches for Tree)
  isAlive: boolean;
  initialStartPos?: Point;
  handPos?: Point;
  handSegment?: LineSegment;
  /** Binary Tree structures */
  treeNodes?: TreeNode[];
  treeBranches?: TreeBranch[];
  activeHeadNodeId?: string;
  /** Tree stretching state */
  stretchedFrom?: Point;
  stretchedTo?: Point;
  isStretched?: boolean;
}

/** Six neighbors of a pointy-top hex. There is no straight north or south step. */
export type Direction = 'E' | 'NE' | 'NW' | 'W' | 'SW' | 'SE';

export interface TokenPool {
  [key: number]: number; // Token value (1 to 5) mapped to remaining count
}

export interface GameState {
  dots: Dot[];
  player1Tokens: TokenPool;
  player2Tokens: TokenPool;
  activePlayer: 1 | 2;
  winner: 1 | 2 | null;
  historyLogs: string[];
  currencyRegions: CurrencyRegion[];
  matchEarnings: PlayerWallet;
  boardFeatures: BoardFeatureInstance[];
  forcedMoveByPlayer: ForcedMoveByPlayer;
  blackBoxes?: Point[];
  /** Impassable neo traps — opponent dies if beside the same trap / trap group. */
  proximityTraps?: Point[];
  /** Passable colored zone hexes — landing on a color kills opponents already on that color. */
  zoneTraps?: ZoneTrapCell[];
  /** Hex cell map tracking captured territory: "r,c" -> player 1 or 2 */
  capturedHexes?: Record<string, 1 | 2>;
}
