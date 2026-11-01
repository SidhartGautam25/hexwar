import { Dot, GameState, Point } from '../types/game';
import {
  BoardFeatureMoveContext,
  BoardFeatureMoveResult,
  ForcedMoveByPlayer,
} from '../types/boardFeatures';
import { BOARD_FEATURE_REGISTRY } from '../features/boardFeatureRegistry';
import {
  getFeaturesAtLanding,
  isDotProtectedAtPosition,
  isSanctuaryOccupied,
  isSanctuaryPoint,
} from '../features/boardFeatureQueries';
import { isBulwarkDot, isSegmentProtectedFromCuts, getOccupiedCells } from './characterEngine';
import { pointsEqual, isWithinBounds } from './geometry';
import { BoardFeatureInstance } from '../types/boardFeatures';
import { getObstaclesFromState, isImpassableCell } from './boardObstacleEngine';

export function canEliminateDot(dot: Dot, features: BoardFeatureInstance[]): boolean {
  if (!dot.isAlive) return false;
  if (isDotProtectedAtPosition(dot.currentPos, features)) return false;
  if (isBulwarkDot(dot)) return false;
  return true;
}

export function canCutSegment(dot: Dot, segmentIndex: number): boolean {
  return !isSegmentProtectedFromCuts(dot, segmentIndex);
}

export function validateLandingPosition(
  endPos: Point,
  movingDotId: string,
  gameState: GameState
): string | null {
  const movingDot = gameState.dots.find((d) => d.id === movingDotId);
  if (!movingDot) return 'Invalid dot.';

  const landingCells = getOccupiedCells(endPos);
  for (const cell of landingCells) {
    if (!isWithinBounds(cell)) {
      return 'Shot exceeds grid boundaries.';
    }

    const obstacles = getObstaclesFromState(gameState);
    if (isImpassableCell(cell, obstacles)) {
      if (obstacles.proximityTraps.some((b) => pointsEqual(b, cell))) {
        return 'That point is an impassable neo trap hex.';
      }
      return 'That point is an impassable black box obstacle.';
    }

    const occupant = gameState.dots.find(
      (d) =>
        d.isAlive &&
        d.id !== movingDotId &&
        getOccupiedCells(d.currentPos).some((occ) => pointsEqual(occ, cell))
    );

    if (occupant) {
      if (occupant.player === movingDot.player) {
        return 'That point is already occupied by your dot.';
      }
      if (!canEliminateDot(occupant, gameState.boardFeatures)) {
        return 'Cannot land on a protected dot.';
      }
    }

    if (
      isSanctuaryPoint(cell, gameState.boardFeatures) &&
      isSanctuaryOccupied(cell, gameState.dots, gameState.boardFeatures, movingDotId)
    ) {
      return 'Sanctuary hex is occupied — only one dot may rest there.';
    }
  }

  return null;
}

export function canLandAt(
  endPos: Point,
  movingDotId: string,
  dots: Dot[],
  boardFeatures: BoardFeatureInstance[],
  obstacles?: {
    blackBoxes?: Point[];
    proximityTraps?: Point[];
    zoneTraps?: import('./boardObstacleEngine').ZoneTrapCell[];
  }
): boolean {
  return (
    validateLandingPosition(endPos, movingDotId, {
      dots,
      boardFeatures,
      blackBoxes: obstacles?.blackBoxes,
      proximityTraps: obstacles?.proximityTraps,
      zoneTraps: obstacles?.zoneTraps,
    } as GameState) === null
  );
}

function mergeForcedMove(
  current: ForcedMoveByPlayer,
  patch?: Partial<ForcedMoveByPlayer>
): ForcedMoveByPlayer {
  if (!patch) return current;
  return {
    1: patch[1] !== undefined ? patch[1] : current[1],
    2: patch[2] !== undefined ? patch[2] : current[2],
  };
}

export function applyFeaturesOnMove(
  ctx: BoardFeatureMoveContext
): BoardFeatureMoveResult {
  const touched = getFeaturesAtLanding(ctx.endPos, ctx.gameState.boardFeatures);
  let dots = ctx.updatedDots;
  let forcedMoveByPlayer: ForcedMoveByPlayer | undefined;
  const featureMessages: string[] = [];
  const handled = new Set<string>();

  for (const instance of touched) {
    if (handled.has(instance.id)) continue;
    handled.add(instance.id);

    const definition = BOARD_FEATURE_REGISTRY[instance.typeId];
    if (!definition.onDotLanded) continue;

    const result = definition.onDotLanded({
      ...ctx,
      updatedDots: dots,
    });

    if (result.dots) dots = result.dots;
    if (result.forcedMoveByPlayer) {
      forcedMoveByPlayer = mergeForcedMove(
        forcedMoveByPlayer ?? ctx.gameState.forcedMoveByPlayer,
        result.forcedMoveByPlayer
      );
    }
    if (result.featureMessages) featureMessages.push(...result.featureMessages);
  }

  return { dots, forcedMoveByPlayer, featureMessages };
}

export function clearForcedMoveAfterTurn(
  player: 1 | 2,
  forcedMoveByPlayer: ForcedMoveByPlayer
): ForcedMoveByPlayer {
  if (!forcedMoveByPlayer[player]) return forcedMoveByPlayer;
  return { ...forcedMoveByPlayer, [player]: null };
}

export function getRequiredDotIdForPlayer(
  player: 1 | 2,
  forcedMoveByPlayer: ForcedMoveByPlayer,
  dots: Dot[]
): string | null {
  const forcedId = forcedMoveByPlayer[player];
  if (!forcedId) return null;
  const dot = dots.find((d) => d.id === forcedId && d.player === player && d.isAlive);
  return dot ? forcedId : null;
}

export function validateForcedMove(
  movingDotId: string,
  activePlayer: 1 | 2,
  gameState: GameState
): string | null {
  const required = getRequiredDotIdForPlayer(
    activePlayer,
    gameState.forcedMoveByPlayer,
    gameState.dots
  );
  if (required && movingDotId !== required) {
    return 'Lock region active: you must move the locked dot this turn.';
  }
  return null;
}
