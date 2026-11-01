import { GameState, Dot, TokenPool, Direction, Point } from '../types/game';
import { getCellsAlongPath, getDestination, isWithinBounds, HEX_DIRECTIONS, pointsEqual } from './geometry';
import { getTreeActiveHeads, pathCrossesOwnTrail, getMoveCoverageCells } from './characterEngine';
import { getEffectiveTokenPool } from '../utils/tokenPool';
import { executeShot } from './paperEngine';
import { getRequiredDotIdForPlayer, canLandAt } from './boardFeatureEngine';
import { getObstaclesFromState, pathCrossesImpassable } from './boardObstacleEngine';

export interface AIMove {
  dotId: string;
  tokenValue: number;
  direction: Direction;
  treeHeadId?: string;
}

/**
 * Generates all valid and legal moves for the current active player.
 */
export function getLegalMoves(gameState: GameState): AIMove[] {
  const legalMoves: AIMove[] = [];
  const activePlayer = gameState.activePlayer;
  const activePool = getEffectiveTokenPool(
    activePlayer === 1 ? gameState.player1Tokens : gameState.player2Tokens
  );
  const activeDots = gameState.dots.filter((d) => d.player === activePlayer && d.isAlive);
  const requiredDotId = getRequiredDotIdForPlayer(
    activePlayer,
    gameState.forcedMoveByPlayer,
    gameState.dots
  );
  const eligibleDots = requiredDotId
    ? activeDots.filter((d) => d.id === requiredDotId)
    : activeDots;

  // Get token values that have remaining stock
  const availableTokens = Object.keys(activePool)
    .map(Number)
    .filter((val) => activePool[val] > 0);

  const directions: Direction[] = HEX_DIRECTIONS;

  for (const dot of eligibleDots) {
    const candidateHeads: { pos: Point; headId?: string }[] = [];
    if (dot.characterId === 'tree') {
      const activeHeads = getTreeActiveHeads(dot);
      if (activeHeads.length > 0) {
        for (const h of activeHeads) {
          candidateHeads.push({ pos: h.pos, headId: h.id });
        }
      } else {
        candidateHeads.push({ pos: dot.currentPos, headId: dot.activeHeadNodeId });
      }
    } else {
      candidateHeads.push({ pos: dot.currentPos });
    }

    for (const head of candidateHeads) {
      // Temporarily set currentPos and activeHeadNodeId if needed for path check
      const origPos = dot.currentPos;
      const origHead = dot.activeHeadNodeId;
      dot.currentPos = head.pos;
      if (head.headId) dot.activeHeadNodeId = head.headId;

      for (const token of availableTokens) {
        for (const dir of directions) {
          const dest = getDestination(head.pos, dir, token);
          const path = getCellsAlongPath(head.pos, dest);
          const coverage = getMoveCoverageCells(path);
          if (
            isWithinBounds(dest) &&
            coverage.every(isWithinBounds) &&
            !pathCrossesImpassable(coverage, getObstaclesFromState(gameState)) &&
            canLandAt(dest, dot.id, gameState.dots, gameState.boardFeatures, getObstaclesFromState(gameState)) &&
            !pathCrossesOwnTrail(dot.id, path, gameState.dots)
          ) {
            legalMoves.push({
              dotId: dot.id,
              tokenValue: token,
              direction: dir,
              treeHeadId: head.headId,
            });
          }
        }
      }

      dot.currentPos = origPos;
      dot.activeHeadNodeId = origHead;
    }
  }

  return legalMoves;
}

/**
 * Heuristically scores a candidate move.
 */
