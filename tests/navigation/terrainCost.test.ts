import { describe, expect, it } from "vitest";
import { cellKey, createGridMap, type GridPoint } from "../../src/domain/model/grid";
import { findPathAStar } from "../../src/domain/navigation/search";

const START: GridPoint = { x: 0, y: 1 };
const GOAL: GridPoint = { x: 4, y: 1 };
const MAP = createGridMap(5, 3, []);
const SLOW_CELLS = new Set(["1,1", "2,1", "3,1"]);

function terrainCost(point: GridPoint): number {
  return SLOW_CELLS.has(cellKey(point)) ? 5 : 1;
}

describe("A* ponderado por terreno lento", () => {
  it("prefiere el rodeo de 6 pasos con costo 6 frente a la directa de 4 pasos y costo 16", () => {
    const result = findPathAStar(MAP, START, GOAL, terrainCost);

    expect(result.status).toBe("success");
    expect(result.totalCost).toBe(6);
    expect(result.path).toHaveLength(7);
    expect(result.path[0]).toEqual(START);
    expect(result.path.at(-1)).toEqual(GOAL);
    expect(result.path.some((point) => SLOW_CELLS.has(cellKey(point)))).toBe(false);
  });

  it("mantiene el minimo unitario sin franja lenta", () => {
    const result = findPathAStar(MAP, START, GOAL);

    expect(result.status).toBe("success");
    expect(result.path).toHaveLength(5);
    expect(result.totalCost).toBe(4);
  });

  it("usa los costos nuevos al restaurar la franja a costo 1", () => {
    let slowActive = true;
    const mutableCost = (point: GridPoint): number =>
      slowActive && SLOW_CELLS.has(cellKey(point)) ? 5 : 1;

    const withSlowStripe = findPathAStar(MAP, START, GOAL, mutableCost);
    slowActive = false;
    const restored = findPathAStar(MAP, START, GOAL, mutableCost);

    expect(withSlowStripe.totalCost).toBe(6);
    expect(restored.totalCost).toBe(4);
    expect(restored.path).toHaveLength(5);
  });
});