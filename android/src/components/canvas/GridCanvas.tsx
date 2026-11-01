import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { Dot, Direction, CharacterId, CurrencyRegion, BoardFeatureInstance, Point } from '../../types/game';
import { GRID_CONFIG } from '../../constants/board';
import { PLAYER_COLORS } from '../../constants/gameColors';
import { HexChain } from './HexChain';
import { BaseDotMarker } from './BaseDotMarker';
import {
  HEX_DIRECTIONS,
  cellToPixel,
  getCellsAlongPath,
  getDestination,
  getMovementRotationDegrees,
  hexDirectionToRotation,
  hexPolygonPath,
  isWithinBounds,
  pointsEqual,
  walkHex,
} from '../../engine/geometry';
import { canEliminateDot, canLandAt } from '../../engine/boardFeatureEngine';
import { getCharacterForDot, DotShape } from '../../constants/characters';
import {
  doesTrailCutKillDot,
  getTrapPointsForDot,
  getVisibleTrailSegments,
  pathCrossesOwnTrail,
  getOccupiedCells,
  getMoveCoverageCells,
} from '../../engine/characterEngine';
import { lightenHex } from '../../utils/color';
import {
  EMPTY_BOARD_OBSTACLES,
  LevelBoardObstacles,
  PROXIMITY_TRAP_NEO_RIM,
  PROXIMITY_TRAP_NEO_GLOW,
  PROXIMITY_TRAP_NEO_ACCENT,
  PROXIMITY_TRAP_NEO_INNER,
  pathCrossesImpassable,
  pointKey,
} from '../../engine/boardObstacleEngine';

