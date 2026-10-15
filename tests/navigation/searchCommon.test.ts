import { describe, expect, it } from "vitest";
import { createGridMap, type GridPoint } from "../../src/domain/model/grid";
import { findPathAStar, findPathBfs } from "../../src/domain/navigation/search";

const WIDTH = 5;
const HEIGHT = 3;
const START: GridPoint = { x: 0, y: 1 };
const GOAL: GridPoint = { x: 4, y: 1 };
const FREE_MAP = createGridMap(WIDTH, HEIGHT, []);
const BARRIER_MAP = createGridMap(WIDTH, HEIGHT, [
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
]);

describe.each([
  ["BFS", findPathBfs],
  ["A*", findPathAStar],
] as const)("%s sobre fixture comun 5x3", (_name, findPath) => {
  it("devuelve una ruta cardinal valida de 4 pasos con costo 4", () => {
    const result = findPath(FREE_MAP, START, GOAL);

    expect(result.status).toBe("success");
    expect(result.path).toHaveLength(5);
    expect(result.totalCost).toBe(4);
    expect(result.path[0]).toEqual(START);
    expect(result.path.at(-1)).toEqual(GOAL);
    expect(result.path.every((point) => point.x >= 0 && point.x < WIDTH)).toBe(true);
  });

  it("trata inicio igual a meta como exito con costo 0", () => {
    const result = findPath(FREE_MAP, START, START);

    expect(result.status).toBe("success");
    expect(result.path).toEqual([START]);
    expect(result.totalCost).toBe(0);
  });

  it("distingue inicio y meta invalidos segun el contrato", () => {
    const invalidStart = findPath(FREE_MAP, { x: -1, y: 1 }, GOAL);
    const invalidGoal = findPath(FREE_MAP, START, { x: 5, y: 1 });

    expect(invalidStart.status).toBe("invalid-start");
    expect(invalidGoal.status).toBe("invalid-goal");
  });

  it("reporta barrera completa como inaccesible", () => {
    const result = findPath(BARRIER_MAP, START, GOAL);

    expect(result.status).toBe("unreachable");
    expect(result.path).toEqual([]);
    expect(result.totalCost).toBeNull();
  });
});