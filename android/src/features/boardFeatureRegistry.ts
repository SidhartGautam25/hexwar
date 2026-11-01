import {
  BoardFeatureDefinition,
  BoardFeatureMoveContext,
  BoardFeatureMoveResult,
  BoardFeatureTypeId,
} from '../types/boardFeatures';
import { getConnectedTrailHistory } from '../engine/geometry';

const shieldZone: BoardFeatureDefinition = {
  typeId: 'shield_zone',
  name: 'Sanctuary',
  shortLabel: 'SH',
  description: 'A dot standing on the sanctuary hex cannot be cut. Only one dot may occupy that hex — trails may still cross it.',
  visual: {
    stroke: '#38BDF8',
    fill: 'rgba(56, 189, 248, 0.14)',
    glyph: '⛨',
    ringDash: '4, 3',
  },
  protectsOccupant: true,
};

const trailErase: BoardFeatureDefinition = {
  typeId: 'trail_erase',
  name: 'Trail Purge',
  shortLabel: 'ER',
  description: 'Crossing this zone erases your oldest trail segment — the line farthest from your dot.',
  visual: {
    stroke: '#F97316',
    fill: 'rgba(249, 115, 22, 0.12)',
    glyph: '⌫',
    ringDash: '2, 4',
  },
  onDotLanded: (ctx: BoardFeatureMoveContext): BoardFeatureMoveResult => {
    const dots = ctx.updatedDots.map((d) => ({
      ...d,
      currentPos: { ...d.currentPos },
      history: [...d.history],
    }));
    const dot = dots.find((d) => d.id === ctx.movingDotId);
    if (dot && dot.history.length > 0) {
      // Remove the segment farthest from the dot (oldest in history), not the approach line.
      dot.history.shift();
      dot.history = getConnectedTrailHistory(dot.history, dot.currentPos);
      return {
        dots,
        featureMessages: ['Trail Purge region: oldest trail segment erased'],
      };
    }
    return {};
  },
};

const forcedLock: BoardFeatureDefinition = {
  typeId: 'forced_lock',
  name: 'Lock Tile',
  shortLabel: 'LK',
  description: 'Crossing this zone locks this dot for your next turn.',
  visual: {
    stroke: '#EF4444',
    fill: 'rgba(239, 68, 68, 0.1)',
    glyph: '🔒',
    ringDash: '6, 2',
  },
  onDotLanded: (ctx: BoardFeatureMoveContext): BoardFeatureMoveResult => ({
    forcedMoveByPlayer: { [ctx.activePlayer]: ctx.movingDotId },
    featureMessages: ['Lock region: this dot is locked for your next turn'],
  }),
};

export const BOARD_FEATURE_REGISTRY: Record<BoardFeatureTypeId, BoardFeatureDefinition> = {
  shield_zone: shieldZone,
  trail_erase: trailErase,
  forced_lock: forcedLock,
};

export const BOARD_FEATURE_LIST = Object.values(BOARD_FEATURE_REGISTRY);

export function getBoardFeatureDefinition(typeId: BoardFeatureTypeId): BoardFeatureDefinition {
  return BOARD_FEATURE_REGISTRY[typeId];
}
