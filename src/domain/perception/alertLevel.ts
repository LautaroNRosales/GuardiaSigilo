import type { PerceptionMemory } from "./memory";

export const VISION_DECAY_MS = 6000;
export const SOUND_DECAY_MS = 3000;
export const SOUND_PEAK = 0.6;

export function alertLevel(
  memory: PerceptionMemory,
  visionVisible: boolean,
  currentTimeMs: number,
): number {
  if (!Number.isFinite(currentTimeMs)) {
    throw new Error("Current time must be finite.");
  }
  if (visionVisible) {
    return 1;
  }
  if (memory.source === null || memory.lastPerceivedAtMs === null) {
    return 0;
  }

  const isVision = memory.source === "vision";
  const peak = isVision ? 1 : SOUND_PEAK;
  const decayMs = isVision ? VISION_DECAY_MS : SOUND_DECAY_MS;
  const age = Math.max(0, currentTimeMs - memory.lastPerceivedAtMs);
  const remaining = 1 - age / decayMs;

  return remaining <= 0 ? 0 : peak * remaining;
}
