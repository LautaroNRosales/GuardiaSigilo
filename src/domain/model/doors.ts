import { cellKey, isInside, type GridMap, type GridPoint } from "./grid";

export function openMapCells(map: GridMap, cells: Iterable<GridPoint>): GridMap {
  const blocked = new Set(map.blocked);
  for (const cell of cells) {
    if (!isInside(map, cell)) {
      throw new Error(`Door cell is outside the grid: ${cellKey(cell)}.`);
    }
    blocked.delete(cellKey(cell));
  }
  return { width: map.width, height: map.height, blocked };
}

export function canToggleDoor(
  playerCell: GridPoint,
  guardCell: GridPoint,
  doorCell: GridPoint,
): boolean {
  const distance = Math.abs(playerCell.x - doorCell.x) + Math.abs(playerCell.y - doorCell.y);
  if (distance > 1) {
    return false;
  }
  if (playerCell.x === doorCell.x && playerCell.y === doorCell.y) {
    return false;
  }
  if (guardCell.x === doorCell.x && guardCell.y === doorCell.y) {
    return false;
  }
  return true;
}
