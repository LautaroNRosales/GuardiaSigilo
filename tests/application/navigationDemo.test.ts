import { describe, expect, it } from "vitest";
import { createGridMap, type GridPoint } from "../../src/domain/model/grid";
import { calculateRoute } from "../../src/application/simulation/navigationDemo";

const START: GridPoint = { x: 0, y: 1 };
const GOAL: GridPoint = { x: 4, y: 1 };
const MAP = createGridMap(5, 3, []);
const SLOW_CELLS = new Set(["1,1", "2,1", "3,1"]);

describe("consumidor calculateRoute", () => {
  it("usa el modo ponderado por configuracion y obtiene costo 6", () => {
    const result = calculateRoute(MAP, START, GOAL, "astar", (point) =>
      SLOW_CELLS.has(`${point.x},${point.y}`) ? 5 : 1,
    );

    expect(result.algorithm).toBe("astar");
    expect(result.status).toBe("success");
    expect(result.totalCost).toBe(6);
  });

  it("conserva el funcionamiento unitario al no usar la franja", () => {
    const result = calculateRoute(MAP, START, GOAL, "astar");

    expect(result.status).toBe("success");
    expect(result.totalCost).toBe(4);
  });
});