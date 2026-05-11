/**
 * Build a synthetic two-color image to feed the existing /api/analyze-combined
 * endpoint. Left half is the standard color, right half is the test color.
 *
 * The backend pipeline:
 *   1. split image at midpoint
 *   2. center-crop each half (30%/20% margins)
 *   3. take median RGB of pixels in [60, 240] range
 *   4. RGB → LAB → features → predict
 *
 * Filling each half with a uniform color means step 3 returns exactly that
 * color. So the predicted PST depends ONLY on the two colors we provide.
 *
 * Optionally, when a white reference click is available, we *correct* the two
 * colors first — scale each channel so the white reference becomes pure white.
 * That cancels the per-photo lighting bias before the model sees the values.
 */

import { canvasToBlob } from "./autoCrop";

const OUTPUT_W = 960;
const OUTPUT_H = 720;
const WB_TARGET = 240;     // we don't push to 255 — keep some headroom
// Clamp range needs to be wide enough to actually correct cast.
// Initial [0.7, 1.4] truncated all real corrections — empirically a darkish
// neutral reference like (158, 154, 151) needs ~1.5x scaling to reach 240.
const WB_MIN_SCALE = 0.5;
const WB_MAX_SCALE = 2.0;

// Guards on whether to apply WB at all (see decideWBAction).
const ALREADY_WHITE_MIN_CHANNEL = 220;  // all channels at/above this = pure white-ish
const ALREADY_WHITE_MAX_SPREAD = 15;    //   AND max-min ≤ this = no cast to correct
const CLEARLY_NOT_WHITE_SPREAD = 50;    // max-min above this = obviously colored, not white

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type WBAction =
  | { kind: "apply"; scales: { sR: number; sG: number; sB: number } }
  | { kind: "skip-already-white" }
  | { kind: "skip-not-white" };

function spread(c: RGB): number {
  return Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
}

function minChannel(c: RGB): number {
  return Math.min(c.r, c.g, c.b);
}

/** Decide whether a clicked white reference should actually trigger WB.
 *
 * Two cases produce a no-op:
 *   - reference is already near pure-white → no cast to correct (lab photos)
 *   - reference is highly saturated → user likely tapped a bottle by mistake
 */
export function decideWBAction(whiteRef: RGB): WBAction {
  const sp = spread(whiteRef);
  if (minChannel(whiteRef) >= ALREADY_WHITE_MIN_CHANNEL && sp <= ALREADY_WHITE_MAX_SPREAD) {
    return { kind: "skip-already-white" };
  }
  if (sp > CLEARLY_NOT_WHITE_SPREAD) {
    return { kind: "skip-not-white" };
  }
  return {
    kind: "apply",
    scales: {
      sR: clampScale(WB_TARGET / Math.max(whiteRef.r, 10)),
      sG: clampScale(WB_TARGET / Math.max(whiteRef.g, 10)),
      sB: clampScale(WB_TARGET / Math.max(whiteRef.b, 10)),
    },
  };
}

/** Apply a per-channel scale derived from a clicked white reference. */
export function applyWhiteBalance(color: RGB, whiteRef: RGB): RGB {
  const action = decideWBAction(whiteRef);
  if (action.kind !== "apply") return color;
  const { sR, sG, sB } = action.scales;
  return {
    r: Math.round(color.r * sR),
    g: Math.round(color.g * sG),
    b: Math.round(color.b * sB),
  };
}

/** Compute the per-channel scale factors so the caller can also display them. */
export function whiteBalanceScales(whiteRef: RGB): { sR: number; sG: number; sB: number } {
  return {
    sR: clampScale(WB_TARGET / Math.max(whiteRef.r, 10)),
    sG: clampScale(WB_TARGET / Math.max(whiteRef.g, 10)),
    sB: clampScale(WB_TARGET / Math.max(whiteRef.b, 10)),
  };
}

function clampScale(s: number): number {
  return Math.max(WB_MIN_SCALE, Math.min(WB_MAX_SCALE, s));
}

export function synthesizeTwoColorCanvas(
  standard: RGB,
  test: RGB,
  whiteRef?: RGB | null
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_W;
  canvas.height = OUTPUT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Apply WB correction if a reference was provided
  const corrL = whiteRef ? applyWhiteBalance(standard, whiteRef) : standard;
  const corrR = whiteRef ? applyWhiteBalance(test, whiteRef) : test;

  // Clamp to the [60, 240] range the backend filters expect
  const sLeft = clampForBackend(corrL);
  const sRight = clampForBackend(corrR);

  ctx.fillStyle = `rgb(${sLeft.r}, ${sLeft.g}, ${sLeft.b})`;
  ctx.fillRect(0, 0, OUTPUT_W / 2, OUTPUT_H);

  ctx.fillStyle = `rgb(${sRight.r}, ${sRight.g}, ${sRight.b})`;
  ctx.fillRect(OUTPUT_W / 2, 0, OUTPUT_W / 2, OUTPUT_H);

  return canvas;
}

function clampForBackend(c: RGB): RGB {
  return {
    r: Math.max(61, Math.min(239, Math.round(c.r))),
    g: Math.max(61, Math.min(239, Math.round(c.g))),
    b: Math.max(61, Math.min(239, Math.round(c.b))),
  };
}

export async function synthesizeTwoColorBlob(
  standard: RGB,
  test: RGB,
  whiteRef?: RGB | null
): Promise<{ blob: Blob; canvas: HTMLCanvasElement; correctedStandard: RGB; correctedTest: RGB }> {
  const canvas = synthesizeTwoColorCanvas(standard, test, whiteRef);
  const blob = await canvasToBlob(canvas);
  const correctedStandard = whiteRef ? applyWhiteBalance(standard, whiteRef) : standard;
  const correctedTest = whiteRef ? applyWhiteBalance(test, whiteRef) : test;
  return { blob, canvas, correctedStandard, correctedTest };
}
