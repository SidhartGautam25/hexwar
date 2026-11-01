import { Point, Direction, LineSegment } from '../types/game';
import { GRID_CONFIG } from '../constants/board';

/** Six neighbors of a pointy-top hex cell. */
export const HEX_DIRECTIONS: Direction[] = ['E', 'NE', 'NW', 'W', 'SW', 'SE'];

/**
 * Clockwise edges of a pointy-top hex, starting with the edge to the right of the top vertex.
 * Edge i sits between hex vertex i and vertex i+1.
 */
export const HEX_EDGE_DIRECTIONS: Direction[] = ['NE', 'E', 'SE', 'SW', 'W', 'NW'];

export function pointsEqual(p1: Point, p2: Point): boolean {
  return p1.r === p2.r && p1.c === p2.c;
}

function isOddRow(r: number): boolean {
  return ((r % 2) + 2) % 2 === 1;
}

/** One step to an adjacent hex. Odd rows are shifted right. */
export function stepHex(origin: Point, direction: Direction): Point {
  const odd = isOddRow(origin.r);
  switch (direction) {
    case 'E':
      return { r: origin.r, c: origin.c + 1 };
    case 'W':
      return { r: origin.r, c: origin.c - 1 };
    case 'NE':
      return { r: origin.r - 1, c: origin.c + (odd ? 1 : 0) };
    case 'NW':
      return { r: origin.r - 1, c: origin.c - (odd ? 0 : 1) };
    case 'SE':
      return { r: origin.r + 1, c: origin.c + (odd ? 1 : 0) };
    case 'SW':
      return { r: origin.r + 1, c: origin.c - (odd ? 0 : 1) };
    default:
      return { ...origin };
  }
}

/** Hexes visited by walking `steps` times in one direction (excludes the origin). */
export function walkHex(origin: Point, direction: Direction, steps: number): Point[] {
  const cells: Point[] = [];
  let current = origin;
  for (let i = 0; i < steps; i++) {
    current = stepHex(current, direction);
    cells.push(current);
  }
  return cells;
}

export function getDestination(origin: Point, direction: Direction, steps: number): Point {
  const path = walkHex(origin, direction, steps);
  return path.length > 0 ? path[path.length - 1] : origin;
}

/** Which of the six directions, if any, carries `start` onto `end` in a straight line. */
export function inferHexDirection(start: Point, end: Point): Direction | null {
  if (pointsEqual(start, end)) return null;
  const limit = GRID_CONFIG.ROWS + GRID_CONFIG.COLS + 2;
  for (const direction of HEX_DIRECTIONS) {
    let current = start;
    for (let i = 0; i < limit; i++) {
      current = stepHex(current, direction);
      if (pointsEqual(current, end)) return direction;
    }
  }
  return null;
}

/** Hexes along a straight move (excludes start, includes end). */
export function getCellsAlongPath(start: Point, end: Point): Point[] {
  const direction = inferHexDirection(start, end);
  if (!direction) {
    return pointsEqual(start, end) ? [] : [end];
  }

  const cells: Point[] = [];
  let current = start;
  const limit = GRID_CONFIG.ROWS + GRID_CONFIG.COLS + 2;
  for (let i = 0; i < limit && !pointsEqual(current, end); i++) {
    current = stepHex(current, direction);
    cells.push(current);
  }
  return cells;
}

/** Start hex plus every hex the segment fills. */
export function getSegmentCells(start: Point, end: Point): Point[] {
  return [start, ...getCellsAlongPath(start, end)];
}

function cellKey(point: Point): string {
  return `${point.r},${point.c}`;
}

function sharedCells(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point): Point[] {
  const bKeys = new Set(getSegmentCells(bStart, bEnd).map(cellKey));
  return getSegmentCells(aStart, aEnd).filter((point) => bKeys.has(cellKey(point)));
}

/**
 * Keeps only segments that form a continuous path ending at `anchor`.
 * When a middle segment is cut (self-cross), older disconnected pieces are dropped.
 */
export function getConnectedTrailHistory(
  history: LineSegment[],
  anchor: Point
): LineSegment[] {
  if (history.length === 0) return history;

  const connected: LineSegment[] = [];
  let current = anchor;

  for (let i = history.length - 1; i >= 0; i--) {
    const seg = history[i];
    if (pointsEqual(seg.end, current)) {
      connected.unshift(seg);
      current = seg.start;
    }
  }

  return connected;
}

/**
 * Rotation (degrees) for shapes that point "up" (-Y) by default.
 * Uses the most recent move; falls back to facing the opponent.
 */
export function getMovementRotationDegrees(dot: { player: 1 | 2; history: { start: Point; end: Point }[] }): number {
  const lastSegment = dot.history.length > 0 ? dot.history[dot.history.length - 1] : null;
  if (lastSegment && !pointsEqual(lastSegment.start, lastSegment.end)) {
    const from = cellToPixel(lastSegment.start, 1, 0, 0);
    const to = cellToPixel(lastSegment.end, 1, 0, 0);
    return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90;
  }
  return dot.player === 1 ? 0 : 180;
}

