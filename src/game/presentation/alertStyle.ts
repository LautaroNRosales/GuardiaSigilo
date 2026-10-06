export interface AlertStyle {
  readonly borderColor: number;
  readonly borderAlpha: number;
  readonly borderWidth: number;
}

const ALERT_BORDER_COLOR = 0xe16969;
const REST_ALPHA = 0.35;
const REST_WIDTH = 2;
const FLASH_ALPHA_BOOST = 0.5;
const FLASH_WIDTH_BOOST = 4;

export function alertStyle(isAlertActive: boolean, flashProgress: number): AlertStyle {
  if (!isAlertActive) {
    return { borderColor: ALERT_BORDER_COLOR, borderAlpha: 0, borderWidth: 0 };
  }

  const flash = clampProgress(flashProgress);
  return {
    borderColor: ALERT_BORDER_COLOR,
    borderAlpha: REST_ALPHA + FLASH_ALPHA_BOOST * flash,
    borderWidth: REST_WIDTH + FLASH_WIDTH_BOOST * flash,
  };
}

function clampProgress(value: number): number {
  if (Number.isNaN(value) || value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}
