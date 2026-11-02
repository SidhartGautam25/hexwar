import { TokenPool } from '../types/game';

export const ALL_TOKEN_VALUES = [1, 2, 3, 4, 5, 6] as const;
const FREE_PLAY_VALUES = [1, 2, 3] as const;

export function isTokenPoolEmpty(pool: TokenPool): boolean {
  return ALL_TOKEN_VALUES.every((value) => (pool[value] ?? 0) <= 0);
}

/** No refill after cards are spent — both players get their 4 chances per number. */
export function refillTokenPoolIfEmpty(pool: TokenPool): TokenPool {
  return pool;
}

/**
 * Both players get exact token counts (no unlimited 1, 2, 3 after cards are used up).
 */
export function getEffectiveTokenPool(pool: TokenPool): TokenPool {
  return pool;
}

export function isFreePlay(_pool: TokenPool): boolean {
  return false;
}

export function freePlayValues(): readonly number[] {
  return FREE_PLAY_VALUES;
}
