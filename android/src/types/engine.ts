import { Dot, TokenPool, PlayerWallet, ForcedMoveByPlayer, CurrencyRegion } from './game';
import { MoveNotification } from './notifications';

export interface EngineResult {
  success: boolean;
  error?: string;
  dots: Dot[];
  player1Tokens: TokenPool;
  player2Tokens: TokenPool;
  activePlayer: 1 | 2;
  winner: 1 | 2 | null;
  prunedLinesCount: number;
  killedDots: string[];
  currencyRegions: CurrencyRegion[];
  matchEarnings: PlayerWallet;
  currencyCollectedThisMove: PlayerWallet;
  forcedMoveByPlayer: ForcedMoveByPlayer;
  featureMessages: string[];
  notifications: MoveNotification[];
  capturedHexes?: Record<string, 1 | 2>;
}
