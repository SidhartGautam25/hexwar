import { GameState, Dot, TokenPool, LineSegment, Direction, PlayerWallet, CurrencyRegion, Point, TreeNode, TreeBranch } from '../types/game';
import { EngineResult } from '../types/engine';
import { MoveNotification } from '../types/notifications';
import { GRID_CONFIG } from '../constants/board';
import {
  getMaxTrailLength,
  isTrapPointForOpponent,
  doesTrailCutKillDot,
  pathCrossesOwnTrail,
  getOccupiedCells,
  getMoveCoverageCells,
  pruneTreeBranch,
} from './characterEngine';
import {
  getDestination,
  isWithinBounds,
  areSegmentsIntersecting,
  pointsEqual,
  getCellsAlongPath,
  getConnectedTrailHistory,
  HEX_DIRECTIONS,
  getHexesInRadius,
  getHexesInTriangleArea,
  getNearbyPaintHexes,
  getSurroundingPaintHexes,
  getSegmentCells,
} from './geometry';
import { EMPTY_WALLET, mergeWallets } from '../utils/wallet';
import {
  applyFeaturesOnMove,
  canEliminateDot,
  canLandAt,
  clearForcedMoveAfterTurn,
  validateForcedMove,
  validateLandingPosition,
} from './boardFeatureEngine';
import { getMoveTouchedPoints, isSameRegionOrigin, dotLandsOnRegion } from '../types/gridRegion';
import { getFeaturesAtLanding } from '../features/boardFeatureQueries';
import { refillTokenPoolIfEmpty, getEffectiveTokenPool } from '../utils/tokenPool';
import { BOARD_FEATURE_REGISTRY } from '../features/boardFeatureRegistry';
import { BoardFeatureInstance } from '../types/boardFeatures';
import {
  applyProximityTrapKills,
  applyZoneTrapKills,
  getObstaclesFromState,
  pathCrossesImpassable,
} from './boardObstacleEngine';

