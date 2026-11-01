import { BoardFeatureInstance } from '../types/boardFeatures';
import { INITIAL_CURRENCY_REGIONS } from './board';
import { assertUniqueRegionOrigins } from '../types/gridRegion';

/** Region-based special tiles — reduced density vs point markers. */
export const BOARD_FEATURE_PLACEMENTS: BoardFeatureInstance[] = [
  { id: 'shield_center', typeId: 'shield_zone', origin: { r: 10, c: 7 } },
  { id: 'erase_bot', typeId: 'trail_erase', origin: { r: 2, c: 7 } },
  { id: 'erase_player', typeId: 'trail_erase', origin: { r: 19, c: 7 } },
  { id: 'lock_bot', typeId: 'forced_lock', origin: { r: 5, c: 4 } },
  { id: 'lock_player', typeId: 'forced_lock', origin: { r: 15, c: 10 } },
];

assertUniqueRegionOrigins([
  ...INITIAL_CURRENCY_REGIONS.map((region) => ({ id: region.id, origin: region.origin })),
  ...BOARD_FEATURE_PLACEMENTS.map((feature) => ({ id: feature.id, origin: feature.origin })),
]);

export function createBoardFeatures(): BoardFeatureInstance[] {
  // Board position powers disabled from board effect for now
  return [];
  /*
  return BOARD_FEATURE_PLACEMENTS.map((f) => ({
    ...f,
    origin: { ...f.origin },
  }));
  */
}
