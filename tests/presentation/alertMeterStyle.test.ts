import { describe, expect, it } from "vitest";
import { alertMeterStyle } from "../../src/game/presentation/alertMeterStyle";

const CALM = 0x73c991;
const SUSPICION = 0xe5b454;
const ALERT = 0xe16969;

describe("alert meter style", () => {
  it("colors the meter by thirds (CA-3)", () => {
    expect(alertMeterStyle(0).color).toBe(CALM);
    expect(alertMeterStyle(0.3).color).toBe(CALM);
    expect(alertMeterStyle(1 / 3).color).toBe(SUSPICION);
    expect(alertMeterStyle(0.6).color).toBe(SUSPICION);
    expect(alertMeterStyle(2 / 3).color).toBe(ALERT);
    expect(alertMeterStyle(1).color).toBe(ALERT);
  });

  it("clamps finite levels outside [0,1] (CA-3)", () => {
    expect(alertMeterStyle(-5).color).toBe(alertMeterStyle(0).color);
    expect(alertMeterStyle(5).color).toBe(alertMeterStyle(1).color);
  });

  it("rejects non-finite levels instead of failing silently (CA-3)", () => {
    expect(() => alertMeterStyle(Number.NaN)).toThrow("Alert level must be finite");
    expect(() => alertMeterStyle(Number.POSITIVE_INFINITY)).toThrow(
      "Alert level must be finite",
    );
  });
});
