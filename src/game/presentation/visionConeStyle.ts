import type { VisionReason } from "../../domain/perception/perception";

export interface VisionConeStyle {
  readonly fillColor: number;
  readonly fillAlpha: number;
  readonly strokeColor: number;
  readonly strokeWidth: number;
}

interface ConePalette {
  readonly fill: number;
  readonly baseAlpha: number;
  readonly stroke: number;
}

const PALETTE: Readonly<Record<VisionReason, ConePalette>> = {
  visible: { fill: 0xe16969, baseAlpha: 0.3, stroke: 0xffb3b3 },
  occluded: { fill: 0xe5b454, baseAlpha: 0.16, stroke: 0xffe0a3 },
  "out-of-range": { fill: 0x6b8afd, baseAlpha: 0.1, stroke: 0xb9c5ff },
  "outside-cone": { fill: 0x3b566e, baseAlpha: 0.06, stroke: 0x6d8ba3 },
  "invalid-facing": { fill: 0x555f66, baseAlpha: 0.05, stroke: 0x8a939a },
};

const ALPHA_BOOST = 0.15;
const STROKE_BASE = 2;
const STROKE_BOOST = 2;

export function visionConeStyle(reason: VisionReason, progress: number): VisionConeStyle {
  const palette = PALETTE[reason];
  if (!palette) {
    throw new Error(`Unknown vision reason: ${String(reason)}`);
  }

  const clamped = clampProgress(progress);
  return {
    fillColor: palette.fill,
    fillAlpha: palette.baseAlpha + ALPHA_BOOST * clamped,
    strokeColor: palette.stroke,
    strokeWidth: STROKE_BASE + STROKE_BOOST * clamped,
  };
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}
