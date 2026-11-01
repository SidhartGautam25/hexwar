import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Dot, TokenPool, Direction, CharacterId, CurrencyRegion, PlayerWallet, Point } from '../types/game';
import { EMPTY_FORCED_MOVE } from '../types/boardFeatures';
import { MoveNotification } from '../types/notifications';
import {
  createInitialDots,
  INITIAL_TOKEN_POOL,
  createFreshCurrencyRegions,
  GRID_CONFIG,
} from '../constants/board';
import { createBoardFeatures } from '../constants/boardFeaturePlacements';
import { executeShot, hasAnyValidMoves } from '../engine/paperEngine';
import { getRequiredDotIdForPlayer } from '../engine/boardFeatureEngine';
import { refillTokenPoolIfEmpty, getEffectiveTokenPool } from '../utils/tokenPool';
import { recordGameOutcome } from '../utils/stats';
import { getBestMove } from '../engine/aiEngine';
import { getCharacter, DEFAULT_CHARACTER_LOADOUT } from '../constants/characters';
import { EMPTY_WALLET } from '../utils/wallet';
import { addToWallet } from '../utils/wallet';
import { appendMatchRecord } from '../utils/matchHistory';
import { EMPTY_BOARD_OBSTACLES, LevelBoardObstacles } from '../engine/boardObstacleEngine';

function getCharacterLabel(dotId: string, dots: Dot[]): string {
  const dot = dots.find((d) => d.id === dotId);
  if (!dot) {
    const num = dotId.split('_')[1] || '1';
    return `Dot ${num}`;
  }
  const char = getCharacter(dot.characterId);
  return `${dot.player === 1 ? 'Player' : 'Bot'} ${char.name}`;
}