function generateSegmentId(dotId: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${dotId}_line_${timestamp}_${randomSuffix}`;
}

function getMaxTrailForDot(dot: Dot): number {
  return getMaxTrailLength(dot);
}

function emptyNotifications(): MoveNotification[] {
  return [];
}

function failResult(gameState: GameState, error: string): EngineResult {
  return {
    success: false,
    error,
    dots: gameState.dots,
    player1Tokens: gameState.player1Tokens,
    player2Tokens: gameState.player2Tokens,
    activePlayer: gameState.activePlayer,
    winner: gameState.winner,
    prunedLinesCount: 0,
    killedDots: [],
    currencyRegions: gameState.currencyRegions,
    matchEarnings: gameState.matchEarnings,
    currencyCollectedThisMove: EMPTY_WALLET,
    forcedMoveByPlayer: gameState.forcedMoveByPlayer,
    featureMessages: [],
    notifications: emptyNotifications(),
    capturedHexes: gameState.capturedHexes,
  };
}

function collectCurrencyRegions(
  landingPos: Point,
  regions: CurrencyRegion[],
  collectorPlayer: 1 | 2,
  boardFeatures: BoardFeatureInstance[]
): {
  regions: CurrencyRegion[];
  earned: PlayerWallet;
  notifications: MoveNotification[];
  claimedByBot: string[];
} {
  const earned: PlayerWallet = { ...EMPTY_WALLET };
  const notifications: MoveNotification[] = [];
  const claimedByBot: string[] = [];

  const updated = regions.map((region) => {
    if (region.collected) return region;
    if (!dotLandsOnRegion(landingPos, region.origin)) return region;
    if (boardFeatures.some((feature) => isSameRegionOrigin(feature.origin, region.origin))) {
      return region;
    }

    if (collectorPlayer === 1) {
      if (region.type === 'gold') earned.gold += region.value;
      else if (region.type === 'silver') earned.silver += region.value;
      else earned.money += region.value;

      const label = region.type === 'gold' ? 'Gold' : region.type === 'silver' ? 'Silver' : 'Coins';
      notifications.push({
        id: `cur_${region.id}_${Date.now()}`,
        kind: region.type,
        title: `${label} Region Captured!`,
        body: `You landed on a ${label.toLowerCase()} zone and earned +${region.value}.`,
      });
    } else {
      claimedByBot.push(region.id);
    }

    return { ...region, collected: true };
  });

  return { regions: updated, earned, notifications, claimedByBot };
}

function buildFeatureNotifications(
  activePlayer: 1 | 2,
  touchedFeatures: BoardFeatureInstance[],
  featureMessages: string[]
): MoveNotification[] {
  if (activePlayer !== 1) return [];

  const notifs: MoveNotification[] = [];
  const seen = new Set<string>();

  for (const feature of touchedFeatures) {
    if (seen.has(feature.typeId)) continue;
    seen.add(feature.typeId);
    const def = BOARD_FEATURE_REGISTRY[feature.typeId];

    if (feature.typeId === 'shield_zone') {
      notifs.push({
        id: `feat_${feature.id}`,
        kind: 'shield_zone',
        title: 'Sanctuary Region',
        body: 'Sanctuary: your dot cannot be cut on this hex. Only one dot may occupy it.',
      });
    } else if (feature.typeId === 'trail_erase') {
      notifs.push({
        id: `feat_${feature.id}`,
        kind: 'trail_erase',
        title: 'Trail Purge Region',
        body: featureMessages.find((m) => m.includes('Trail Purge')) ?? def.description,
      });
    } else if (feature.typeId === 'forced_lock') {
      notifs.push({
        id: `feat_${feature.id}`,
        kind: 'forced_lock',
        title: 'Lock Region',
        body: featureMessages.find((m) => m.includes('Lock')) ?? def.description,
      });
    }
  }

  return notifs;
}

export function executeShot(
  movingDotId: string,
  direction: Direction,
  tokenValue: number,
  gameState: GameState
): EngineResult {
  const { dots, player1Tokens, player2Tokens, activePlayer } = gameState;

  const forcedError = validateForcedMove(movingDotId, activePlayer, gameState);
  if (forcedError) {
    return failResult(gameState, forcedError);
  }

  const movingDotIndex = dots.findIndex((d) => d.id === movingDotId);
  if (movingDotIndex === -1) {
    return failResult(gameState, `Dot with ID "${movingDotId}" not found.`);
  }

  const movingDot = dots[movingDotIndex];

  if (!movingDot.isAlive) {
    return failResult(gameState, 'Cannot move a destroyed dot.');
  }

  if (movingDot.player !== activePlayer) {
    return failResult(gameState, "Cannot move opponent's dot.");
  }

  const activePool = getEffectiveTokenPool(
    activePlayer === 1 ? player1Tokens : player2Tokens
  );
  if (!activePool[tokenValue] || activePool[tokenValue] <= 0) {
    return failResult(gameState, `Token value ${tokenValue} is not available in your pool.`);
  }

  const startPos = movingDot.currentPos;
  const endPos = getDestination(startPos, direction, tokenValue);

  if (!isWithinBounds(endPos)) {
    return failResult(gameState, 'Shot exceeds grid boundaries.');
  }

  const landingError = validateLandingPosition(endPos, movingDotId, gameState);
  if (landingError) {
    return failResult(gameState, landingError);
  }

  const pathCells = getCellsAlongPath(startPos, endPos);
  const moverCoverage = getMoveCoverageCells(pathCells);
  if (!moverCoverage.every(isWithinBounds)) {
    return failResult(gameState, 'Shot exceeds grid boundaries.');
  }
  const obstacles = getObstaclesFromState(gameState);
  if (pathCrossesImpassable(moverCoverage, obstacles)) {
    return failResult(
      gameState,
      'Shot blocked: cannot travel through impassable obstacles (black or neo trap hexes).'
    );
  }
  if (pathCrossesOwnTrail(movingDotId, pathCells, dots)) {
    return failResult(gameState, 'Move blocked: touches teammate line or crosses own trail.');
  }
  const touchedPoints = getMoveTouchedPoints(startPos, pathCells);

  const newSegmentId = generateSegmentId(movingDotId);
  const newSegment: LineSegment = {
    id: newSegmentId,
    start: startPos,
    end: endPos,
  };

  const updatedDots: Dot[] = dots.map((d) => ({
    ...d,
    currentPos: { ...d.currentPos },
    initialStartPos: d.initialStartPos ? { ...d.initialStartPos } : { ...d.currentPos },
    handPos: d.handPos ? { ...d.handPos } : undefined,
    handSegment: d.handSegment
      ? { ...d.handSegment, start: { ...d.handSegment.start }, end: { ...d.handSegment.end } }
      : undefined,
    history: d.history.map((seg) => ({
      ...seg,
      start: { ...seg.start },
      end: { ...seg.end },
    })),
    treeNodes: d.treeNodes?.map((n) => ({
      ...n,
      pos: { ...n.pos },
      childrenIds: [...n.childrenIds],
    })),
    treeBranches: d.treeBranches?.map((b) => ({
      ...b,
      start: { ...b.start },
      end: { ...b.end },
    })),
  }));

  const killedDots: string[] = [];
  let prunedLinesCount = 0;
  let featureMessages: string[] = [];

  const landingCells = getOccupiedCells(endPos);

  // When opponent crosses or lands:
  // "consider the hex dot initial point be R ( root ) and point H ( head ) and point A and B be the point of the line which opponent cross , then line from point A to H should be erared , so the thing is when opponent crosses a player hex , from that line to head ( movement made after that line ) should be erased . and the last thing is , player will ( of any type classic or tree or in future if we make any ) will be connected to their root ( or initial point )"
  updatedDots.forEach((d) => {
    if (d.player !== activePlayer && d.isAlive) {
      // 1. Check if any body segment S_i (from Point A to Point B) in d.history is crossed or landed upon
      let cutIndex = -1;
      for (let i = 0; i < d.history.length; i++) {
        const seg = d.history[i];
        const intersects = areSegmentsIntersecting(
          newSegment.start,
          newSegment.end,
          seg.start,
          seg.end,
          false
        );
        const landsOnSeg = getCellsAlongPath(seg.start, seg.end).some((pt) =>
          pointsEqual(pt, endPos)
        );
        if (intersects || landsOnSeg) {
          cutIndex = i;
          break; // Earliest segment crossed from root
        }
      }

      if (cutIndex !== -1) {
        // Point A is the start of the crossed line (seg.start)
        const cutPointA = { ...d.history[cutIndex].start };
        const pruned = d.history.length - cutIndex;
        // Erase line from Point A to Head H (all movements made after Point A)
        d.history = d.history.slice(0, cutIndex);
        // Head relocates to Point A
        d.currentPos = cutPointA;
        // If Tree, clear any outstretched hand
        if (d.characterId === 'tree') {
          d.handPos = undefined;
          d.handSegment = undefined;
        }
        prunedLinesCount += pruned;
        featureMessages.push(
          d.player === activePlayer
            ? `Your trail was cut! Line from cut point to head erased (-${pruned} moves).`
            : `Opponent trail cut! Line from cut point to head erased (-${pruned} moves).`
        );
      } else if (d.characterId === 'tree' && d.handSegment) {
        // 2. Tree: check if mover cuts outstretched hand segment AB
        const cutsHand =
          areSegmentsIntersecting(
            newSegment.start,
            newSegment.end,
            d.handSegment.start,
            d.handSegment.end,
            false
          ) || pointsEqual(endPos, d.handSegment.end);
        if (cutsHand) {
          d.handPos = undefined;
          d.handSegment = undefined;
          prunedLinesCount++;
          featureMessages.push(
            d.player === activePlayer
              ? 'Your Tree hand was cut!'
              : 'Opponent Tree hand was cut!'
          );
        }
      } else if (pointsEqual(endPos, d.currentPos)) {
        // 3. Opponent lands directly on Head H: erase last move leading into H
        if (d.characterId === 'tree') {
          d.handPos = undefined;
          d.handSegment = undefined;
        }
        if (d.history.length > 0) {
          d.history.pop();
          d.currentPos =
            d.history.length > 0
              ? { ...d.history[d.history.length - 1].end }
              : { ...(d.initialStartPos ?? d.currentPos) };
          prunedLinesCount++;
          featureMessages.push(
            d.player === activePlayer
              ? 'Your head was hit! Last move erased.'
              : 'Opponent head was hit! Last move erased.'
          );
        } else {
          d.currentPos = { ...(d.initialStartPos ?? d.currentPos) };
        }
      }
    }
  });

  // Self-trail intersection for Classic only
  updatedDots.forEach((d) => {
    if (d.player === activePlayer && d.isAlive && d.characterId !== 'tree') {
      const initialHistoryLength = d.history.length;
      d.history = d.history.filter((seg) => {
        const intersects = areSegmentsIntersecting(
          newSegment.start,
          newSegment.end,
          seg.start,
          seg.end,
          true
        );
        return !intersects;
      });
      d.history = getConnectedTrailHistory(d.history, d.currentPos);
      prunedLinesCount += initialHistoryLength - d.history.length;
    }
  });

  const finalMovingDot = updatedDots.find((d) => d.id === movingDotId)!;
  const updatedCapturedHexes: Record<string, 1 | 2> = { ...(gameState.capturedHexes ?? {}) };
  const blackBoxKeys = new Set((gameState.blackBoxes ?? []).map((p) => `${p.r},${p.c}`));

  if (finalMovingDot.characterId === 'tree') {
    if (!finalMovingDot.handPos) {
      // Move 1: Tree stretches to hand (Point B)
      // "head is still at point A but its body streches to point B called hand"
      finalMovingDot.handPos = { ...endPos };
      finalMovingDot.handSegment = {
        id: `${finalMovingDot.id}_hand_${Date.now()}`,
        start: { ...startPos },
        end: { ...endPos },
      };
      finalMovingDot.currentPos = { ...startPos }; // Head remains at point A!
      // Tree body history is NOT erased; previous body (e.g. RA) stays!

      featureMessages.push(
        activePlayer === 1
          ? `Tree stretched hand to (${endPos.r}, ${endPos.c})! Next move from head.`
          : `Bot Tree stretched hand.`
      );
    } else {
      // Move 2: Tree moves from head (Point A) to Point C
      // "region between line AB and AC got colored and not the region surrounding head ( its for classic only )"
      // "tree head will be now at point C"
      // "line AB ( only line AB will disppear and the line RA or AC , they should still be there )"
      const oldHead = { ...startPos }; // Point A
      const hand = { ...finalMovingDot.handPos }; // Point B
      const newHead = { ...endPos }; // Point C

      // 1. Region between line AB and AC gets colored (ONLY region between AB and AC, NOT surrounding head)
      const regionCells = getHexesInTriangleArea(oldHead, hand, newHead);
      let capturedThisTurn = 0;
      for (const cell of regionCells) {
        const key = `${cell.r},${cell.c}`;
        if (!blackBoxKeys.has(key)) {
          // Replaces previous player's color with activePlayer's color:
          updatedCapturedHexes[key] = activePlayer;
          capturedThisTurn++;
        }
      }

      // 2. Tree head will be now at Point C:
      finalMovingDot.currentPos = { ...newHead };

      // 3. Line AB disappears, and line AC is added (line RA and AC both remain in history!):
      finalMovingDot.handPos = undefined;
      finalMovingDot.handSegment = undefined;
      finalMovingDot.history.push({
        id: generateSegmentId(finalMovingDot.id),
        start: { ...oldHead },
        end: { ...newHead },
      });

      featureMessages.push(
        activePlayer === 1
          ? `Tree colored region between hand and new movement (+${capturedThisTurn} hexes)!`
          : `Bot Tree captured region!`
      );
    }
  } else {
    // Classic dot:
    finalMovingDot.currentPos = endPos;
    finalMovingDot.history.push(newSegment);
    // Trail remains continuously connected to root (no shifting/pruning)

    // "all the surrouning hex of the classic head should be colored"
    const paintCells = getSurroundingPaintHexes(endPos);
    let capturedThisTurn = 0;
    for (const cell of paintCells) {
      const key = `${cell.r},${cell.c}`;
      if (!blackBoxKeys.has(key)) {
        updatedCapturedHexes[key] = activePlayer;
        capturedThisTurn++;
      }
    }
    featureMessages.push(
      activePlayer === 1
        ? `Classic colored head and 2 layers of surrounding hexes (+${capturedThisTurn} hexes)!`
        : `Bot Classic colored surrounding hexes!`
    );
  }

  const landedFeatures = getFeaturesAtLanding(endPos, gameState.boardFeatures);

  const featureResult = applyFeaturesOnMove({
    gameState,
    movingDotId,
    movingDot: finalMovingDot,
    endPos,
    touchedPoints,
    newSegment,
    updatedDots,
    activePlayer,
  });

  let resolvedDots = featureResult.dots ?? updatedDots;
  let forcedMoveByPlayer = featureResult.forcedMoveByPlayer
    ? { ...gameState.forcedMoveByPlayer, ...featureResult.forcedMoveByPlayer }
    : { ...gameState.forcedMoveByPlayer };

  featureMessages = [...featureMessages, ...(featureResult.featureMessages ?? [])];

  const proximityResult = applyProximityTrapKills(
    resolvedDots,
    activePlayer,
    obstacles.proximityTraps,
    gameState.boardFeatures
  );
  resolvedDots = proximityResult.dots;
  for (const id of proximityResult.killedIds) {
    if (!killedDots.includes(id)) killedDots.push(id);
  }
  featureMessages = [...featureMessages, ...proximityResult.logMessages];

  const zoneResult = applyZoneTrapKills(
    resolvedDots,
    activePlayer,
    obstacles.zoneTraps,
    moverCoverage,
    gameState.boardFeatures
  );
  resolvedDots = zoneResult.dots;
  for (const id of zoneResult.killedIds) {
    if (!killedDots.includes(id)) killedDots.push(id);
  }
  featureMessages = [...featureMessages, ...zoneResult.logMessages];

  const {
    regions: updatedRegions,
    earned,
    notifications: currencyNotifs,
    claimedByBot,
  } = collectCurrencyRegions(
    endPos,
    gameState.currencyRegions,
    activePlayer,
    gameState.boardFeatures
  );

  for (const id of claimedByBot) {
    const region = gameState.currencyRegions.find((r) => r.id === id);
    if (!region) continue;
    const label = region.type === 'gold' ? 'gold' : region.type === 'silver' ? 'silver' : 'coin';
    featureMessages.push(`Bot captured ${label} treasure — region cleared`);
  }

  const featureNotifs = buildFeatureNotifications(activePlayer, landedFeatures, featureMessages);
  const notifications = [...currencyNotifs, ...featureNotifs];
  const matchEarnings = mergeWallets(gameState.matchEarnings, earned);

  let updatedPlayer1Tokens = { ...player1Tokens };
  let updatedPlayer2Tokens = { ...player2Tokens };
  if (activePlayer === 1) {
    updatedPlayer1Tokens[tokenValue] = Math.max(0, updatedPlayer1Tokens[tokenValue] - 1);
  } else {
    updatedPlayer2Tokens[tokenValue] = Math.max(0, updatedPlayer2Tokens[tokenValue] - 1);
  }

  const nextPlayer = activePlayer === 1 ? 2 : 1;
  if (nextPlayer === 1) {
    updatedPlayer1Tokens = refillTokenPoolIfEmpty(updatedPlayer1Tokens);
  } else {
    updatedPlayer2Tokens = refillTokenPoolIfEmpty(updatedPlayer2Tokens);
  }

  forcedMoveByPlayer = clearForcedMoveAfterTurn(activePlayer, forcedMoveByPlayer);

  const p1AliveCount = resolvedDots.filter((d) => d.player === 1 && d.isAlive).length;
  const p2AliveCount = resolvedDots.filter((d) => d.player === 2 && d.isAlive).length;

  // 50% territory capture threshold
  const totalPlayableHexes =
    GRID_CONFIG.ROWS * GRID_CONFIG.COLS - (gameState.blackBoxes ?? []).length;
  const winCaptureThreshold = Math.ceil(totalPlayableHexes * 0.5);

  const p1Captured = Object.values(updatedCapturedHexes).filter((p) => p === 1).length;
  const p2Captured = Object.values(updatedCapturedHexes).filter((p) => p === 2).length;

  let winner: 1 | 2 | null = null;
  if (p1Captured >= winCaptureThreshold) {
    winner = 1;
  } else if (p2Captured >= winCaptureThreshold) {
    winner = 2;
  } else if (p2AliveCount === 0 && p1AliveCount > 0) {
    winner = 1;
  } else if (p1AliveCount === 0 && p2AliveCount > 0) {
    winner = 2;
  } else if (p1AliveCount === 0 && p2AliveCount === 0) {
    winner = activePlayer;
  }

  return {
    success: true,
    dots: resolvedDots,
    player1Tokens: updatedPlayer1Tokens,
    player2Tokens: updatedPlayer2Tokens,
    activePlayer: winner ? activePlayer : nextPlayer,
    winner,
    prunedLinesCount,
    killedDots,
    currencyRegions: updatedRegions,
    matchEarnings,
    currencyCollectedThisMove: earned,
    forcedMoveByPlayer,
    featureMessages,
    notifications,
    capturedHexes: updatedCapturedHexes,
  };
}

export function hasAnyValidMoves(
  player: 1 | 2,
  dots: Dot[],
  tokens: TokenPool,
  boardFeatures: GameState['boardFeatures'],
  obstacles?: {
    blackBoxes?: Point[];
    proximityTraps?: Point[];
    zoneTraps?: import('../types/game').ZoneTrapCell[];
  }
): boolean {
  const aliveDots = dots.filter((d) => d.player === player && d.isAlive);
  if (aliveDots.length === 0) return false;

  const pool = getEffectiveTokenPool(tokens);
  const availableTokens = Object.keys(pool)
    .map(Number)
    .filter((val) => pool[val] > 0);
  if (availableTokens.length === 0) return false;

  const directions: Direction[] = HEX_DIRECTIONS;

  for (const dot of aliveDots) {
    for (const token of availableTokens) {
      for (const dir of directions) {
        const dest = getDestination(dot.currentPos, dir, token);
        const path = getCellsAlongPath(dot.currentPos, dest);
        const coverage = getMoveCoverageCells(path);
        if (
          isWithinBounds(dest) &&
          coverage.every(isWithinBounds) &&
          !pathCrossesImpassable(coverage, {
            blackBoxes: obstacles?.blackBoxes ?? [],
            proximityTraps: obstacles?.proximityTraps ?? [],
            zoneTraps: obstacles?.zoneTraps ?? [],
          }) &&
          canLandAt(dest, dot.id, dots, boardFeatures, obstacles) &&
          !pathCrossesOwnTrail(dot.id, path, dots)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export function resolveEndGameWinner(dots: Dot[], capturedHexes?: Record<string, 1 | 2>): 1 | 2 {
  if (capturedHexes) {
    const p1Count = Object.values(capturedHexes).filter((p) => p === 1).length;
    const p2Count = Object.values(capturedHexes).filter((p) => p === 2).length;
    if (p1Count > p2Count) return 1;
    if (p2Count > p1Count) return 2;
  }
  const p1Alive = dots.filter((d) => d.player === 1 && d.isAlive);
  const p2Alive = dots.filter((d) => d.player === 2 && d.isAlive);

  if (p1Alive.length > p2Alive.length) return 1;
  if (p2Alive.length > p1Alive.length) return 2;

  const maxRow = GRID_CONFIG.ROWS - 1;
  const p1Score = p1Alive.reduce((sum, d) => sum + (maxRow - d.currentPos.r), 0);
  const p2Score = p2Alive.reduce((sum, d) => sum + d.currentPos.r, 0);

  if (p1Score > p2Score) return 1;
  if (p2Score > p1Score) return 2;

  return 1;
}
