/**
 * Auto-detect a suggested crop rectangle around the two purple-liquid cylinders.
 *
 * Strategy:
 *  1. Downsample the image for speed.
 *  2. Build a binary mask of "purple-ish" pixels (the standard/sample liquid).
 *  3. Compute the vertical extent (yT, yB) of that mask — only the *purple* side
 *     registers, but its height tells us where the cylinders are vertically.
 *  4. Pad ~12% above/below, lock to 4:3, and **center horizontally on the image**
 *     so we capture both the purple "before" and the lighter "after" side
 *     even when only the purple side has detectable color.
 *  5. Return the bounding box in the *original* image's pixel coordinates.
 *
 * If the mask is too small (< 2% of pixels) we fall back to the centered 4:3 crop —
 * the existing default behavior — and the quality check will surface the issue
 * downstream as "noBottlesDetected".
 */

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TARGET_ASPECT = 4 / 3;
const PAD_RATIO = 0.12;
const MIN_PURPLE_RATIO = 0.02;

/** Detect a crop box in original-image coordinates. */
export function suggestCropBox(image: HTMLImageElement): CropBox {
  const sw = image.naturalWidth || image.width;
  const sh = image.naturalHeight || image.height;

  const work = downsample(image, 320);
  const ctx = work.getContext("2d", { willReadFrequently: true });
  if (!ctx) return centeredCrop(sw, sh);
  const { width: ww, height: wh } = work;
  const data = ctx.getImageData(0, 0, ww, wh).data;

  // Find tight bounding box of purple pixels
  let minX = ww;
  let maxX = -1;
  let minY = wh;
  let maxY = -1;
  let purpleCount = 0;
  for (let y = 0; y < wh; y++) {
    for (let x = 0; x < ww; x++) {
      const i = (y * ww + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isPurple(r, g, b)) {
        purpleCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const totalPx = ww * wh;
  if (purpleCount / totalPx < MIN_PURPLE_RATIO || maxX < 0) {
    return centeredCrop(sw, sh);
  }

  // Convert vertical extent back to original pixel space (we ignore minX/maxX —
  // the lighter "after" cylinder doesn't register as purple, so a tight horizontal
  // bbox would offset the crop. Instead we anchor horizontally on the image
  // center, since users are guided to center the bottle pair.)
  const sy = sh / wh;
  let y = minY * sy;
  let h = (maxY - minY + 1) * sy;

  // Pad vertically
  const padY = h * PAD_RATIO;
  y -= padY;
  h += padY * 2;

  // Width from height + target aspect
  let w = h * TARGET_ASPECT;
  let x = (sw - w) / 2;

  // If the aspect-locked width exceeds the image, fall back to width-driven sizing
  if (w > sw) {
    w = sw;
    h = w / TARGET_ASPECT;
    x = 0;
    y = (sh - h) / 2;
  }

  // Clamp vertical bounds (maintains aspect by shrinking if needed)
  if (y < 0) {
    const overshoot = -y;
    y = 0;
    h -= overshoot;
    w = h * TARGET_ASPECT;
    x = (sw - w) / 2;
  }
  if (y + h > sh) {
    h = sh - y;
    w = h * TARGET_ASPECT;
    x = (sw - w) / 2;
  }

  return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) };
}

/** Centered 4:3 crop (used as fallback). */
function centeredCrop(sw: number, sh: number): CropBox {
  const aspect = sw / sh;
  let w: number;
  let h: number;
  if (aspect > TARGET_ASPECT) {
    h = sh;
    w = sh * TARGET_ASPECT;
  } else {
    w = sw;
    h = sw / TARGET_ASPECT;
  }
  return {
    x: Math.round((sw - w) / 2),
    y: Math.round((sh - h) / 2),
    width: Math.round(w),
    height: Math.round(h),
  };
}

function isPurple(r: number, g: number, b: number): boolean {
  // Avoid background paper (very bright) and shadows (very dark)
  if (r > 240 && g > 240 && b > 240) return false;
  if (r < 40 && g < 40 && b < 40) return false;
  // Purple = R noticeably > G, B at least near G, R reasonably saturated
  return r > g + 18 && b > g - 8 && r > 90;
}

/** Downsample an image to a working canvas no larger than maxDim. */
function downsample(image: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const sw = image.naturalWidth || image.width;
  const sh = image.naturalHeight || image.height;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx) ctx.drawImage(image, 0, 0, w, h);
  return canvas;
}

/** Render a crop box from an image into a new canvas at the requested output size. */
export function renderCrop(
  image: HTMLImageElement,
  box: CropBox,
  outputWidth = 960,
  outputHeight = 720
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, outputWidth, outputHeight);
  return canvas;
}

/** Convert a canvas to a Blob (for FormData upload). */
export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      type,
      quality
    );
  });
}
