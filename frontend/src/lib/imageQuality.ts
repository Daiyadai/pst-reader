/**
 * Browser-side image quality checks.
 *
 * Run on a cropped image (after the crop step) before sending to /api/analyze-combined.
 * If any check fails the user gets a localized message and a "retake" / "use anyway" choice.
 *
 * All functions accept a HTMLCanvasElement so we don't repeatedly decode the image.
 */

export type QualityIssueKey =
  | "tooDark"
  | "tooBright"
  | "colorCastYellow"
  | "colorCastBlue"
  | "blurry"
  | "noBottlesDetected"
  | "tooLowRes";

export interface QualityIssueDetail {
  key: QualityIssueKey;
  severity: "warning" | "error";
  /** Numeric value that triggered the issue, in the metric's native unit. */
  value: number;
  /** Threshold the value was compared against. */
  threshold: number;
  /** Optional formatted "X / Y" snippet to display under the message. */
  display?: string;
}

export interface QualityCheckResult {
  passed: boolean;
  issues: QualityIssueDetail[];
  metrics: {
    brightness: number;        // mean luminance, 0-255
    rOverGray: number;         // R / mean(R,G,B)
    bOverGray: number;         // B / mean(R,G,B)
    sharpness: number;         // edge variance proxy (Laplacian-like), 0-∞
    purpleAreaRatio: number;   // fraction of pixels that look purple (0-1)
    width: number;             // source image width, in pixels
    height: number;            // source image height, in pixels
  };
}

export const THRESHOLDS = {
  brightnessMin: 60,         // below this = too dark
  brightnessMax: 220,        // above this = blown out
  castDeviation: 0.18,       // channel/gray ratio outside 1±this = color cast
  sharpnessMin: 30,          // below this = blurry
  purpleAreaMin: 0.05,       // less than 5% purple = no bottles in frame
  // Hard floor: source images smaller than this can't be salvaged by upscaling.
  // Auto-upscale handles the 600–1200 range for UX; this threshold flags only
  // images that genuinely lack pixel-level detail for color extraction.
  minWidth: 350,
  minHeight: 250,
};

