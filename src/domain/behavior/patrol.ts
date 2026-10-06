import { assertFiniteVector, normalized, type Vector2 } from "../model/vector";

export type PatrolPhase = "travelling" | "paused";
export type PatrolMode = "patrol" | "manual";

export interface PatrolState {
  readonly points: readonly Vector2[];
  readonly targetIndex: number;
  readonly phase: PatrolPhase;
  readonly mode: PatrolMode;
  readonly pauseRemainingMs: number;
}

export function initialPatrol(points: readonly Vector2[]): PatrolState {
  if (points.length === 0) {
    throw new Error("Patrol requires at least one point.");
  }
  points.forEach(assertFiniteVector);
  return {
    points,
    targetIndex: 0,
    phase: "travelling",
    mode: "patrol",
    pauseRemainingMs: 0,
  };
}

export function patrolTarget(state: PatrolState): Vector2 {
  const target = state.points[state.targetIndex];
  if (!target) {
    throw new Error("Patrol target invariant failed.");
  }
  return target;
}

export function beginManual(state: PatrolState): PatrolState {
  return { ...state, mode: "manual", phase: "travelling", pauseRemainingMs: 0 };
}

export function onArrival(state: PatrolState, pauseDurationMs: number): PatrolState {
  if (!Number.isFinite(pauseDurationMs) || pauseDurationMs < 0) {
    throw new Error("Pause duration must be finite and non-negative.");
  }

  if (state.mode === "manual") {
    return { ...state, mode: "patrol", phase: "travelling", pauseRemainingMs: 0 };
  }

  if (state.phase === "paused") {
    return state;
  }

  return {
    ...state,
    targetIndex: (state.targetIndex + 1) % state.points.length,
    phase: "paused",
    pauseRemainingMs: pauseDurationMs,
  };
}

export function tick(state: PatrolState, deltaMs: number): PatrolState {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new Error("Tick duration must be finite and non-negative.");
  }
  if (state.phase !== "paused") {
    return state;
  }

  const remaining = state.pauseRemainingMs - deltaMs;
  if (remaining > 0) {
    return { ...state, pauseRemainingMs: remaining };
  }
  return { ...state, phase: "travelling", pauseRemainingMs: 0 };
}

export function patrolLookDirection(
  state: PatrolState,
  currentPosition: Vector2,
): Vector2 | null {
  assertFiniteVector(currentPosition);
  if (state.mode !== "patrol" || state.phase !== "paused") {
    return null;
  }
  const target = patrolTarget(state);
  return normalized({
    x: target.x - currentPosition.x,
    y: target.y - currentPosition.y,
  });
}

export function skipPatrolPoint(state: PatrolState): PatrolState {
  return {
    ...state,
    targetIndex: (state.targetIndex + 1) % state.points.length,
    phase: "travelling",
    pauseRemainingMs: 0,
  };
}
