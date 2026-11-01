import { Point, Dot } from '../types/game';
import { BoardFeatureInstance, BoardFeatureTypeId } from '../types/boardFeatures';
import { RegionOrigin, getRegionCorners, isPointOnRegion } from '../types/gridRegion';
import { pointsEqual } from '../engine/geometry';

export function getFeaturesAtLanding(
  landingPos: Point,
  features: BoardFeatureInstance[]
): BoardFeatureInstance[] {
  return features.filter((f) => isPointOnRegion(landingPos, f.origin));
}

/** @deprecated Use getFeaturesAtLanding — effects trigger on landing only. */
export function getFeaturesTouchingPoints(
  touchedPoints: Point[],
  features: BoardFeatureInstance[]
): BoardFeatureInstance[] {
  if (touchedPoints.length === 0) return [];
  const landingPos = touchedPoints[touchedPoints.length - 1];
  return getFeaturesAtLanding(landingPos, features);
}

export function hasFeatureAtRegion(
  origin: RegionOrigin,
  typeId: BoardFeatureTypeId,
  features: BoardFeatureInstance[]
): boolean {
  return features.some(
    (f) => f.typeId === typeId && f.origin.r === origin.r && f.origin.c === origin.c
  );
}

export function isSanctuaryPoint(pos: Point, features: BoardFeatureInstance[]): boolean {
  return features.some(
    (f) => f.typeId === 'shield_zone' && isPointOnRegion(pos, f.origin)
  );
}

export function getSanctuaryAtPoint(
  pos: Point,
  features: BoardFeatureInstance[]
): BoardFeatureInstance | undefined {
  return features.find(
    (f) => f.typeId === 'shield_zone' && isPointOnRegion(pos, f.origin)
  );
}

/** True when any alive dot already rests on the sanctuary hex. */
export function isSanctuaryOccupied(
  pos: Point,
  dots: Dot[],
  features: BoardFeatureInstance[],
  excludeDotId?: string
): boolean {
  const sanctuary = getSanctuaryAtPoint(pos, features);
  if (!sanctuary) return false;

  const corners = getRegionCorners(sanctuary.origin);
  return dots.some(
    (d) =>
      d.isAlive &&
      d.id !== excludeDotId &&
      corners.some((corner) => pointsEqual(d.currentPos, corner))
  );
}

export function isDotProtectedAtPosition(
  pos: Point,
  features: BoardFeatureInstance[]
): boolean {
  return features.some(
    (f) => f.typeId === 'shield_zone' && isPointOnRegion(pos, f.origin)
  );
}