/** Convert an HTMLImageElement (or already-loaded image) to a downsampled canvas for fast analysis. */
export function imageToAnalysisCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  maxDim = 400
): HTMLCanvasElement {
  const sw = source.width;
  const sh = source.height;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas context unavailable");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

/** Mean RGB and luminance over the canvas. */
function meanColor(data: Uint8ClampedArray): {
  r: number;
  g: number;
  b: number;
  lum: number;
} {
  let r = 0,
    g = 0,
    b = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  r /= n;
  g /= n;
  b /= n;
  // Rec. 601 luminance
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return { r, g, b, lum };
}

/**
 * Sharpness proxy: variance of a 3x3 Laplacian kernel applied to luminance.
 * Higher = more edges = sharper. Blurry photos give very low values.
 */
function sharpnessVariance(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  // Build a luminance buffer first
  const lum = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    lum[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = lum[y * width + x];
      const up = lum[(y - 1) * width + x];
      const down = lum[(y + 1) * width + x];
      const left = lum[y * width + (x - 1)];
      const right = lum[y * width + (x + 1)];
      // Discrete Laplacian
      const lap = -4 * c + up + down + left + right;
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

/**
 * Fraction of pixels that look "purple" — high red, low green, moderate-to-high blue,
 * with red dominant over green. Used as a proxy for "are there bottles of standard
 * solution in frame?"
 */
function purplePixelRatio(data: Uint8ClampedArray): number {
  let purple = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Skip near-black and near-white pixels (text, reflections, paper)
    if (r < 50 && g < 50 && b < 50) continue;
    if (r > 240 && g > 240 && b > 240) continue;
    // Purple: r > g, b is meaningful, r dominant
    if (r > g + 15 && b > g - 10 && r > 80) {
      purple++;
    }
  }
  return purple / n;
}

/** Run all quality checks on a cropped image.
 *
 * `source` is the cropped output canvas/image used for color analysis.
 * `originalSize` (optional) is the *pre-upscale* resolution of the user's
 * uploaded file — used for the resolution warning. If we auto-upscaled a
 * tiny screenshot up to 1200px, the cropped canvas looks fine but the
 * underlying detail is still limited; we want to warn based on the original.
 */
export function runQualityChecks(
  source: HTMLImageElement | HTMLCanvasElement,
  originalSize?: { width: number; height: number }
): QualityCheckResult {
  const canvas = imageToAnalysisCanvas(source);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas context unavailable");
  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const sourceWidth = originalSize?.width ?? ("naturalWidth" in source ? source.naturalWidth : source.width);
  const sourceHeight = originalSize?.height ?? ("naturalHeight" in source ? source.naturalHeight : source.height);

  const { r, g, b, lum } = meanColor(data);
  const grayMean = (r + g + b) / 3 || 1;
  const rOverGray = r / grayMean;
  const bOverGray = b / grayMean;
  const sharp = sharpnessVariance(data, width, height);
  const purple = purplePixelRatio(data);

  const issues: QualityIssueDetail[] = [];
  const r1 = round;

  if (sourceWidth < THRESHOLDS.minWidth || sourceHeight < THRESHOLDS.minHeight) {
    issues.push({
      key: "tooLowRes",
      severity: "error",
      value: sourceWidth,
      threshold: THRESHOLDS.minWidth,
      display: `${sourceWidth}×${sourceHeight} px (≥ ${THRESHOLDS.minWidth}×${THRESHOLDS.minHeight} recommended)`,
    });
  }
  if (lum < THRESHOLDS.brightnessMin) {
    issues.push({
      key: "tooDark",
      severity: "warning",
      value: r1(lum),
      threshold: THRESHOLDS.brightnessMin,
      display: `${r1(lum)} / 255 (need ≥ ${THRESHOLDS.brightnessMin})`,
    });
  }
  if (lum > THRESHOLDS.brightnessMax) {
    issues.push({
      key: "tooBright",
      severity: "warning",
      value: r1(lum),
      threshold: THRESHOLDS.brightnessMax,
      display: `${r1(lum)} / 255 (max ${THRESHOLDS.brightnessMax})`,
    });
  }
  if (rOverGray > 1 + THRESHOLDS.castDeviation && bOverGray < 1 - THRESHOLDS.castDeviation) {
    issues.push({
      key: "colorCastYellow",
      severity: "warning",
      value: r1(rOverGray, 2),
      threshold: 1 + THRESHOLDS.castDeviation,
      display: `R/gray=${r1(rOverGray, 2)}, B/gray=${r1(bOverGray, 2)}`,
    });
  }
  if (bOverGray > 1 + THRESHOLDS.castDeviation && rOverGray < 1 - THRESHOLDS.castDeviation) {
    issues.push({
      key: "colorCastBlue",
      severity: "warning",
      value: r1(bOverGray, 2),
      threshold: 1 + THRESHOLDS.castDeviation,
      display: `R/gray=${r1(rOverGray, 2)}, B/gray=${r1(bOverGray, 2)}`,
    });
  }
  if (sharp < THRESHOLDS.sharpnessMin) {
    issues.push({
      key: "blurry",
      severity: "warning",
      value: r1(sharp),
      threshold: THRESHOLDS.sharpnessMin,
      display: `sharpness ${r1(sharp)} (need ≥ ${THRESHOLDS.sharpnessMin})`,
    });
  }
  if (purple < THRESHOLDS.purpleAreaMin) {
    issues.push({
      key: "noBottlesDetected",
      severity: "error",
      value: r1(purple * 100, 1),
      threshold: THRESHOLDS.purpleAreaMin * 100,
      display: `${r1(purple * 100, 1)}% purple pixels (need ≥ ${r1(THRESHOLDS.purpleAreaMin * 100, 0)}%)`,
    });
  }

  return {
    passed: issues.length === 0,
    issues,
    metrics: {
      brightness: r1(lum),
      rOverGray: r1(rOverGray, 3),
      bOverGray: r1(bOverGray, 3),
      sharpness: r1(sharp),
      purpleAreaRatio: r1(purple, 3),
      width: sourceWidth,
      height: sourceHeight,
    },
  };
}

function round(v: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
