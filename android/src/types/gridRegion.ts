import { Point } from './game';

/** Row and column of a single hex cell. */
export interface RegionOrigin {
  r: number;
  c: number;
}

export function getRegionCorners(origin: RegionOrigin): Point[] {
  return [{ r: origin.r, c: origin.c }];
}

export function pointsEqual(a: Point, b: Point): boolean {
  return a.r === b.r && a.c === b.c;
}

export function isPointOnRegion(pos: Point, origin: RegionOrigin): boolean {
  return getRegionCorners(origin).some((corner) => pointsEqual(corner, pos));
}

export function dotLandsOnRegion(landingPos: Point, origin: RegionOrigin): boolean {
  return isPointOnRegion(landingPos, origin);
}

export function moveTouchesRegion(touchedPoints: Point[], origin: RegionOrigin): boolean {
  return touchedPoints.some((p) => isPointOnRegion(p, origin));
}

export function getMoveTouchedPoints(start: Point, pathCells: Point[]): Point[] {
  const seen = new Set<string>();
  const all = [start, ...pathCells];
  return all.filter((p) => {
    const key = `${p.r},${p.c}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function regionOriginKey(origin: RegionOrigin): string {
  return `${origin.r},${origin.c}`;
}

export function isSameRegionOrigin(a: RegionOrigin, b: RegionOrigin): boolean {
  return a.r === b.r && a.c === b.c;
}

export function assertUniqueRegionOrigins(
  placements: { id: string; origin: RegionOrigin }[]
): void {
  const seen = new Map<string, string>();
  for (const placement of placements) {
    const key = regionOriginKey(placement.origin);
    const existing = seen.get(key);
    if (existing) {
      throw new Error(
        `Board region overlap at (${placement.origin.r}, ${placement.origin.c}): "${existing}" and "${placement.id}"`
      );
    }
    seen.set(key, placement.id);
  }
}
