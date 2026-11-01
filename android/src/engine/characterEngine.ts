import { Dot, LineSegment, Point } from '../types/game';
import { getCharacter } from '../constants/characters';
import { getCellsAlongPath, getSegmentCells, pointsEqual, areSegmentsIntersecting, getConnectedTrailHistory, stepHex, HEX_DIRECTIONS } from './geometry';
import { BoardFeatureInstance } from '../types/boardFeatures';
import { isPointOnRegion } from '../types/gridRegion';

function isDotProtectedAtPosition(pos: Point, features: BoardFeatureInstance[]): boolean {
  return features.some((f) => f.typeId === 'shield_zone' && isPointOnRegion(pos, f.origin));
}

export function getMaxTrailLength(dot: Dot): number {
  return getCharacter(dot.characterId).maxTrailLength;
}

export { getConnectedTrailHistory } from './geometry';

export function getVisibleTrailSegments(dot: Dot): LineSegment[] {
  // All dots remain continuously connected to their root
  if (dot.characterId === 'tree' && dot.handSegment) {
    return [...dot.history, dot.handSegment];
  }
  return dot.history;
}

/** Returns available nodes of Tree that have fewer than 2 children (can branch). */
export function getTreeActiveHeads(dot: Dot): import('../types/game').TreeNode[] {
  if (dot.characterId !== 'tree' || !dot.treeNodes || dot.treeNodes.length === 0) {
    return [];
  }
  return dot.treeNodes.filter((node) => node.childrenIds.length < 2);
}

/**
 * Prunes a cut branch and all its descendant branches and nodes from a Tree dot.
 * Returns the number of pruned branches.
 */
export function pruneTreeBranch(dot: Dot, cutBranchId: string): { prunedCount: number } {
  if (dot.characterId !== 'tree' || !dot.treeBranches || !dot.treeNodes) {
    return { prunedCount: 0 };
  }

  const cutBranch = dot.treeBranches.find((b) => b.id === cutBranchId);
  if (!cutBranch) return { prunedCount: 0 };

  const nodesToRemove = new Set<string>();
  const branchesToRemove = new Set<string>();

  const queue = [cutBranch.toNodeId];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    nodesToRemove.add(nodeId);
    const node = dot.treeNodes.find((n) => n.id === nodeId);
    if (node) {
      for (const childId of node.childrenIds) {
        queue.push(childId);
      }
    }
  }

  branchesToRemove.add(cutBranch.id);
  for (const b of dot.treeBranches) {
    if (nodesToRemove.has(b.toNodeId) || nodesToRemove.has(b.fromNodeId)) {
      branchesToRemove.add(b.id);
    }
  }

  const parentNode = dot.treeNodes.find((n) => n.id === cutBranch.fromNodeId);
  if (parentNode) {
    parentNode.childrenIds = parentNode.childrenIds.filter((id) => id !== cutBranch.toNodeId);
  }

  dot.treeBranches = dot.treeBranches.filter((b) => !branchesToRemove.has(b.id));
  dot.treeNodes = dot.treeNodes.filter((n) => !nodesToRemove.has(n.id));
  dot.history = dot.treeBranches.map((b) => ({ id: b.id, start: b.start, end: b.end }));

  if (dot.activeHeadNodeId && nodesToRemove.has(dot.activeHeadNodeId)) {
    const availableHead = dot.treeNodes.find((n) => n.childrenIds.length < 2) ?? dot.treeNodes[0];
    if (availableHead) {
      dot.activeHeadNodeId = availableHead.id;
      dot.currentPos = { ...availableHead.pos };
    }
  }

  return { prunedCount: branchesToRemove.size };
}

/** Oldest stored segment used as a hidden trap (Reaper / hexagon). */
export function getGhostTrapSegment(dot: Dot): LineSegment | null {
  const char = getCharacter(dot.characterId);
  if (char.power !== 'ghost_trap') return null;
  if (dot.history.length <= char.visibleTrailLength) return null;
  return dot.history[0];
}

