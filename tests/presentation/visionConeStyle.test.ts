import { describe, expect, it } from "vitest";
import { visionConeStyle } from "../../src/game/presentation/visionConeStyle";
import type { VisionReason } from "../../src/domain/perception/perception";

const REASONS: readonly VisionReason[] = [
  "visible",
  "occluded",
  "out-of-range",
  "outside-cone",
  "invalid-facing",
];

describe("vision cone style", () => {
  it("maps every reason to its own fill color", () => {
    const fills = new Set(REASONS.map((reason) => visionConeStyle(reason, 0).fillColor));
    const strokes = new Set(REASONS.map((reason) => visionConeStyle(reason, 0).strokeColor));
    expect(fills.size).toBe(REASONS.length);
    expect(strokes.size).toBe(REASONS.length);
  });

  it("orders resting alpha by threat level (CA-2)", () => {
    const resting = REASONS.map((reason) => visionConeStyle(reason, 0).fillAlpha);
    expect(resting[0]).toBeGreaterThan(resting[1] ?? 0);
    expect(resting[1]).toBeGreaterThan(resting[2] ?? 0);
    expect(resting[2]).toBeGreaterThan(resting[3] ?? 0);
    expect(resting[3]).toBeGreaterThanOrEqual(resting[4] ?? 0);
  });

  it("raises alpha and stroke as progress grows (CA-3)", () => {
    const atRest = visionConeStyle("occluded", 0);
    const halfway = visionConeStyle("occluded", 0.5);
    const boosted = visionConeStyle("occluded", 1);

    expect(halfway.fillAlpha).toBeGreaterThan(atRest.fillAlpha);
    expect(boosted.fillAlpha).toBeGreaterThan(halfway.fillAlpha);
    expect(boosted.strokeWidth).toBeGreaterThan(atRest.strokeWidth);
    expect(boosted.strokeColor).toBe(atRest.strokeColor);
    expect(boosted.fillColor).toBe(atRest.fillColor);
  });

  it("clamps progress outside [0,1] and non-finite values", () => {
    expect(visionConeStyle("visible", 5)).toEqual(visionConeStyle("visible", 1));
    expect(visionConeStyle("visible", -2)).toEqual(visionConeStyle("visible", 0));
    expect(visionConeStyle("visible", Number.NaN)).toEqual(visionConeStyle("visible", 0));
  });

  it("rejects unknown reasons instead of failing silently", () => {
    expect(() => visionConeStyle("bogus" as VisionReason, 0)).toThrow(
      "Unknown vision reason",
    );
  });
});
