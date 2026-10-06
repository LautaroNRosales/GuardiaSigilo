import { describe, expect, it } from "vitest";
import { alertStyle } from "../../src/game/presentation/alertStyle";

describe("alert style", () => {
  it("keeps the border fully off while not alerting (CA-5)", () => {
    for (const progress of [0, 0.5, 1, 99]) {
      expect(alertStyle(false, progress)).toEqual({
        borderColor: expect.any(Number),
        borderAlpha: 0,
        borderWidth: 0,
      });
    }
  });

  it("shows a subtle rest border while alerting", () => {
    const resting = alertStyle(true, 0);
    expect(resting.borderAlpha).toBeCloseTo(0.35, 5);
    expect(resting.borderWidth).toBe(2);
  });

  it("decays monotonically from flash to rest (CA-5)", () => {
    const strong = alertStyle(true, 1);
    const halfway = alertStyle(true, 0.5);
    const resting = alertStyle(true, 0);

    expect(strong.borderAlpha).toBeCloseTo(0.85, 5);
    expect(strong.borderWidth).toBe(6);
    expect(halfway.borderAlpha).toBeGreaterThan(resting.borderAlpha);
    expect(strong.borderAlpha).toBeGreaterThan(halfway.borderAlpha);
    expect(strong.borderWidth).toBeGreaterThan(halfway.borderWidth);
    expect(strong.borderColor).toBe(resting.borderColor);
  });

  it("clamps flash progress outside [0,1] and non-finite values", () => {
    expect(alertStyle(true, 5)).toEqual(alertStyle(true, 1));
    expect(alertStyle(true, -2)).toEqual(alertStyle(true, 0));
    expect(alertStyle(true, Number.NaN)).toEqual(alertStyle(true, 0));
    expect(alertStyle(true, Number.POSITIVE_INFINITY)).toEqual(alertStyle(true, 1));
  });
});