interface GridCanvasProps {
  dots: Dot[];
  activePlayer: 1 | 2;
  selectedDotId: string | null;
  selectedToken: number | null;
  selectedDirection: Direction | null;
  onSelectDot: (dotId: string) => void;
  onSelectTreeHead?: (dotId: string, headId: string) => void;
  themeColors: any;
  killEffect: 'collapse' | 'explode' | 'dissolve' | 'monster' | 'hammer' | 'burn' | 'firecracker';
  onSelectDirection: (dir: Direction) => void;
  onGestureEnd: (dir: Direction, dotId: string) => void;
  onGestureStart?: () => void;
  p1DotColor: string;
  p1LineColor: string;
  p2DotColor: string;
  p2LineColor: string;
  selectedLines: string[];
  characterLoadout: CharacterId[];
  currencyRegions: CurrencyRegion[];
  boardFeatures: BoardFeatureInstance[];
  boardObstacles?: LevelBoardObstacles;
  capturedHexes?: Record<string, 1 | 2>;
  maxHeight: number;
  maxWidth: number;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  dots,
  activePlayer,
  selectedDotId,
  selectedToken,
  selectedDirection,
  onSelectDot,
  onSelectTreeHead,
  themeColors,
  killEffect,
  onSelectDirection,
  onGestureEnd,
  onGestureStart,
  p1DotColor,
  p1LineColor,
  p2DotColor,
  p2LineColor,
  characterLoadout,
  boardFeatures,
  boardObstacles = EMPTY_BOARD_OBSTACLES,
  capturedHexes,
  maxHeight,
  maxWidth,
}) => {
  const insets = useSafeAreaInsets();

  // Compute available space dynamically: width covers full screen width
  const pad = 0;
  const widthUnits = Math.sqrt(3) * (GRID_CONFIG.COLS + 0.5);
  const heightUnits = 1.5 * (GRID_CONFIG.ROWS - 1) + 2;
  const cellSize = Math.max(4, maxWidth / widthUnits);
  const offsetX = (Math.sqrt(3) * cellSize) / 2;
  const offsetY = cellSize;
  const boardWidth = maxWidth;
  const boardHeight = heightUnits * cellSize;

  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const gestureDirRef = useRef<Direction | null>(null);
  const gestureDotIdRef = useRef<string | null>(null);
  const tapGuideDirRef = useRef<Direction | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const findTeammateDotAtLocal = (
    localX: number,
    localY: number,
    currentDotId: string | null
  ): Dot | null => {
    let closestDot: Dot | null = null;
    let closestDist = Infinity;
    const hitRadius = Math.max(26, cellSize * 1.25);

    for (const dot of dots) {
      if (!dot.isAlive || dot.player !== activePlayer) continue;
      if (dot.characterId === 'tree' && dot.treeNodes && dot.treeNodes.length > 0) {
        for (const node of dot.treeNodes) {
          const { x: cx, y: cy } = cellToPixel(node.pos, cellSize, offsetX, offsetY);
          const d = Math.hypot(localX - cx, localY - cy);
          if (d <= hitRadius) {
            onSelectTreeHead?.(dot.id, node.id);
            return dot;
          }
        }
      }
      if (currentDotId && dot.id === currentDotId) continue;
      const targetCells = [dot.currentPos];
      if (dot.characterId === 'tree' && (dot.handPos || dot.stretchedTo)) {
        targetCells.push(dot.handPos ?? dot.stretchedTo!);
      }
      for (const pos of targetCells) {
        const { x: cx, y: cy } = cellToPixel(pos, cellSize, offsetX, offsetY);
        const d = Math.hypot(localX - cx, localY - cy);
        if (d < closestDist) {
          closestDist = d;
          closestDot = dot;
        }
      }
    }

    if (closestDot && closestDist <= hitRadius) {
      return closestDot;
    }
    return null;
  };

  const findMoveDirectionAtPixel = (
    px: number,
    py: number,
    dotId: string
  ): Direction | null => {
    if (selectedToken === null) return null;
    const movingDot = dots.find((d) => d.id === dotId);
    if (!movingDot || !movingDot.isAlive || movingDot.player !== activePlayer) return null;

    const startPos = movingDot.currentPos;
    const occupied = getOccupiedCells(startPos);

    let distToDot = Infinity;
    for (const cell of occupied) {
      const { x: cx, y: cy } = cellToPixel(cell, cellSize, offsetX, offsetY);
      const d = Math.hypot(px - cx, py - cy);
      if (d < distToDot) distToDot = d;
    }

    let bestDir: Direction | null = null;
    let bestDist = Infinity;
    const maxHitRadius = Math.max(24, cellSize * 1.15);

    for (const dir of HEX_DIRECTIONS) {
      const path = walkHex(startPos, dir, selectedToken);
      const endPos = path[path.length - 1];
      const coverage = getMoveCoverageCells(path);
      if (!endPos || !coverage.every(isWithinBounds)) continue;
      if (pathCrossesImpassable(coverage, boardObstacles)) continue;
      if (!canLandAt(endPos, dotId, dots, boardFeatures, boardObstacles)) continue;
      if (pathCrossesOwnTrail(dotId, path, dots)) continue;

      for (const cell of coverage) {
        const { x: cx, y: cy } = cellToPixel(cell, cellSize, offsetX, offsetY);
        const dist = Math.hypot(px - cx, py - cy);
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = dir;
        }
      }
    }

    if (bestDir && bestDist <= maxHitRadius && bestDist < distToDot) {
      return bestDir;
    }
    return null;
  };

  const sectorAngle: Record<Direction, number> = {
    E: 0,
    SE: 60,
    SW: 120,
    W: 180,
    NW: 240,
    NE: 300,
  };

  const angleGap = (a: number, b: number) => {
    const gap = Math.abs(a - b) % 360;
    return gap > 180 ? 360 - gap : gap;
  };

  // Pointy-top neighbors sit 60° apart. Once a direction locks, it stays until the finger is clearly closer to another.
  const getGestureDirection = (dx: number, dy: number, locked: Direction | null): Direction | null => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 4) return locked;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let best: Direction = 'E';
    let bestGap = 360;
    for (const dir of HEX_DIRECTIONS) {
      const gap = angleGap(angle, sectorAngle[dir]);
      if (gap < bestGap) {
        bestGap = gap;
        best = dir;
      }
    }

    if (locked && best !== locked && angleGap(angle, sectorAngle[locked]) < bestGap + 18) {
      return locked;
    }
    return best;
  };

  const handleStart = (localX: number, localY: number) => {
    if (selectedToken === null) return;

    dragOriginRef.current = { x: localX, y: localY };
    gestureDirRef.current = null;
    tapGuideDirRef.current = null;
    isDraggingRef.current = false;

    // 1. Check if user clicked a different teammate dot to switch selection
    const teammateDot = findTeammateDotAtLocal(localX, localY, selectedDotId);
    if (teammateDot) {
      gestureDotIdRef.current = teammateDot.id;
      onSelectDot(teammateDot.id);
      return;
    }

    const effectiveDotId =
      selectedDotId ?? dots.find((d) => d.player === activePlayer && d.isAlive)?.id ?? null;
    if (!effectiveDotId) return;

    gestureDotIdRef.current = effectiveDotId;

    // 2. Check if user clicked on one of the possible move guide hex boxes
    const guideDir = findMoveDirectionAtPixel(localX, localY, effectiveDotId);
    if (guideDir) {
      tapGuideDirRef.current = guideDir;
      onSelectDirection(guideDir);
      onGestureStart?.();
      return;
    }

    onGestureStart?.();
  };

  const handleMove = (localX: number, localY: number) => {
    const origin = dragOriginRef.current;
    if (!gestureDotIdRef.current || selectedToken === null || !origin) return;

    const dx = localX - origin.x;
    const dy = localY - origin.y;
    const dist = Math.hypot(dx, dy);

    // Require movement above drag threshold (12px) to distinguish drag from tap
    if (dist >= 12) {
      isDraggingRef.current = true;
      tapGuideDirRef.current = null;

      const dir = getGestureDirection(dx, dy, gestureDirRef.current);
      if (dir && dir !== gestureDirRef.current) {
        gestureDirRef.current = dir;
        onSelectDirection(dir);
      }
    }
  };

  const handleEnd = (upX?: number, upY?: number) => {
    const isDrag = isDraggingRef.current;
    const dotId = gestureDotIdRef.current ?? selectedDotId;
    const dragDir = gestureDirRef.current;
    let tapDir = tapGuideDirRef.current;

    // If not a drag and tapDir wasn't locked on touch down, hit test release position
    if (!isDrag && !tapDir && upX !== undefined && upY !== undefined && dotId) {
      tapDir = findMoveDirectionAtPixel(upX, upY, dotId);
    }

    dragOriginRef.current = null;
    gestureDirRef.current = null;
    gestureDotIdRef.current = null;
    tapGuideDirRef.current = null;
    isDraggingRef.current = false;

    if (isDrag) {
      if (dragDir && dotId) {
        onGestureEnd(dragDir, dotId);
      }
    } else {
      if (tapDir && dotId) {
        onSelectDirection(tapDir);
        onGestureEnd(tapDir, dotId);
      }
    }
  };

  const canSwipeToMove = selectedToken !== null && (selectedDotId !== null || activePlayer === 1);

  // Direct Event Mappers for both Touch (mobile) and Mouse (desktop web)
  const onTouchStartLocal = (e: any) => {
    const touch = e.nativeEvent.touches?.[0];
    if (touch) {
      handleStart(touch.locationX, touch.locationY);
    }
  };

  const onTouchMoveLocal = (e: any) => {
    const touch = e.nativeEvent.touches?.[0];
    if (touch) {
      handleMove(touch.locationX, touch.locationY);
    }
  };

  const onTouchEndLocal = (e: any) => {
    const touch = e.nativeEvent.changedTouches?.[0];
    handleEnd(touch?.locationX, touch?.locationY);
  };

  const onMouseDownLocal = (e: any) => {
    if (e.nativeEvent.button !== 0) return;
    handleStart(e.nativeEvent.locationX, e.nativeEvent.locationY);
  };

  const onMouseMoveLocal = (e: any) => {
    handleMove(e.nativeEvent.locationX, e.nativeEvent.locationY);
  };

  const onMouseUpLocal = (e: any) => {
    handleEnd(e.nativeEvent.locationX, e.nativeEvent.locationY);
  };

  // Retrieve color from character definition (per dot slot)
  const getDotColor = (dotId: string): string => {
    return getCharacterForDot(dotId, characterLoadout).dotColor;
  };

  const getShapeForDot = (dotId: string): DotShape => {
    return getCharacterForDot(dotId, characterLoadout).shape;
  };

  const blackBoxSet = new Set(boardObstacles.blackBoxes.map((p) => pointKey(p)));

  const hexCells = [];
  for (let r = 0; r < GRID_CONFIG.ROWS; r++) {
    for (let c = 0; c < GRID_CONFIG.COLS; c++) {
      const { x, y } = cellToPixel({ r, c }, cellSize, offsetX, offsetY);
      const key = `${r},${c}`;
      const isBlack = blackBoxSet.has(key);
      const capturedBy = capturedHexes?.[key];

      // Base board grid cell (underneath)
      hexCells.push(
        <Path
          key={`hex_${r}_${c}`}
          d={hexPolygonPath(x, y, cellSize * 0.97)}
          fill="#E4EBF3"
          stroke="#B7C3D1"
          strokeWidth={Math.max(0.8, cellSize * 0.07)}
        />
      );

      // Captured territory hex: identical to body hex white border, difference is only color intensity (no black border)
      if (capturedBy === 1 || capturedBy === 2) {
        const regionFill = capturedBy === 1 ? PLAYER_COLORS.P1.region : PLAYER_COLORS.P2.region;
        hexCells.push(
          <G key={`captured_${r}_${c}`}>
            <Path d={hexPolygonPath(x, y, cellSize * 0.76)} fill="#FFFFFF" />
            <Path d={hexPolygonPath(x, y, cellSize * 0.62)} fill={regionFill} />
          </G>
        );
      }

      // If black box obstacle: style exactly like dot boxes (TrailHex) with black inside
      if (isBlack) {
        hexCells.push(
          <G key={`black_box_${r}_${c}`}>
            <Path d={hexPolygonPath(x, y, cellSize * 0.9)} fill="#000000" />
            <Path d={hexPolygonPath(x, y, cellSize * 0.76)} fill="#FFFFFF" />
            <Path d={hexPolygonPath(x, y, cellSize * 0.62)} fill="#000000" />
          </G>
        );
      }
    }
  }

  const effectiveSelectedDotId =
    selectedDotId ??
    (activePlayer === 1
      ? (dots.find((d) => d.player === 1 && d.isAlive)?.id ?? null)
      : null);

  const orderedTrailPoints = (dot: Dot) => {
    const ordered: { r: number; c: number }[] = [];
    const seen = new Set<string>();
    const push = (point: { r: number; c: number }) => {
      const key = `${point.r},${point.c}`;
      if (seen.has(key)) return;
      seen.add(key);
      ordered.push(point);
    };
    for (const segment of getVisibleTrailSegments(dot)) {
      push(segment.start);
      for (const point of getCellsAlongPath(segment.start, segment.end)) {
        push(point);
      }
    }
    for (const occ of getOccupiedCells(dot.currentPos)) {
      push(occ);
    }
    return ordered;
  };

  const trailColor = (player: 1 | 2) =>
    player === 1 ? (p1DotColor || PLAYER_COLORS.P1.body) : (p2DotColor || PLAYER_COLORS.P2.body);

  const trailHeadFillForDot = (dot: Dot) => {
    const character = getCharacterForDot(dot.id, characterLoadout);
    return dot.player === 1 ? (p1DotColor || PLAYER_COLORS.P1.body) : (p2DotColor || PLAYER_COLORS.P2.body);
  };

  const trailCellsFor = (dot: Dot) => {
    const character = getCharacterForDot(dot.id, characterLoadout);
    const headFill = trailHeadFillForDot(dot);
    const bodyFill = trailColor(dot.player);
    const points = orderedTrailPoints(dot);
    const headKeys = new Set(getOccupiedCells(dot.currentPos).map((p) => `${p.r},${p.c}`));
    const isActive = dot.id === effectiveSelectedDotId && dot.player === activePlayer;
    const rotation =
      isActive && selectedDirection
        ? hexDirectionToRotation(selectedDirection)
        : getMovementRotationDegrees(dot);

    return points.map((point) => {
      const isHead = headKeys.has(`${point.r},${point.c}`);
      return {
        point,
        fill: isHead ? headFill : bodyFill,
        isHead,
        isActiveHead: isHead && isActive,
        avatar: isHead ? character.avatar : undefined,
        avatarBody: isHead ? character.avatarBody : undefined,
        avatarFace: isHead ? character.avatarFace : undefined,
        rotation: isHead ? rotation : undefined,
      };
    });
  };

  const renderGhostTraps = () =>
    dots.map((dot) => {
      if (!dot.isAlive) return null;
      const trapPoints = getTrapPointsForDot(dot);
      if (trapPoints.length === 0) return null;
      const bodyFill = trailColor(dot.player);
      return (
        <HexChain
          key={`ghost_${dot.id}`}
          cells={trapPoints.map((point) => ({
            point,
            fill: lightenHex(bodyFill, 0.52),
            isHead: false,
          }))}
          color={bodyFill}
          hexSize={cellSize}
          offsetX={offsetX}
          offsetY={offsetY}
          variant="trail"
          borderColor="#000000"
        />
      );
    });

  const moveKillsOpponent = (movingDot: Dot, path: { r: number; c: number }[]) => {
    if (path.length === 0) return false;
    const end = path[path.length - 1];
    const landingCells = getOccupiedCells(end);
    const landsOnEnemy = dots.some(
      (other) =>
        other.isAlive &&
        other.player !== movingDot.player &&
        landingCells.some((lCell) =>
          getOccupiedCells(other.currentPos).some((vCell) => pointsEqual(vCell, lCell))
        ) &&
        canEliminateDot(other, boardFeatures)
    );
    if (landsOnEnemy) return true;
    return dots.some(
      (other) =>
        other.isAlive &&
        other.player !== movingDot.player &&
        doesTrailCutKillDot(other, movingDot.currentPos, end, boardFeatures, movingDot)
    );
  };

  const renderMoveGuides = () => {
    if (!selectedDotId || selectedToken === null) return null;
    const movingDot = dots.find((d) => d.id === selectedDotId);
    if (!movingDot) return null;

    const startPos = movingDot.currentPos;

    return (
      <G>
        {HEX_DIRECTIONS.map((dir) => {
          if (dir === selectedDirection) return null;
          const path = walkHex(startPos, dir, selectedToken);
          const endPos = path[path.length - 1];
          const coverage = getMoveCoverageCells(path);
          if (!endPos || !coverage.every(isWithinBounds)) return null;
          if (pathCrossesImpassable(coverage, boardObstacles)) return null;
          if (!canLandAt(endPos, selectedDotId, dots, boardFeatures, boardObstacles)) return null;
          if (pathCrossesOwnTrail(selectedDotId, path, dots)) return null;
          const kills = moveKillsOpponent(movingDot, path);

          return (
            <HexChain
              key={`guide_${dir}`}
              cells={coverage.map((point) => ({ point }))}
              color={trailColor(movingDot.player)}
              hexSize={cellSize}
              offsetX={offsetX}
              offsetY={offsetY}
              variant={kills ? 'threat' : 'hint'}
            />
          );
        })}
      </G>
    );
  };

  const renderPreview = () => {
    if (!selectedDotId || selectedToken === null || !selectedDirection) return null;
    const movingDot = dots.find((d) => d.id === selectedDotId);
    if (!movingDot) return null;

    const startPos = movingDot.currentPos;
    const path = walkHex(startPos, selectedDirection, selectedToken);
    const endPos = getDestination(startPos, selectedDirection, selectedToken);
    const coverage = getMoveCoverageCells(path);
    const inBounds = coverage.every(isWithinBounds);
    const hitsImpassable = pathCrossesImpassable(coverage, boardObstacles);
    const touchesOwn = pathCrossesOwnTrail(selectedDotId, path, dots);
    const canLand =
      inBounds && !hitsImpassable && !touchesOwn && canLandAt(endPos, selectedDotId, dots, boardFeatures, boardObstacles);
    const kills = canLand && moveKillsOpponent(movingDot, path);

    return (
      <HexChain
        cells={coverage.map((point) => ({ point }))}
        color={canLand ? trailColor(movingDot.player) : '#EF4444'}
        hexSize={cellSize}
        offsetX={offsetX}
        offsetY={offsetY}
        variant={kills ? 'threat' : 'hint'}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          shadowColor: themeColors.shadowColor,
          cursor: (selectedToken !== null ? 'pointer' : 'auto') as any,
        },
      ]}
      onStartShouldSetResponder={() => selectedToken !== null}
      onMoveShouldSetResponder={() => selectedToken !== null}
      onTouchStart={onTouchStartLocal}
      onTouchMove={onTouchMoveLocal}
      onTouchEnd={onTouchEndLocal}
      onTouchCancel={onTouchEndLocal}
      // @ts-ignore - Support standard mouse dragging on web platform
      onMouseDown={onMouseDownLocal}
      onMouseMove={onMouseMoveLocal}
      onMouseUp={onMouseUpLocal}
    >
      <Svg width={boardWidth} height={boardHeight}>
        <Rect width={boardWidth} height={boardHeight} fill="#F4F7FB" />

        {hexCells}

        {/* Treasure, locks, and other board offerings stay in game state and are not drawn for now. */}

        {renderGhostTraps()}

        {[...dots]
          .sort((a, b) => {
            if (a.id === effectiveSelectedDotId) return 1;
            if (b.id === effectiveSelectedDotId) return -1;
            return 0;
          })
          .map((dot) => {
            if (!dot || !dot.isAlive) return null;
            const cells = trailCellsFor(dot);
            if (cells.length === 0) return null;
            return (
              <HexChain
                key={`trail_${dot.id}`}
                cells={cells}
                color={trailColor(dot.player)}
                hexSize={cellSize}
                offsetX={offsetX}
                offsetY={offsetY}
                variant="trail"
                borderColor="#000000"
              />
            );
          })}

        {renderMoveGuides()}
        {renderPreview()}

        {/* Stretched Tree hand indicator */}
        {dots.map((dot) => {
          if (!dot || !dot.isAlive || dot.characterId !== 'tree' || !dot.handPos) return null;
          const { x: cx, y: cy } = cellToPixel(dot.handPos, cellSize, offsetX, offsetY);
          const isSelected = dot.id === effectiveSelectedDotId;
          return (
            <G key={`tree_hand_marker_${dot.id}`}>
              <Path
                d={hexPolygonPath(cx, cy, cellSize * 0.94)}
                fill="none"
                stroke={dot.player === 1 ? PLAYER_COLORS.P1.body : PLAYER_COLORS.P2.body}
                strokeWidth={2.5}
                strokeDasharray="4,4"
              />
            </G>
          );
        })}

        {/* Active Player Node Markers */}
        {dots.map((dot) => {
          if (!dot || dot.isAlive) return null;
          const color = getDotColor(dot.id);
          const occupied = getOccupiedCells(dot.currentPos);
          return occupied.map((cell, idx) => (
            <BaseDotMarker
              key={`${dot.id}_${idx}`}
              dot={{ ...dot, currentPos: cell }}
              color={color}
              isSelected={false}
              cellSize={cellSize}
              offsetX={offsetX}
              offsetY={offsetY}
              killEffect={killEffect}
              themeColors={themeColors}
              shape={getShapeForDot(dot.id)}
              boardFeatures={boardFeatures}
            />
          ));
        })}
      </Svg>

      {/* Dot taps — disabled while swiping so gestures pass through to the board */}
      <View
        style={[StyleSheet.absoluteFill, { pointerEvents: canSwipeToMove ? 'none' : 'box-none' }]}
      >
        {dots.map((dot) => {
          if (!dot || !dot.isAlive || dot.player !== activePlayer) return null;
          if (dot.characterId === 'tree' && (dot.handPos || dot.stretchedTo)) {
            const hand = dot.handPos ?? dot.stretchedTo!;
            const { x: cx, y: cy } = cellToPixel(dot.currentPos, cellSize, offsetX, offsetY);
            const { x: tx, y: ty } = cellToPixel(hand, cellSize, offsetX, offsetY);
            return (
              <React.Fragment key={`tap_tree_pair_${dot.id}`}>
                <TouchableOpacity
                  key={`tap_tree_head_${dot.id}`}
                  style={{
                    position: 'absolute',
                    left: cx - 26,
                    top: cy - 26,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'transparent',
                  }}
                  onPress={() => onSelectDot(dot.id)}
                  activeOpacity={0.65}
                />
                <TouchableOpacity
                  key={`tap_tree_tip_${dot.id}`}
                  style={{
                    position: 'absolute',
                    left: tx - 26,
                    top: ty - 26,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'transparent',
                  }}
                  onPress={() => onSelectDot(dot.id)}
                  activeOpacity={0.65}
                />
              </React.Fragment>
            );
          }
          const occupied = getOccupiedCells(dot.currentPos);
          return occupied.map((cell, idx) => {
            const { x: cx, y: cy } = cellToPixel(cell, cellSize, offsetX, offsetY);
            return (
              <TouchableOpacity
                key={`tap_${dot.id}_${idx}`}
                style={{
                  position: 'absolute',
                  left: cx - 26,
                  top: cy - 26,
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'transparent',
                }}
                onPress={() => onSelectDot(dot.id)}
                activeOpacity={0.65}
              />
            );
          });
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    borderWidth: 5,
    borderColor: '#C5D0DC',
    borderRadius: 12,
    backgroundColor: '#F4F7FB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
    // @ts-ignore
    touchAction: 'none',
  },
});
