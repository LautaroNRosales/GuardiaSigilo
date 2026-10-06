import { describe, expect, it } from "vitest";
import {
  beginManual,
  initialPatrol,
  onArrival,
  patrolLookDirection,
  patrolTarget,
  skipPatrolPoint,
  tick,
} from "../../src/domain/behavior/patrol";
import { GUARD_START, LAB_MAP, PATROL_POINTS } from "../../src/application/simulation/labLevel";
import { calculateRoute } from "../../src/application/simulation/navigationDemo";
import { isWalkable } from "../../src/domain/model/grid";

const POINTS = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

const PAUSE_MS = 1200;

describe("patrol state", () => {
  it("starts travelling toward the first point in patrol mode", () => {
    expect(initialPatrol(POINTS)).toEqual({
      points: POINTS,
      targetIndex: 0,
      phase: "travelling",
      mode: "patrol",
      pauseRemainingMs: 0,
    });
  });

  it("rejects empty or non-finite patrol points", () => {
    expect(() => initialPatrol([])).toThrow("at least one point");
    expect(() => initialPatrol([{ x: Number.NaN, y: 0 }])).toThrow(
      "Vector components",
    );
  });

  it("exposes the current target point", () => {
    const state = initialPatrol(POINTS);
    expect(patrolTarget(state)).toEqual({ x: 0, y: 0 });
  });

  it("pauses and advances the target when arriving in patrol mode", () => {
    const state = onArrival(initialPatrol(POINTS), PAUSE_MS);
    expect(state.phase).toBe("paused");
    expect(state.pauseRemainingMs).toBe(PAUSE_MS);
    expect(state.targetIndex).toBe(1);
  });

  it("ignores a repeated arrival while already paused", () => {
    const paused = onArrival(initialPatrol(POINTS), PAUSE_MS);
    expect(onArrival(paused, PAUSE_MS)).toBe(paused);
  });

  it("rejects an invalid pause duration", () => {
    expect(() => onArrival(initialPatrol(POINTS), -1)).toThrow(
      "Pause duration",
    );
    expect(() => onArrival(initialPatrol(POINTS), Number.POSITIVE_INFINITY)).toThrow(
      "Pause duration",
    );
  });
});

describe("patrol pause countdown", () => {
  it("counts down the pause across ticks", () => {
    const paused = onArrival(initialPatrol(POINTS), PAUSE_MS);
    expect(tick(paused, 500).pauseRemainingMs).toBe(700);
    expect(tick(paused, 500).phase).toBe("paused");
  });

  it("resumes travelling when the pause is exhausted", () => {
    const resumed = tick(onArrival(initialPatrol(POINTS), PAUSE_MS), PAUSE_MS);
    expect(resumed.phase).toBe("travelling");
    expect(resumed.pauseRemainingMs).toBe(0);
    expect(resumed.targetIndex).toBe(1);
  });

  it("leaves travelling state untouched", () => {
    const state = initialPatrol(POINTS);
    expect(tick(state, 1000)).toBe(state);
  });

  it("rejects an invalid tick duration", () => {
    expect(() => tick(initialPatrol(POINTS), -1)).toThrow("Tick duration");
    expect(() => tick(initialPatrol(POINTS), Number.NaN)).toThrow(
      "Tick duration",
    );
  });
});

describe("patrol cycle", () => {
  it("wraps the target index around the circuit", () => {
    let state = initialPatrol(POINTS);
    for (let visit = 0; visit < POINTS.length; visit += 1) {
      state = onArrival(state, PAUSE_MS);
      state = tick(state, PAUSE_MS);
    }
    expect(state.targetIndex).toBe(0);
    expect(state.phase).toBe("travelling");
    expect(state.mode).toBe("patrol");
  });

  it("skips a failed point and keeps cycling", () => {
    const skipped = skipPatrolPoint(initialPatrol(POINTS));
    expect(skipped.targetIndex).toBe(1);
    expect(skipped.phase).toBe("travelling");
    expect(skipped.pauseRemainingMs).toBe(0);

    let state = skipped;
    for (let visit = 0; visit < POINTS.length - 1; visit += 1) {
      state = onArrival(state, PAUSE_MS);
      state = tick(state, PAUSE_MS);
    }
    expect(state.targetIndex).toBe(0);
  });
});

describe("patrol manual interruption", () => {
  it("switches to manual mode and cancels an active pause", () => {
    const manual = beginManual(onArrival(initialPatrol(POINTS), PAUSE_MS));
    expect(manual.mode).toBe("manual");
    expect(manual.phase).toBe("travelling");
    expect(manual.pauseRemainingMs).toBe(0);
    expect(manual.targetIndex).toBe(1);
  });

  it("resumes patrol toward the pending point after a manual arrival", () => {
    const manual = beginManual(initialPatrol(POINTS));
    const resumed = onArrival(manual, PAUSE_MS);
    expect(resumed.mode).toBe("patrol");
    expect(resumed.phase).toBe("travelling");
    expect(resumed.targetIndex).toBe(0);
  });
});

describe("patrol look direction", () => {
  it("points unit-length toward the next point while paused", () => {
    const paused = onArrival(initialPatrol(POINTS), PAUSE_MS);
    const direction = patrolLookDirection(paused, { x: 0, y: 0 });
    expect(direction).toEqual({ x: 1, y: 0 });
    expect(Math.hypot(direction?.x ?? 0, direction?.y ?? 0)).toBeCloseTo(1);
  });

  it("returns null while travelling", () => {
    expect(patrolLookDirection(initialPatrol(POINTS), { x: 5, y: 0 })).toBeNull();
  });

  it("returns null in manual mode even while paused", () => {
    const manual = beginManual(onArrival(initialPatrol(POINTS), PAUSE_MS));
    expect(patrolLookDirection(manual, { x: 0, y: 0 })).toBeNull();
  });

  it("returns null when already standing on the next point", () => {
    const duplicate = [
      { x: 4, y: 4 },
      { x: 4, y: 4 },
    ];
    const paused = onArrival(initialPatrol(duplicate), PAUSE_MS);
    expect(patrolLookDirection(paused, { x: 4, y: 4 })).toBeNull();
  });

  it("rejects a non-finite position", () => {
    expect(() =>
      patrolLookDirection(initialPatrol(POINTS), { x: Number.NaN, y: 0 }),
    ).toThrow("Vector components");
  });
});

describe("patrol circuit on the lab map", () => {
  it("keeps every patrol point walkable", () => {
    for (const point of PATROL_POINTS) {
      expect(isWalkable(LAB_MAP, point)).toBe(true);
    }
  });

  it("reaches every patrol point from the guard start", () => {
    for (const point of PATROL_POINTS) {
      const result = calculateRoute(LAB_MAP, GUARD_START, point, "astar");
      expect(result.status).toBe("success");
      expect(result.path.length).toBeGreaterThan(0);
    }
  });

  it("reaches each circuit point from the previous one", () => {
    for (let index = 0; index < PATROL_POINTS.length; index += 1) {
      const from = PATROL_POINTS[index];
      const to = PATROL_POINTS[(index + 1) % PATROL_POINTS.length];
      if (!from || !to) {
        throw new Error("Patrol circuit invariant failed.");
      }
      const result = calculateRoute(LAB_MAP, from, to, "astar");
      expect(result.status).toBe("success");
      expect(result.path.length).toBeGreaterThan(0);
    }
  });
});
