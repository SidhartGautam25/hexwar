import { TokenPool } from '../types/game';

export const ALL_TOKEN_VALUES = [1, 2, 3, 4, 5, 6] as const;
const FREE_PLAY_VALUES = [1, 2, 3] as const;

export function isTokenPoolEmpty(pool: TokenPool): boolean {
  return ALL_TOKEN_VALUES.every((value) => (pool[value] ?? 0) <= 0);
}

/** Starting stock is unchanged. Free use of 1, 2, and 3 is applied when the pool is read. */
export function refillTokenPoolIfEmpty(pool: TokenPool): TokenPool {
  return pool;
}

/**
 * After every card is spent, distances 1, 2, and 3 stay available until the match ends.
 * Longer cards stay empty.
 */
export function getEffectiveTokenPool(pool: TokenPool): TokenPool {
  if (!isTokenPoolEmpty(pool)) return pool;
  return {
    ...pool,
    1: 1,
    2: 1,
    3: 1,
    4: 0,
    5: 0,
    6: 0,
  };
}

export function isFreePlay(pool: TokenPool): boolean {
  return isTokenPoolEmpty(pool);
}

export function freePlayValues(): readonly number[] {
  return FREE_PLAY_VALUES;
}