export function getTrapPointsForDot(dot: Dot): Point[] {
  const ghost = getGhostTrapSegment(dot);
  if (!ghost || !dot.isAlive) return [];

  const occupied = new Set(getOccupiedCells(dot.currentPos).map((p) => `${p.r},${p.c}`));
  const along = getCellsAlongPath(ghost.start, ghost.end);
  const points: Point[] = [ghost.start, ...along];
  const seen = new Set<string>();
  return points.filter((p) => {
    const key = `${p.r},${p.c}`;
    if (occupied.has(key)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getAllTrapPoints(dots: Dot[]): Point[] {
  const seen = new Set<string>();
  const traps: Point[] = [];
  for (const dot of dots) {
    for (const p of getTrapPointsForDot(dot)) {
      const key = `${p.r},${p.c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      traps.push(p);
    }
  }
  return traps;
}

export function isBulwarkDot(dot: Dot): boolean {
  return false;
}

/** The trail segment currently attached to the dot's position. */
export function isSegmentAttachedToDot(dot: Dot, segment: LineSegment): boolean {
  return pointsEqual(segment.end, dot.currentPos);
}

/** Bulwark: only active trail can be cut; no segments are immune. */
export function isSegmentProtectedFromCuts(dot: Dot, segmentIndex: number): boolean {
  return false;
}

export function getOccupiedCells(point: Point): Point[] {
  return [point];
}

export function getMoveCoverageCells(pathCells: Point[]): Point[] {
  return pathCells;
}

export function doesTrailCutKillDot(
  dot: Dot,
  newStart: Point,
  newEnd: Point,
  boardFeatures: BoardFeatureInstance[],
  _moverDot?: Dot
): boolean {
  if (!dot.isAlive) return false;
  // Tree dot is NOT killed by trail cut; its branches are pruned instead
  if (dot.characterId === 'tree') return false;
  if (isDotProtectedAtPosition(dot.currentPos, boardFeatures)) return false;

  const moverSegments: { start: Point; end: Point }[] = [{ start: newStart, end: newEnd }];

  const victimSegments: { start: Point; end: Point }[] = [];
  for (const segment of getVisibleTrailSegments(dot)) {
    victimSegments.push({ start: segment.start, end: segment.end });
  }

  return moverSegments.some((mSeg) =>
    victimSegments.some((vSeg) =>
      areSegmentsIntersecting(mSeg.start, mSeg.end, vSeg.start, vSeg.end, false)
    )
  );
}

function cellKey(point: Point): string {
  return `${point.r},${point.c}`;
}

/**
 * Checks whether a proposed move violates trail or teammate proximity rules.
 *
 * Rules:
 * 1. Teammates: Must NOT touch (occupy or be adjacent to) even ONE box of any
 *    other teammate dot or any teammate's line.
 * 2. Own line:
 *    - Cannot land on or step through any box of its own line (cannot cross own trail).
 *    - Cannot intersect its own trail segments.
 *    - Can touch (be adjacent to) at most ONE box of its own line. This allows
 *      the dot to move in 5 directions (the 3 forward directions + the 2 flanking
 *      directions that touch the 1 line box behind the head), while blocking moving
 *      directly backward onto its own line.
 */
export function pathCrossesOwnTrail(movingDotId: string, pathCells: Point[], dots: Dot[]): boolean {
  const moving = dots.find((dot) => dot.id === movingDotId);
  if (!moving || pathCells.length === 0) return false;

  const startPos = moving.currentPos;
  const startKeys = new Set(getOccupiedCells(startPos).map(cellKey));
  const endPos = pathCells[pathCells.length - 1];
  const movingCoverage = getMoveCoverageCells(pathCells);

  // 1. Gather all teammate boxes (other dots on the same team and their visible trails)
  const teammateBoxes = new Set<string>();
  for (const dot of dots) {
    if (!dot.isAlive || dot.player !== moving.player || dot.id === moving.id) continue;
    for (const occ of getOccupiedCells(dot.currentPos)) {
      teammateBoxes.add(cellKey(occ));
    }
    if (dot.characterId === 'tree' && dot.treeNodes) {
      for (const node of dot.treeNodes) {
        teammateBoxes.add(cellKey(node.pos));
      }
    }
    for (const segment of getVisibleTrailSegments(dot)) {
      for (const cell of getSegmentCells(segment.start, segment.end)) {
        for (const occ of getOccupiedCells(cell)) {
          teammateBoxes.add(cellKey(occ));
        }
      }
    }
  }

  // 2. Rule: Must not touch even ONE box of teammate's line or dot
  for (const cell of movingCoverage) {
    const key = cellKey(cell);
    if (teammateBoxes.has(key)) return true;
    for (const direction of HEX_DIRECTIONS) {
      const neighbor = stepHex(cell, direction);
      if (teammateBoxes.has(cellKey(neighbor))) {
        return true;
      }
    }
  }

  // 3. Gather mover's own visible trail boxes (excluding starting positions)
  const ownTrailBoxes = new Set<string>();
  const ownSegments = getVisibleTrailSegments(moving);
  for (const segment of ownSegments) {
    for (const cell of getSegmentCells(segment.start, segment.end)) {
      for (const occ of getOccupiedCells(cell)) {
        const key = cellKey(occ);
        if (!startKeys.has(key)) {
          ownTrailBoxes.add(key);
        }
      }
    }
  }

  // 4. Rule for own line:
  // a) Cannot land on or step through any box of its own line
  for (const cell of movingCoverage) {
    const key = cellKey(cell);
    if (ownTrailBoxes.has(key)) {
      return true;
    }
  }

  // b) Cannot cross / intersect own trail segments
  const movingSegments = [{ start: startPos, end: endPos }];

  for (const segment of ownSegments) {
    const segsToTest = [{ start: segment.start, end: segment.end }];
    for (const mSeg of movingSegments) {
      for (const oSeg of segsToTest) {
        if (areSegmentsIntersecting(mSeg.start, mSeg.end, oSeg.start, oSeg.end, true)) {
          return true;
        }
      }
    }
  }

  // c) Across all cells of the move, can touch (be adjacent to) at most ONE box of its own line
  const touchedOwnBoxes = new Set<string>();
  for (const cell of movingCoverage) {
    for (const direction of HEX_DIRECTIONS) {
      const neighbor = stepHex(cell, direction);
      const neighborKey = cellKey(neighbor);
      if (!startKeys.has(neighborKey) && ownTrailBoxes.has(neighborKey)) {
        touchedOwnBoxes.add(neighborKey);
      }
    }
  }

  if (touchedOwnBoxes.size > 1) {
    return true;
  }

  return false;
}

export function isTrapPointForOpponent(pos: Point, dots: Dot[], movingPlayer: 1 | 2): boolean {
  return false;
}
