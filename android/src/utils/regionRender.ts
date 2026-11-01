import { RegionOrigin } from '../types/gridRegion';
import { cellToPixel, hexPolygonPath, hexVertices } from '../engine/geometry';

export function regionPolygonPath(
  origin: RegionOrigin,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  insetRatio = 0.06
): string {
  const { x, y } = cellToPixel(origin, cellSize, offsetX, offsetY);
  return hexPolygonPath(x, y, cellSize * (1 - insetRatio));
}

export function regionLabelPosition(
  origin: RegionOrigin,
  cellSize: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  return cellToPixel(origin, cellSize, offsetX, offsetY);
}

export interface RegionCornerPixels {
  tl: { x: number; y: number };
  tr: { x: number; y: number };
  bl: { x: number; y: number };
  br: { x: number; y: number };
}

/** Bounding box of the hex, kept for callers that expect four corners. */
export function getRegionCornerPixels(
  origin: RegionOrigin,
  cellSize: number,
  offsetX: number,
  offsetY: number
): RegionCornerPixels {
  const { x, y } = cellToPixel(origin, cellSize, offsetX, offsetY);
  const verts = hexVertices(x, y, cellSize);
  const xs = verts.map((vert) => vert.x);
  const ys = verts.map((vert) => vert.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    tl: { x: minX, y: minY },
    tr: { x: maxX, y: minY },
    bl: { x: minX, y: maxY },
    br: { x: maxX, y: maxY },
  };
}