export function usePaperSession(
  initialDifficulty: 'easy' | 'medium' | 'hard' = 'medium',
  characterLoadout: CharacterId[] = DEFAULT_CHARACTER_LOADOUT,
  botLoadout: CharacterId[] = characterLoadout,
  boardObstacles: LevelBoardObstacles = EMPTY_BOARD_OBSTACLES,
  botDelayMs: number = 800
) {
  const [dots, setDots] = useState<Dot[]>(() => createInitialDots(characterLoadout, botLoadout));
  const [player1Tokens, setPlayer1Tokens] = useState<TokenPool>(INITIAL_TOKEN_POOL);
  const [player2Tokens, setPlayer2Tokens] = useState<TokenPool>(INITIAL_TOKEN_POOL);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [historyLogs, setHistoryLogs] = useState<string[]>([]);
  const [capturedHexes, setCapturedHexes] = useState<Record<string, 1 | 2>>({});
  const [currencyRegions, setCurrencyRegions] = useState<CurrencyRegion[]>(() =>
    createFreshCurrencyRegions()
  );
  const [matchEarnings, setMatchEarnings] = useState<PlayerWallet>(EMPTY_WALLET);
  const [boardFeatures] = useState(() => createBoardFeatures());
  const [forcedMoveByPlayer, setForcedMoveByPlayer] = useState(EMPTY_FORCED_MOVE);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialDifficulty);
  const [notificationQueue, setNotificationQueue] = useState<MoveNotification[]>([]);
  const matchSavedRef = useRef(false);

  const [selectedDotId, setSelectedDotId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [lastMovedP1DotId, setLastMovedP1DotId] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const activeNotification = notificationQueue[0] ?? null;
  const isBotBlocked = notificationQueue.length > 0;

  const dismissNotification = useCallback(() => {
    setNotificationQueue((prev) => prev.slice(1));
  }, []);

  useEffect(() => {
    const aliveP1Dots = dots.filter((d) => d.player === 1 && d.isAlive);
    const forcedId = getRequiredDotIdForPlayer(1, forcedMoveByPlayer, dots);
    const lastMovedStillAlive =
      lastMovedP1DotId != null && aliveP1Dots.some((d) => d.id === lastMovedP1DotId);

    if (activePlayer === 1 && !winner) {
      if (forcedId) {
        setSelectedDotId(forcedId);
      } else if (lastMovedStillAlive) {
        setSelectedDotId(lastMovedP1DotId);
      } else if (aliveP1Dots.length > 0) {
        setSelectedDotId(aliveP1Dots[0].id);
      } else {
        setSelectedDotId(null);
      }
    } else {
      setSelectedDotId(null);
    }
    setSelectedToken(null);
    setSelectedDirection(null);
  }, [activePlayer, dots, forcedMoveByPlayer, winner, lastMovedP1DotId]);

  useEffect(() => {
    if (winner) return;
    if (activePlayer === 1) {
      setPlayer1Tokens((prev) => refillTokenPoolIfEmpty(prev));
    } else {
      setPlayer2Tokens((prev) => refillTokenPoolIfEmpty(prev));
    }
  }, [activePlayer, winner]);

  useEffect(() => {
    setDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  useEffect(() => {
    if (winner === null) {
      matchSavedRef.current = false;
      return;
    }
    if (matchSavedRef.current) return;
    matchSavedRef.current = true;

    recordGameOutcome(winner === 1 ? 'win' : 'loss');

    if (matchEarnings.gold > 0 || matchEarnings.silver > 0 || matchEarnings.money > 0) {
      addToWallet(matchEarnings);
    }

    appendMatchRecord({
      id: `match_${Date.now()}`,
      timestamp: Date.now(),
      difficulty,
      winner,
      characterIds: characterLoadout,
      earnings: matchEarnings,
      moveCount: historyLogs.length,
    });
  }, [winner, matchEarnings, difficulty, characterLoadout, historyLogs.length]);

  const buildGameState = (): GameState => ({
    dots,
    player1Tokens,
    player2Tokens,
    activePlayer,
    winner,
    historyLogs,
    currencyRegions,
    matchEarnings,
    boardFeatures,
    forcedMoveByPlayer,
    blackBoxes: boardObstacles.blackBoxes,
    proximityTraps: boardObstacles.proximityTraps,
    zoneTraps: boardObstacles.zoneTraps,
    capturedHexes,
  });

  const applyMoveResult = (result: ReturnType<typeof executeShot>, logMsg: string) => {
    setDots(result.dots);
    setPlayer1Tokens(result.player1Tokens);
    setPlayer2Tokens(result.player2Tokens);
    setActivePlayer(result.activePlayer);
    setWinner(result.winner);
    setCurrencyRegions(result.currencyRegions);
    setMatchEarnings(result.matchEarnings);
    setForcedMoveByPlayer(result.forcedMoveByPlayer);
    if (result.capturedHexes) {
      setCapturedHexes(result.capturedHexes);
    }

    if (result.notifications.length > 0) {
      setNotificationQueue((prev) => [...prev, ...result.notifications]);
    }

    let fullLog = logMsg;
    if (result.featureMessages.length > 0) {
      fullLog += ` ⚡ ${result.featureMessages.join('; ')}`;
    }
    const c = result.currencyCollectedThisMove;
    if (c.gold > 0 || c.silver > 0 || c.money > 0) {
      const parts: string[] = [];
      if (c.gold > 0) parts.push(`🪙${c.gold}`);
      if (c.silver > 0) parts.push(`🥈${c.silver}`);
      if (c.money > 0) parts.push(`💵${c.money}`);
      fullLog += ` 💰 Collected ${parts.join(' ')}`;
    }
    setHistoryLogs((prev) => [fullLog, ...prev]);
  };

  useEffect(() => {
    if (activePlayer !== 2 || winner || isBotBlocked) {
      if (isBotBlocked) setIsAiThinking(false);
      return;
    }

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const currentGameState = buildGameState();
      const bestMove = getBestMove(currentGameState, difficulty);

      if (bestMove) {
        if (bestMove.treeHeadId) {
          const botDot = currentGameState.dots.find((d) => d.id === bestMove.dotId);
          if (botDot && botDot.treeNodes) {
            const headNode = botDot.treeNodes.find((n) => n.id === bestMove.treeHeadId);
            if (headNode) {
              botDot.currentPos = headNode.pos;
              botDot.activeHeadNodeId = headNode.id;
            }
          }
        }
        const result = executeShot(
          bestMove.dotId,
          bestMove.direction,
          bestMove.tokenValue,
          currentGameState
        );
        if (result.success) {
          const botDotLabel = getCharacterLabel(bestMove.dotId, currentGameState.dots);
          let logMsg = `${botDotLabel} shoots ${bestMove.direction} (dist ${bestMove.tokenValue})`;
          if (result.killedDots.length > 0) {
            const killedLabels = result.killedDots.map((id) =>
              getCharacterLabel(id, result.dots)
            );
            logMsg += ` 🎯 KILLS ${killedLabels.join(', ')}!`;
          }
          if (result.prunedLinesCount > 0) {
            logMsg += ` ✂️ (pruned ${result.prunedLinesCount} paths)`;
          }
          applyMoveResult(result, logMsg);
        } else {
          setActivePlayer(1);
        }
      } else {
        setHistoryLogs((prev) => ['Bot has no available moves. Turn passed to Player.', ...prev]);
        setActivePlayer(1);
      }
      setIsAiThinking(false);
    }, botDelayMs);

    return () => clearTimeout(timer);
  }, [
    activePlayer,
    winner,
    isBotBlocked,
    dots,
    player1Tokens,
    player2Tokens,
    difficulty,
    currencyRegions,
    matchEarnings,
    forcedMoveByPlayer,
    boardFeatures,
    botDelayMs,
  ]);

  const selectDot = (dotId: string) => {
    if (activePlayer !== 1 || winner || isBotBlocked) return;
    const forcedId = getRequiredDotIdForPlayer(1, forcedMoveByPlayer, dots);
    if (forcedId && dotId !== forcedId) return;
    const dot = dots.find((d) => d.id === dotId);
    if (dot && dot.player === 1 && dot.isAlive) {
      setSelectedDotId(dotId);
    }
  };

  const selectToken = (value: number) => {
    if (activePlayer !== 1 || winner || isBotBlocked) return;
    const effectivePool = getEffectiveTokenPool(player1Tokens);
    if ((effectivePool[value] ?? 0) > 0) {
      setSelectedToken(value);
      if (!selectedDotId) {
        const forcedId = getRequiredDotIdForPlayer(1, forcedMoveByPlayer, dots);
        if (forcedId) {
          setSelectedDotId(forcedId);
        } else if (
          lastMovedP1DotId &&
          dots.some((d) => d.id === lastMovedP1DotId && d.player === 1 && d.isAlive)
        ) {
          setSelectedDotId(lastMovedP1DotId);
        } else {
          const firstAlive = dots.find((d) => d.player === 1 && d.isAlive);
          if (firstAlive) {
            setSelectedDotId(firstAlive.id);
          }
        }
      }
    }
  };

  const selectDirection = (dir: Direction) => {
    if (activePlayer !== 1 || winner || isBotBlocked) return;
    setSelectedDirection(dir);
  };

  const executeMove = (
    directionOverride?: Direction,
    dotIdOverride?: string
  ): { success: boolean; error?: string } => {
    if (activePlayer !== 1 || winner || isBotBlocked) {
      return { success: false, error: isBotBlocked ? 'Please wait…' : 'Not your turn.' };
    }
    const direction = directionOverride ?? selectedDirection;
    const dotId = dotIdOverride ?? selectedDotId;
    if (!dotId || selectedToken === null || !direction) {
      return { success: false, error: 'Please choose a Dot, Token, and Direction.' };
    }

    const result = executeShot(dotId, direction, selectedToken, buildGameState());
    if (result.success) {
      const playerDotLabel = getCharacterLabel(dotId, dots);
      let logMsg = `${playerDotLabel} shoots ${direction} (dist ${selectedToken})`;
      if (result.killedDots.length > 0) {
        const killedLabels = result.killedDots.map((id) => getCharacterLabel(id, result.dots));
        logMsg += ` 🎯 KILLS ${killedLabels.join(', ')}!`;
      }
      if (result.prunedLinesCount > 0) {
        logMsg += ` ✂️ (pruned ${result.prunedLinesCount} paths)`;
      }
      applyMoveResult(result, logMsg);

      setLastMovedP1DotId(dotId);
      setSelectedDotId(null);
      setSelectedToken(null);
      setSelectedDirection(null);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const passTurn = () => {
    if (activePlayer !== 1 || winner || isBotBlocked) return;
    setActivePlayer(2);
    setHistoryLogs((prev) => ['Player passed turn.', ...prev]);
  };

  const selectTreeHead = (dotId: string, headId: string) => {
    if (activePlayer !== 1 || winner || isBotBlocked) return;
    const dot = dots.find((d) => d.id === dotId);
    if (!dot || dot.player !== 1 || !dot.isAlive) return;
    if (dot.characterId === 'tree') {
      const headNode = dot.treeNodes?.find((n) => n.id === headId);
      if (headNode) {
        setDots((prev) =>
          prev.map((d) =>
            d.id === dotId
              ? { ...d, currentPos: { ...headNode.pos }, activeHeadNodeId: headId }
              : d
          )
        );
        setSelectedDotId(dotId);
      }
    }
  };

  const resetGame = () => {
    setDots(createInitialDots(characterLoadout, botLoadout));
    setPlayer1Tokens(INITIAL_TOKEN_POOL);
    setPlayer2Tokens(INITIAL_TOKEN_POOL);
    setActivePlayer(1);
    setWinner(null);
    setHistoryLogs([]);
    setCapturedHexes({});
    setCurrencyRegions(createFreshCurrencyRegions());
    setMatchEarnings(EMPTY_WALLET);
    setForcedMoveByPlayer(EMPTY_FORCED_MOVE);
    setNotificationQueue([]);
    setSelectedDotId(null);
    setSelectedToken(null);
    setSelectedDirection(null);
    setLastMovedP1DotId(null);
    setIsAiThinking(false);
    matchSavedRef.current = false;
  };

  const totalPlayableHexes =
    GRID_CONFIG.ROWS * GRID_CONFIG.COLS - (boardObstacles.blackBoxes ?? []).length;
  const p1CapturedCount = Object.values(capturedHexes).filter((p) => p === 1).length;
  const p2CapturedCount = Object.values(capturedHexes).filter((p) => p === 2).length;
  const p1Percent =
    totalPlayableHexes > 0 ? Math.round((p1CapturedCount / totalPlayableHexes) * 100) : 0;
  const p2Percent =
    totalPlayableHexes > 0 ? Math.round((p2CapturedCount / totalPlayableHexes) * 100) : 0;

  return {
    dots,
    player1Tokens,
    player2Tokens,
    activePlayer,
    winner,
    historyLogs,
    currencyRegions,
    matchEarnings,
    boardFeatures,
    forcedMoveByPlayer,
    difficulty,
    setDifficulty,
    selectedDotId,
    selectedToken,
    selectedDirection,
    isAiThinking,
    isBotBlocked,
    activeNotification,
    dismissNotification,
    selectDot,
    selectTreeHead,
    selectToken,
    selectDirection,
    executeMove,
    passTurn,
    resetGame,
    characterLoadout,
    botLoadout,
    boardObstacles,
    capturedHexes,
    p1CapturedCount,
    p2CapturedCount,
    p1Percent,
    p2Percent,
    totalPlayableHexes,
  };
}
