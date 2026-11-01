import { CharacterId, PlayerWallet } from './game';

export interface MatchRecord {
  id: string;
  timestamp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  winner: 1 | 2;
  characterIds: CharacterId[];
  earnings: PlayerWallet;
  moveCount: number;
}
