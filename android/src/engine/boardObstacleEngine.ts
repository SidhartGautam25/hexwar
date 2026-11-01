import { Dot, GameState, Point, ZoneTrapCell } from '../types/game';
import { BoardFeatureInstance } from '../types/boardFeatures';
import {
  HEX_DIRECTIONS,
  getSegmentCells,
  pointsEqual,
  stepHex,
} from './geometry';
import { canEliminateDot } from './boardFeatureEngine';
import { getVisibleTrailSegments } from './characterEngine';

export type { ZoneTrapCell };

export interface LevelBoardObstacles {
  blackBoxes: Point[];
  proximityTraps: Point[];
  zoneTraps: ZoneTrapCell[];
}

export const EMPTY_BOARD_OBSTACLES: LevelBoardObstacles = {
  blackBoxes: [],
  proximityTraps: [],
  zoneTraps: [],
};

/**
 * Zone trap colors — must stay clear of player blue/red, character accents,
 * and the lime proximity snare.
 */
export const ZONE_TRAP_COLORS = {
  orange: '#F97316',
  fuchsia: '#D946EF',
  brown: '#92400E',
  stone: '#78716C',
} as const;

export const DEFAULT_ZONE_TRAP_COLOR = ZONE_TRAP_COLORS.orange;

/**
 * Impassable neo proximity-trap border colors (electric cyber indigo / sapphire).
 * Unused by characters, players, black boxes, or active dot highlights.
 */
export const PROXIMITY_TRAP_NEO_RIM = '#312E81';     // Deep cyber indigo outer border
export const PROXIMITY_TRAP_NEO_GLOW = '#6366F1';    // High-voltage electric neon indigo
export const PROXIMITY_TRAP_NEO_ACCENT = '#E0E7FF';  // Shiny luminous ice highlight
export const PROXIMITY_TRAP_NEO_INNER = '#4338CA';   // Inner contrast boundary line

export const PROXIMITY_TRAP_RIM = PROXIMITY_TRAP_NEO_RIM;
export const PROXIMITY_TRAP_FILL = PROXIMITY_TRAP_NEO_GLOW;

export function getObstaclesFromState(state: GameState): LevelBoardObstacles {
  return {
    blackBoxes: state.blackBoxes ?? [],
    proximityTraps: state.proximityTraps ?? [],
    zoneTraps: state.zoneTraps ?? [],
  };
}

export function pointKey(point: Point): string {
  return `${point.r},${point.c}`;
}

export function toObstacleSet(cells: Point[]): Set<string> {
  return new Set(cells.map(pointKey));
}

export function isBlackBoxCell(point: Point, blackBoxes: Point[]): boolean {
  return blackBoxes.some((b) => pointsEqual(b, point));
}

export function isProximityTrapCell(point: Point, proximityTraps: Point[]): boolean {
  return proximityTraps.some((b) => pointsEqual(b, point));
}

export function isZoneTrapCell(point: Point, zoneTraps: ZoneTrapCell[]): boolean {
  return zoneTraps.some((z) => pointsEqual(z.point, point));
}

export function getZoneTrapAt(point: Point, zoneTraps: ZoneTrapCell[]): ZoneTrapCell | undefined {
  return zoneTraps.find((z) => pointsEqual(z.point, point));
}

/** Cannot enter or cross (black box). */
export function isImpassableCell(point: Point, obstacles: LevelBoardObstacles): boolean {
  return isBlackBoxCell(point, obstacles.blackBoxes);
}

export function pathCrossesImpassable(pathCells: Point[], obstacles: LevelBoardObstacles): boolean {
  return pathCells.some((cell) => isImpassableCell(cell, obstacles));
}

/** Connected components of proximity traps (edge-adjacent hexes = one group). */
export function buildProximityTrapGroups(proximityTraps: Point[]): Point[][] {
  if (proximityTraps.length === 0) return [];

  const trapSet = toObstacleSet(proximityTraps);
  const byKey = new Map(proximityTraps.map((p) => [pointKey(p), p]));
  const visited = new Set<string>();
  const groups: Point[][] = [];

  for (const start of proximityTraps) {
    const startKey = pointKey(start);
    if (visited.has(startKey)) continue;

    const group: Point[] = [];
    const queue = [start];
    visited.add(startKey);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);
      for (const direction of HEX_DIRECTIONS) {
        const neighbor = stepHex(current, direction);
        const nKey = pointKey(neighbor);
        if (!trapSet.has(nKey) || visited.has(nKey)) continue;
        visited.add(nKey);
        const cell = byKey.get(nKey);
        if (cell) queue.push(cell);
      }
    }

    groups.push(group);
  }

  return groups;
}

/** Trap cells in `group` that share a side with this living dot. */
function adjacentTrapKeysInGroup(dot: Dot, groupSet: Set<string>): Set<string> {
  const touched = new Set<string>();
  if (!dot.isAlive) return touched;
  for (const direction of HEX_DIRECTIONS) {
    const neighbor = stepHex(dot.currentPos, direction);
    const key = pointKey(neighbor);
    if (groupSet.has(key)) touched.add(key);
  }
  return touched;
}

