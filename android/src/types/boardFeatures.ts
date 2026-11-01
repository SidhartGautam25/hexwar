import { Dot, GameState, LineSegment, Point } from './game';
import { RegionOrigin } from './gridRegion';

/** Unique id for each board-cell feature kind. Extend this union when adding new tiles. */
export type BoardFeatureTypeId = 'shield_zone' | 'trail_erase' | 'forced_lock';

/** A special property covering a 2×2 dot region. */
export interface BoardFeatureInstance {
  id: string;
  typeId: BoardFeatureTypeId;
  origin: RegionOrigin;
}

export interface ForcedMoveByPlayer {
  1: string | null;
  2: string | null;
}

export const EMPTY_FORCED_MOVE: ForcedMoveByPlayer = { 1: null, 2: null };

/** Context passed to feature handlers during a move resolution. */
export interface BoardFeatureMoveContext {
  gameState: GameState;
  movingDotId: string;
  movingDot: Dot;
  endPos: Point;
  touchedPoints: Point[];
  newSegment: LineSegment;
  updatedDots: Dot[];
  activePlayer: 1 | 2;
}

/** Partial state mutations returned by feature handlers. */
export interface BoardFeatureMoveResult {
  dots?: Dot[];
  forcedMoveByPlayer?: Partial<ForcedMoveByPlayer>;
  featureMessages?: string[];
}

export interface BoardFeatureVisual {
  stroke: string;
  fill: string;
  glyph: string;
  ringDash?: string;
}

export interface BoardFeatureDefinition {
  typeId: BoardFeatureTypeId;
  name: string;
  shortLabel: string;
  description: string;
  visual: BoardFeatureVisual;
  /** Dot standing on this cell cannot be eliminated. */
  protectsOccupant?: boolean;
  /** Fired when a dot finishes a move on this cell. */
  onDotLanded?: (ctx: BoardFeatureMoveContext) => BoardFeatureMoveResult;
}
