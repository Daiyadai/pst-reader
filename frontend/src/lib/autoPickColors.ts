/**
 * Auto-pick default sample points for the standard and test bottles.
 *
 *   - Standard: left-half center (where the standard bottle's liquid sits)
 *   - Test:     right-half center (where the test sample's liquid sits)
 *
 * The user can override either by tapping. These defaults assume the user
 * followed the photo guidelines (two bottles centered side by side).
 *
 * **Why no auto-pick for the white reference:** tested on 2026-05-11. Auto
 * detection of "white" from image stats is unreliable for these PST photos:
 *   1. The brightest neutral patch can be inside a clean test bottle, not
 *      a true white surface.
 *   2. Image stats cannot distinguish "lab photo with built-in cast (model
 *      trained on it)" from "field photo with novel cast (needs correction)."
 * The white reference is best left to user judgment — they know what's
 * actually white in real life. See sessions/2026-05-10__to__2026-05-11.md.
 */

import { sampleColorAtPoint, type SampledColor } from "./colorPicker";

export interface AutoPick {
  x: number;
  y: number;
  color: SampledColor;
}

export interface AutoPickResult {
  standard: AutoPick;
  test: AutoPick;
}

export function autoPickPoints(image: HTMLImageElement): AutoPickResult | null {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  if (w < 50 || h < 50) return null;

  // Mid-height of each half; slightly below geometric center because liquid
  // typically sits in the lower portion of the bottle.
  const stdX = Math.round(w * 0.25);
  const testX = Math.round(w * 0.75);
  const cy = Math.round(h * 0.55);

  const stdColor = sampleColorAtPoint(image, stdX, cy);
  const testColor = sampleColorAtPoint(image, testX, cy);
  if (!stdColor || !testColor) return null;

  return {
    standard: { x: stdX, y: cy, color: stdColor },
    test: { x: testX, y: cy, color: testColor },
  };
}