export interface BoardTrapKillResult {
  dots: Dot[];
  killedIds: string[];
  logMessages: string[];
}

/**
 * After activePlayer moves: for each proximity-trap group, if that player has a living
 * dot sharing a boundary with the group AND the opponent has living dots sharing a
 * boundary with the same group, those opponent dots are eliminated.
 */
export function applyProximityTrapKills(
  dots: Dot[],
  activePlayer: 1 | 2,
  proximityTraps: Point[],
  boardFeatures: BoardFeatureInstance[]
): BoardTrapKillResult {
  if (proximityTraps.length === 0) {
    return { dots, killedIds: [], logMessages: [] };
  }

  const opponent: 1 | 2 = activePlayer === 1 ? 2 : 1;
  const groups = buildProximityTrapGroups(proximityTraps);
  const killIds = new Set<string>();

  for (const group of groups) {
    const groupSet = toObstacleSet(group);

    const moverTouchesGroup = dots.some(
      (d) =>
        d.isAlive &&
        d.player === activePlayer &&
        adjacentTrapKeysInGroup(d, groupSet).size > 0
    );
    if (!moverTouchesGroup) continue;

    for (const d of dots) {
      if (
        d.isAlive &&
        d.player === opponent &&
        adjacentTrapKeysInGroup(d, groupSet).size > 0 &&
        canEliminateDot(d, boardFeatures)
      ) {
        killIds.add(d.id);
      }
    }
  }

  if (killIds.size === 0) {
    return { dots, killedIds: [], logMessages: [] };
  }

  const killedIds = Array.from(killIds);
  const nextDots = dots.map((d) =>
    killIds.has(d.id) ? { ...d, isAlive: false, history: [] } : d
  );

  const logMessages = [
    activePlayer === 1
      ? 'Neo trap sprung — opponent dots beside the same trap were eliminated!'
      : 'Bot sprung a neo trap on your dots!',
  ];

  return { dots: nextDots, killedIds, logMessages };
}

/** Head + every visible trail hex for a living dot. */
export function getDotBodyCells(dot: Dot): Point[] {
  if (!dot.isAlive) return [];
  const cells: Point[] = [];
  const seen = new Set<string>();
  const push = (point: Point) => {
    const key = pointKey(point);
    if (seen.has(key)) return;
    seen.add(key);
    cells.push(point);
  };
  push(dot.currentPos);
  for (const segment of getVisibleTrailSegments(dot)) {
    for (const cell of getSegmentCells(segment.start, segment.end)) {
      push(cell);
    }
  }
  return cells;
}

function zoneColorsTouchedByCells(
  cells: Point[],
  zoneTraps: ZoneTrapCell[]
): Set<string> {
  const colors = new Set<string>();
  for (const cell of cells) {
    const zone = getZoneTrapAt(cell, zoneTraps);
    if (zone) colors.add(zone.color.toLowerCase());
  }
  return colors;
}

function dotTouchesZoneColor(dot: Dot, color: string, zoneTraps: ZoneTrapCell[]): boolean {
  const keys = new Set(
    zoneTraps
      .filter((z) => z.color.toLowerCase() === color)
      .map((z) => pointKey(z.point))
  );
  if (keys.size === 0) return false;
  return getDotBodyCells(dot).some((cell) => keys.has(pointKey(cell)));
}

/**
 * Same rule for player and bot: if any cell of the mover's arrival path sits on a
 * zone color, eliminate every living opponent whose head or trail still occupies
 * any zone of that same color (first on the color loses).
 */
export function applyZoneTrapKills(
  dots: Dot[],
  activePlayer: 1 | 2,
  zoneTraps: ZoneTrapCell[],
  moverArrivalCells: Point[],
  boardFeatures: BoardFeatureInstance[]
): BoardTrapKillResult {
  if (zoneTraps.length === 0 || moverArrivalCells.length === 0) {
    return { dots, killedIds: [], logMessages: [] };
  }

  const triggeredColors = zoneColorsTouchedByCells(moverArrivalCells, zoneTraps);
  if (triggeredColors.size === 0) {
    return { dots, killedIds: [], logMessages: [] };
  }

  const opponent: 1 | 2 = activePlayer === 1 ? 2 : 1;
  const killIds = new Set<string>();

  for (const color of triggeredColors) {
    for (const d of dots) {
      if (
        d.isAlive &&
        d.player === opponent &&
        canEliminateDot(d, boardFeatures) &&
        dotTouchesZoneColor(d, color, zoneTraps)
      ) {
        killIds.add(d.id);
      }
    }
  }

  if (killIds.size === 0) {
    return { dots, killedIds: [], logMessages: [] };
  }

  const killedIds = Array.from(killIds);
  const nextDots = dots.map((d) =>
    killIds.has(d.id) ? { ...d, isAlive: false, history: [] } : d
  );

  const logMessages = [
    activePlayer === 1
      ? 'Zone trap triggered — opponent dots on that color were eliminated!'
      : 'Bot triggered a zone trap on your dots!',
  ];

  return { dots: nextDots, killedIds, logMessages };
}
