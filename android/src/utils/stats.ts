import { getStoredJson, setStoredJson, STORAGE_KEYS } from './storage';

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
}

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
};

export async function getStats(): Promise<GameStats> {
  return getStoredJson<GameStats>(STORAGE_KEYS.STATS, DEFAULT_STATS);
}

export async function saveStats(stats: GameStats): Promise<void> {
  await setStoredJson(STORAGE_KEYS.STATS, stats);
}

export async function recordGameOutcome(outcome: 'win' | 'loss'): Promise<GameStats> {
  const current = await getStats();
  const updated: GameStats = {
    gamesPlayed: current.gamesPlayed + 1,
    wins: current.wins + (outcome === 'win' ? 1 : 0),
    losses: current.losses + (outcome === 'loss' ? 1 : 0),
  };
  await saveStats(updated);
  return updated;
}

export async function resetStats(): Promise<void> {
  await saveStats(DEFAULT_STATS);
}
