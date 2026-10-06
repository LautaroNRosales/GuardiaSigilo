import { describe, expect, it } from "vitest";
import {
  alertLevel,
  SOUND_DECAY_MS,
  SOUND_PEAK,
  VISION_DECAY_MS,
} from "../../src/domain/perception/alertLevel";
import {
  emptyPerceptionMemory,
  type PerceptionMemory,
} from "../../src/domain/perception/memory";

function memoryWith(source: "vision" | "sound", observedAtMs: number): PerceptionMemory {
  return { lastKnownPosition: { x: 0, y: 0 }, lastPerceivedAtMs: observedAtMs, source };
}

describe("alertLevel", () => {
  it("returns 1 whenever the guard can see the player, even with empty memory (CA-1)", () => {
    expect(alertLevel(emptyPerceptionMemory(), true, 0)).toBe(1);
    expect(alertLevel(memoryWith("sound", 0), true, VISION_DECAY_MS * 10)).toBe(1);
  });

  it("returns 0 with no memory (CA-2)", () => {
    expect(alertLevel(emptyPerceptionMemory(), false, 5000)).toBe(0);
  });

  it("decays linearly from 1 over the vision window (CA-1)", () => {
    const memory = memoryWith("vision", 0);
    expect(alertLevel(memory, false, 0)).toBe(1);
    expect(alertLevel(memory, false, VISION_DECAY_MS / 2)).toBeCloseTo(0.5, 5);
    expect(alertLevel(memory, false, VISION_DECAY_MS)).toBe(0);
    expect(alertLevel(memory, false, VISION_DECAY_MS * 2)).toBe(0);
  });

  it("decays linearly from SOUND_PEAK over the sound window (CA-1)", () => {
    const memory = memoryWith("sound", 0);
    expect(alertLevel(memory, false, 0)).toBe(SOUND_PEAK);
    expect(alertLevel(memory, false, SOUND_DECAY_MS / 2)).toBeCloseTo(SOUND_PEAK / 2, 5);
    expect(alertLevel(memory, false, SOUND_DECAY_MS)).toBe(0);
    expect(alertLevel(memory, false, SOUND_DECAY_MS * 2)).toBe(0);
  });

  it("never leaves the [0,1] range (CA-2)", () => {
    const samples = [
      alertLevel(memoryWith("vision", 1000), false, 0),
      alertLevel(memoryWith("sound", 1000), false, 0),
      alertLevel(memoryWith("vision", 0), false, 99999),
      alertLevel(memoryWith("sound", 0), false, 99999),
    ];
    for (const sample of samples) {
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThanOrEqual(1);
    }
  });

  it("rejects non-finite time (CA-2)", () => {
    expect(() => alertLevel(emptyPerceptionMemory(), false, Number.NaN)).toThrow(
      "Current time must be finite.",
    );
    expect(() => alertLevel(emptyPerceptionMemory(), false, Number.POSITIVE_INFINITY)).toThrow(
      "Current time must be finite.",
    );
  });
});
