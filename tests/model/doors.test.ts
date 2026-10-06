import { describe, expect, it } from "vitest";
import { canToggleDoor, openMapCells } from "../../src/domain/model/doors";
import { cellCenter, isWalkable, type GridPoint } from "../../src/domain/model/grid";
import { DOOR_CELLS, LAB_MAP, TILE_SIZE } from "../../src/application/simulation/labLevel";
import { calculateRoute } from "../../src/application/simulation/navigationDemo";
import { evaluateVision } from "../../src/domain/perception/perception";

const FIRST_DOOR: GridPoint = { x: 16, y: 15 };
const SECOND_DOOR: GridPoint = { x: 19, y: 6 };

describe("openMapCells", () => {
  it("opens only the requested cells without touching the original map", () => {
    const opened = openMapCells(LAB_MAP, [FIRST_DOOR]);

    expect(isWalkable(opened, FIRST_DOOR)).toBe(true);
    expect(isWalkable(opened, SECOND_DOOR)).toBe(false);
    expect(isWalkable(LAB_MAP, FIRST_DOOR)).toBe(false);
    expect(LAB_MAP.blocked.has("16,15")).toBe(true);
  });

  it("keeps grid dimensions and rejects cells outside the map", () => {
    const opened = openMapCells(LAB_MAP, DOOR_CELLS);
    expect(opened.width).toBe(LAB_MAP.width);
    expect(opened.height).toBe(LAB_MAP.height);
    expect(() => openMapCells(LAB_MAP, [{ x: 99, y: 99 }])).toThrow(
      "outside the grid",
    );
  });
});

describe("door cells on the lab map", () => {
  it("keeps every door cell blocked while closed (CA-2)", () => {
    for (const door of DOOR_CELLS) {
      expect(isWalkable(LAB_MAP, door)).toBe(false);
    }
    expect(isWalkable(openMapCells(LAB_MAP, DOOR_CELLS), FIRST_DOOR)).toBe(true);
    expect(isWalkable(openMapCells(LAB_MAP, DOOR_CELLS), SECOND_DOOR)).toBe(true);
  });

  it("shortens the route through an open door and blocks it when closed (CA-3)", () => {
    const from: GridPoint = { x: 16, y: 16 };
    const to: GridPoint = { x: 16, y: 14 };

    const closed = calculateRoute(LAB_MAP, from, to, "astar");
    const opened = calculateRoute(openMapCells(LAB_MAP, [FIRST_DOOR]), from, to, "astar");

    expect(closed.status).toBe("success");
    expect(opened.status).toBe("success");
    expect(closed.path.some((point) => point.x === 16 && point.y === 15)).toBe(false);
    expect(opened.path.some((point) => point.x === 16 && point.y === 15)).toBe(true);
    expect(opened.totalCost).not.toBeNull();
    expect(closed.totalCost).not.toBeNull();
    expect((opened.totalCost ?? 0)).toBeLessThan(closed.totalCost ?? 0);
  });
});

describe("canToggleDoor", () => {
  const guard: GridPoint = { x: 5, y: 5 };
  const door: GridPoint = { x: 10, y: 10 };

  it("allows the player standing in an orthogonal neighbouring cell", () => {
    expect(canToggleDoor({ x: 10, y: 9 }, guard, door)).toBe(true);
    expect(canToggleDoor({ x: 11, y: 10 }, guard, door)).toBe(true);
    expect(canToggleDoor({ x: 9, y: 10 }, guard, door)).toBe(true);
    expect(canToggleDoor({ x: 10, y: 11 }, guard, door)).toBe(true);
  });

  it("rejects diagonal, distant, or occupied positions", () => {
    expect(canToggleDoor({ x: 11, y: 9 }, guard, door)).toBe(false);
    expect(canToggleDoor({ x: 10, y: 8 }, guard, door)).toBe(false);
    expect(canToggleDoor(door, guard, door)).toBe(false);
    expect(canToggleDoor({ x: 10, y: 9 }, door, door)).toBe(false);
    expect(canToggleDoor({ x: 10, y: 9 }, { x: 10, y: 11 }, { x: 10, y: 11 })).toBe(false);
  });
});

describe("vision through a door", () => {
  const observer = cellCenter({ x: 16, y: 16 }, TILE_SIZE);
  const target = cellCenter({ x: 16, y: 14 }, TILE_SIZE);
  const input = {
    tileSize: TILE_SIZE,
    observer,
    facing: { x: 0, y: -1 },
    target,
    range: 200,
    fieldOfViewRadians: Math.PI / 2,
  };

  it("is occluded while the door is closed (CA-7)", () => {
    const result = evaluateVision({ map: LAB_MAP, ...input });
    expect(result.visible).toBe(false);
    expect(result.reason).toBe("occluded");
  });

  it("sees through the open doorway (CA-7)", () => {
    const result = evaluateVision({ map: openMapCells(LAB_MAP, [FIRST_DOOR]), ...input });
    expect(result.visible).toBe(true);
    expect(result.reason).toBe("visible");
  });
});
