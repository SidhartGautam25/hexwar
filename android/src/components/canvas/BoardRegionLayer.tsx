import React from 'react';
import { G } from 'react-native-svg';
import { CurrencyRegion } from '../../types/game';
import { BoardFeatureInstance, BoardFeatureTypeId } from '../../types/boardFeatures';
import { regionLabelPosition } from '../../utils/regionRender';
import { isSameRegionOrigin } from '../../types/gridRegion';
import { REGION_NODE_STYLES } from '../../constants/regionNodeStyles';
import { RegionNodeFrame } from './RegionNodeFrame';
import {
  GoldCoinGlyph,
  SilverCoinGlyph,
  MoneyCoinGlyph,
  ShieldGlyph,
  TrailEraseGlyph,
  LockGlyph,
} from './RegionGlyphs';

const FEATURE_GLYPH: Record<BoardFeatureTypeId, React.FC<{ cx: number; cy: number; size: number }>> = {
  shield_zone: ShieldGlyph,
  trail_erase: TrailEraseGlyph,
  forced_lock: LockGlyph,
};

const CURRENCY_GLYPH = {
  gold: GoldCoinGlyph,
  silver: SilverCoinGlyph,
  money: MoneyCoinGlyph,
} as const;

interface BoardRegionLayerProps {
  currencyRegions: CurrencyRegion[];
  boardFeatures: BoardFeatureInstance[];
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

export const BoardRegionLayer: React.FC<BoardRegionLayerProps> = ({
  currencyRegions,
  boardFeatures,
  cellSize,
  offsetX,
  offsetY,
}) => {
  const glyphSize = cellSize * 0.95;

  return (
    <G>
      {currencyRegions
        .filter((r) => !r.collected)
        .filter(
          (region) =>
            !boardFeatures.some((feature) => isSameRegionOrigin(feature.origin, region.origin))
        )
        .map((region) => {
          const nodeStyle = REGION_NODE_STYLES[region.type];
          const { x, y } = regionLabelPosition(region.origin, cellSize, offsetX, offsetY);
          const Glyph = CURRENCY_GLYPH[region.type];
          return (
            <RegionNodeFrame
              key={region.id}
              origin={region.origin}
              style={nodeStyle}
              cellSize={cellSize}
              offsetX={offsetX}
              offsetY={offsetY}
              subtle
              glyph={<Glyph cx={x} cy={y - 1} size={glyphSize} />}
            />
          );
        })}

      {boardFeatures.map((feature) => {
        const nodeStyle = REGION_NODE_STYLES[feature.typeId];
        const { x, y } = regionLabelPosition(feature.origin, cellSize, offsetX, offsetY);
        const Glyph = FEATURE_GLYPH[feature.typeId];
        return (
          <RegionNodeFrame
            key={feature.id}
            origin={feature.origin}
            style={nodeStyle}
            cellSize={cellSize}
            offsetX={offsetX}
            offsetY={offsetY}
            glyph={<Glyph cx={x} cy={y - 1} size={glyphSize} />}
          />
        );
      })}
    </G>
  );
};