function scoreMove(move: AIMove, gameState: GameState, difficulty: 'medium' | 'hard'): number {
  const movingDot = gameState.dots.find((d) => d.id === move.dotId);
  const origPos = movingDot?.currentPos;
  const origHead = movingDot?.activeHeadNodeId;
  if (movingDot && move.treeHeadId) {
    const headNode = movingDot.treeNodes?.find((n) => n.id === move.treeHeadId);
    if (headNode) {
      movingDot.currentPos = headNode.pos;
      movingDot.activeHeadNodeId = headNode.id;
    }
  }

  const result = executeShot(move.dotId, move.direction, move.tokenValue, gameState);

  if (movingDot && origPos) {
    movingDot.currentPos = origPos;
    movingDot.activeHeadNodeId = origHead;
  }

  if (!result.success) {
    return -99999;
  }

  let score = 0;

  // 1. Immediate Win
  if (result.winner === gameState.activePlayer) {
    return 10000;
  }

  // 2. Kills (Direct hits or Line cuts)
  if (result.killedDots.length > 0) {
    score += result.killedDots.length * 1000;
  }

  // 3. Territory captured reward
  if (result.capturedHexes) {
    const beforeCount = Object.values(gameState.capturedHexes ?? {}).filter(
      (p) => p === gameState.activePlayer
    ).length;
    const afterCount = Object.values(result.capturedHexes).filter(
      (p) => p === gameState.activePlayer
    ).length;
    const gained = afterCount - beforeCount;
    score += gained * 40;
  }

  // 4. Self-cancellation penalty (try to avoid pruning own lines)
  score -= result.prunedLinesCount * 150;

  // Medium difficulty only seeks immediate kills and captures
  if (difficulty === 'medium') {
    return score;
  }

  // Hard difficulty lookahead threat check & positional heuristics
  const opponent = gameState.activePlayer === 1 ? 2 : 1;
  const opponentResultState: GameState = {
    dots: result.dots,
    player1Tokens: result.player1Tokens,
    player2Tokens: result.player2Tokens,
    activePlayer: opponent,
    winner: result.winner,
    historyLogs: [],
    currencyRegions: result.currencyRegions,
    matchEarnings: result.matchEarnings,
    boardFeatures: gameState.boardFeatures,
    forcedMoveByPlayer: result.forcedMoveByPlayer,
    blackBoxes: gameState.blackBoxes,
    proximityTraps: gameState.proximityTraps,
    zoneTraps: gameState.zoneTraps,
    capturedHexes: result.capturedHexes,
  };

  const opponentLegalMoves = getLegalMoves(opponentResultState);
  let maxOpponentDamage = 0;

  for (const oppMove of opponentLegalMoves) {
    const oppResult = executeShot(oppMove.dotId, oppMove.direction, oppMove.tokenValue, opponentResultState);
    if (oppResult.success) {
      const killedOurDots = oppResult.killedDots.filter((id) => {
        const dot = result.dots.find((d) => d.id === id);
        return dot && dot.player === gameState.activePlayer;
      });

      if (killedOurDots.length > 0) {
        maxOpponentDamage = Math.max(maxOpponentDamage, killedOurDots.length * 900);
        if (maxOpponentDamage >= 900) {
          break; // Already proven fatally vulnerable to opponent counter-attack
        }
      }
    }
  }

  // Penalize moving into a position where the opponent can cut or hit you next turn
  score -= maxOpponentDamage;

  // Positional heuristics: get closer to the opponent, but not vulnerable
  const myDot = result.dots.find((d) => d.id === move.dotId);
  if (myDot) {
    const myPos = myDot.currentPos;
    const enemyDots = result.dots.filter((d) => d.player === opponent && d.isAlive);

    let minEnemyDist = Infinity;
    for (const enemy of enemyDots) {
      const dist = Math.abs(myPos.r - enemy.currentPos.r) + Math.abs(myPos.c - enemy.currentPos.c);
      if (dist < minEnemyDist) {
        minEnemyDist = dist;
      }
    }

    if (minEnemyDist !== Infinity) {
      // Optimal range: 2-4 moves away (close enough to threaten, but safe)
      if (minEnemyDist >= 2 && minEnemyDist <= 4) {
        score += 60;
      } else if (minEnemyDist === 1) {
        score += 15; // Threatening, but adjacent is volatile
      } else {
        score -= minEnemyDist * 10; // Penalize being too far
      }
    }
  }

  // Prevent burning high value tokens (5s) unless strategically justified
  if (move.tokenValue >= 5) {
    score -= 10;
  }

  return score;
}

/**
 * Returns the best move for the AI.
 */
export function getBestMove(
  gameState: GameState,
  difficulty: 'easy' | 'medium' | 'hard'
): AIMove | null {
  const legalMoves = getLegalMoves(gameState);
  if (legalMoves.length === 0) return null;

  if (difficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }

  let bestMoves: AIMove[] = [];
  let bestScore = -Infinity;

  for (const move of legalMoves) {
    const score = scoreMove(move, gameState, difficulty);
    if (score >= 10000) {
      // Immediate win found — execute immediately!
      return move;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  const randomIndex = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[randomIndex];
}