/** Rotation degrees corresponding to a hex direction when default orientation points up (-Y). */
export function hexDirectionToRotation(direction: Direction): number {
  switch (direction) {
    case 'NE':
      return 30;
    case 'E':
      return 90;
    case 'SE':
      return 150;
    case 'SW':
      return 210;
    case 'W':
      return 270;
    case 'NW':
      return 330;
  }
}

export function isWithinBounds(point: Point): boolean {
  return (
    point.r >= 0 &&
    point.r < GRID_CONFIG.ROWS &&
    point.c >= 0 &&
    point.c < GRID_CONFIG.COLS
  );
}

export function isPointOnClosedSegment(P: Point, A: Point, B: Point): boolean {
  return getSegmentCells(A, B).some((cell) => pointsEqual(cell, P));
}

export function isPointOnOpenSegment(P: Point, A: Point, B: Point): boolean {
  return isPointOnClosedSegment(P, A, B) && !pointsEqual(P, A) && !pointsEqual(P, B);
}

/** True when two hex trails share a cell that is more than a single shared endpoint. */
export function doSegmentsOverlap(A: Point, B: Point, C: Point, D: Point): boolean {
  const shared = sharedCells(A, B, C, D);
  if (shared.length === 0) return false;
  if (shared.length > 1) return true;
  const point = shared[0];
  const endpointOfFirst = pointsEqual(point, A) || pointsEqual(point, B);
  const endpointOfSecond = pointsEqual(point, C) || pointsEqual(point, D);
  return !(endpointOfFirst && endpointOfSecond);
}

export function doSegmentsIntersect(A: Point, B: Point, C: Point, D: Point): boolean {
  return sharedCells(A, B, C, D).length > 0;
}

/**
 * A new hex trail crosses an existing one when they share a cell.
 * When `ignoreNewStartJoint` is set, sharing only the cell the move starts on
 * does not count, so a trail can continue from its own tip.
 */
export function areSegmentsIntersecting(
  newStart: Point,
  newEnd: Point,
  existStart: Point,
  existEnd: Point,
  ignoreNewStartJoint: boolean
): boolean {
  const shared = sharedCells(newStart, newEnd, existStart, existEnd);
  if (shared.length === 0) return false;
  if (ignoreNewStartJoint && shared.every((point) => pointsEqual(point, newStart))) {
    return false;
  }
  return true;
}

/** Center of a pointy-top hex. `hexSize` is the center-to-vertex radius. */
export function cellToPixel(
  point: Point,
  hexSize: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  const x = hexSize * Math.sqrt(3) * (point.c + (isOddRow(point.r) ? 0.5 : 0)) + offsetX;
  const y = hexSize * 1.5 * point.r + offsetY;
  return { x, y };
}

export function hexVertices(cx: number, cy: number, size: number): { x: number; y: number }[] {
  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((-90 + 60 * i) * Math.PI) / 180;
    verts.push({
      x: cx + size * Math.cos(angle),
      y: cy + size * Math.sin(angle),
    });
  }
  return verts;
}

export function hexPolygonPath(cx: number, cy: number, size: number): string {
  return (
    hexVertices(cx, cy, size)
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ') + ' Z'
  );
}

/** Fit a pointy-top hex board into the available pixel box. */
export function hexBoardMetrics(maxWidth: number, maxHeight: number): {
  hexSize: number;
  boardWidth: number;
  boardHeight: number;
  offsetX: number;
  offsetY: number;
} {
  const pad = 0;
  const widthUnits = Math.sqrt(3) * (GRID_CONFIG.COLS + 0.5);
  const heightUnits = 1.5 * (GRID_CONFIG.ROWS - 1) + 2;
  const hexSize = Math.max(3, maxWidth / widthUnits);
  return {
    hexSize,
    boardWidth: maxWidth,
    boardHeight: heightUnits * hexSize,
    offsetX: (Math.sqrt(3) * hexSize) / 2,
    offsetY: hexSize,
  };
}

export function pointToCube(p: Point): { q: number; r: number; s: number } {
  const q = p.c - Math.floor(p.r / 2);
  const r = p.r;
  const s = -q - r;
  return { q, r, s };
}

export function cubeToPoint(cube: { q: number; r: number; s: number }): Point {
  const c = cube.q + Math.floor(cube.r / 2);
  const r = cube.r;
  return { r, c };
}

export function hexDistance(a: Point, b: Point): number {
  const ac = pointToCube(a);
  const bc = pointToCube(b);
  return (Math.abs(ac.q - bc.q) + Math.abs(ac.r - bc.r) + Math.abs(ac.s - bc.s)) / 2;
}

/**
 * Returns all valid hex grid points within distance `radius` from `center`.
 */
