import { BoardFeatureTypeId } from '../types/boardFeatures';
import { CurrencyType } from '../types/game';

export type RegionNodeKind = CurrencyType | BoardFeatureTypeId;

export type BracketStyle = 'vault' | 'core' | 'stack' | 'shield' | 'lock' | 'purge';

export interface RegionNodeStyle {
  primary: string;
  secondary: string;
  fill: string;
  innerGlow: string;
  borderDash: string;
  bracketStyle: BracketStyle;
}

export const REGION_NODE_STYLES: Record<RegionNodeKind, RegionNodeStyle> = {
  gold: {
    primary: '#9A7B2E',
    secondary: '#B8954A',
    fill: 'rgba(180, 140, 40, 0.06)',
    innerGlow: 'rgba(180, 140, 40, 0.1)',
    borderDash: '3,2',
    bracketStyle: 'vault',
  },
  silver: {
    primary: '#8B9AAB',
    secondary: '#A8B4C4',
    fill: 'rgba(148, 163, 184, 0.05)',
    innerGlow: 'rgba(148, 163, 184, 0.08)',
    borderDash: '2,3',
    bracketStyle: 'core',
  },
  money: {
    primary: '#3D8F5F',
    secondary: '#5A9E72',
    fill: 'rgba(34, 120, 70, 0.05)',
    innerGlow: 'rgba(50, 130, 80, 0.08)',
    borderDash: '4,2',
    bracketStyle: 'stack',
  },
  shield_zone: {
    primary: '#38BDF8',
    secondary: '#BAE6FD',
    fill: 'rgba(56, 189, 248, 0.1)',
    innerGlow: 'rgba(56, 189, 248, 0.24)',
    borderDash: '4,3',
    bracketStyle: 'shield',
  },
  forced_lock: {
    primary: '#F97316',
    secondary: '#FDBA74',
    fill: 'rgba(249, 115, 22, 0.1)',
    innerGlow: 'rgba(251, 146, 60, 0.22)',
    borderDash: '5,2',
    bracketStyle: 'lock',
  },
  trail_erase: {
    primary: '#EF4444',
    secondary: '#FCA5A5',
    fill: 'rgba(239, 68, 68, 0.1)',
    innerGlow: 'rgba(248, 113, 113, 0.22)',
    borderDash: '2,3',
    bracketStyle: 'purge',
  },
};
