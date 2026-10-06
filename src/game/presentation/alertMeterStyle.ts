export interface AlertMeterStyle {
  readonly color: number;
}

const CALM_COLOR = 0x73c991;
const SUSPICION_COLOR = 0xe5b454;
const ALERT_COLOR = 0xe16969;

export function alertMeterStyle(level: number): AlertMeterStyle {
  if (!Number.isFinite(level)) {
    throw new Error(`Alert level must be finite: ${String(level)}`);
  }

  const clamped = Math.min(1, Math.max(0, level));
  if (clamped < 1 / 3) {
    return { color: CALM_COLOR };
  }
  if (clamped < 2 / 3) {
    return { color: SUSPICION_COLOR };
  }
  return { color: ALERT_COLOR };
}