export function getHexesInRadius(center: Point, radius: number): Point[] {
  const result: Point[] = [];
  const cc = pointToCube(center);
  for (let dq = -radius; dq <= radius; dq++) {
    for (let dr = Math.max(-radius, -dq - radius); dr <= Math.min(radius, -dq + radius); dr++) {
      const ds = -dq - dr;
      const pt = cubeToPoint({ q: cc.q + dq, r: cc.r + dr, s: cc.s + ds });
      if (isWithinBounds(pt)) {
        result.push(pt);
      }
    }
  }
  return result;
}

function triSign(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

export function isPointInTriangle(
  pt: { x: number; y: number },
  v1: { x: number; y: number },
  v2: { x: number; y: number },
  v3: { x: number; y: number }
): boolean {
  const d1 = triSign(pt, v1, v2);
  const d2 = triSign(pt, v2, v3);
  const d3 = triSign(pt, v3, v1);

  const hasNeg = d1 < -0.001 || d2 < -0.001 || d3 < -0.001;
  const hasPos = d1 > 0.001 || d2 > 0.001 || d3 > 0.001;

  return !(hasNeg && hasPos);
}

/**
 * Returns all hexes within the area between two branches meeting at `head`:
 * Specifically, all hexes inside the triangle formed by head, branchEndA, branchEndB,
 * plus all hexes along the boundary segments HA, HB, and AB.
 */
function distToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

/**
 * Returns all hexes within the region between two lines HA and HB meeting at head:
 * Specifically, all hexes inside the triangle formed by head, endA, endB,
 * plus all hexes along lines HA, HB, and the region in between.
 */
export function getHexesInTriangleArea(head: Point, endA: Point, endB: Point): Point[] {
  const seen = new Set<string>();
  const hexes: Point[] = [];

  const add = (p: Point) => {
    if (!isWithinBounds(p)) return;
    const key = `${p.r},${p.c}`;
    if (seen.has(key)) return;
    seen.add(key);
    hexes.push(p);
  };

  // 1. Boundary lines: HA and HB
  for (const cell of getSegmentCells(head, endA)) add(cell);
  for (const cell of getSegmentCells(head, endB)) add(cell);

  const hexSize = 10;
  const hPix = cellToPixel(head, hexSize, 0, 0);
  const aPix = cellToPixel(endA, hexSize, 0, 0);
  const bPix = cellToPixel(endB, hexSize, 0, 0);

  // Bounding box of the triangle in rows and cols
  const minR = Math.max(0, Math.min(head.r, endA.r, endB.r) - 2);
  const maxR = Math.min(GRID_CONFIG.ROWS - 1, Math.max(head.r, endA.r, endB.r) + 2);
  const minC = Math.max(0, Math.min(head.c, endA.c, endB.c) - 2);
  const maxC = Math.min(GRID_CONFIG.COLS - 1, Math.max(head.c, endA.c, endB.c) + 2);

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const pt = { r, c };
      const center = cellToPixel(pt, hexSize, 0, 0);

      if (isPointInTriangle(center, hPix, aPix, bPix)) {
        add(pt);
        continue;
      }

      const verts = hexVertices(center.x, center.y, hexSize);
      let inTri = false;
      for (const v of verts) {
        if (isPointInTriangle(v, hPix, aPix, bPix)) {
          inTri = true;
          break;
        }
      }
      if (inTri) {
        add(pt);
        continue;
      }

      if (
        distToSegment(center, hPix, aPix) <= hexSize * 0.85 ||
        distToSegment(center, hPix, bPix) <= hexSize * 0.85 ||
        distToSegment(center, aPix, bPix) <= hexSize * 0.85
      ) {
        add(pt);
      }
    }
  }

  return hexes;
}


/** Returns up to count (default 5) nearby hexes around center, including center itself. */
export function getNearbyPaintHexes(center: Point, count: number = 5): Point[] {
  const result: Point[] = [center];
  const seen = new Set<string>([`${center.r},${center.c}`]);

  for (const dir of HEX_DIRECTIONS) {
    if (result.length >= count) break;
    const neighbor = stepHex(center, dir);
    const key = `${neighbor.r},${neighbor.c}`;
    if (isWithinBounds(neighbor) && !seen.has(key)) {
      seen.add(key);
      result.push(neighbor);
    }
  }

  if (result.length < count) {
    const radiusHexes = getHexesInRadius(center, 2);
    for (const h of radiusHexes) {
      if (result.length >= count) break;
      const key = `${h.r},${h.c}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(h);
      }
    }
  }

  return result;
}


/** Returns center and all surrounding neighbor hexes in all 6 directions. */
export function getSurroundingPaintHexes(center: Point): Point[] {
  const result: Point[] = [center];
  const seen = new Set<string>([`${center.r},${center.c}`]);

  for (const dir of HEX_DIRECTIONS) {
    const neighbor = stepHex(center, dir);
    const key = `${neighbor.r},${neighbor.c}`;
    if (isWithinBounds(neighbor) && !seen.has(key)) {
      seen.add(key);
      result.push(neighbor);
    }
  }

  return result;
}
