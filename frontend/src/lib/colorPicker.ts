/**
 * Click-to-sample color extraction.
 *
 * Given an image and a point (in image pixel coordinates), sample a small
 * neighborhood and return the median RGB. Median (not mean) because it
 * shrugs off label text, reflections, and edge pixels that happen to be
 * in the sampling window.
 *
 * Sampling window is ~7% of the shorter image dim, capped at 60px wide,
 * floor 16px. Big enough to average out noise, small enough to stay inside
 * a single cylinder.
 */

export interface SampledColor {
  r: number;
  g: number;
  b: number;
  /** sample window size used (square, in pixels) */
  size: number;
  /** how many pixels were inside the sampling window */
  pixelCount: number;
}

export function sampleColorAtPoint(
  image: HTMLImageElement | HTMLCanvasElement,
  imgX: number,
  imgY: number
): SampledColor | null {
  const w = "naturalWidth" in image ? image.naturalWidth : image.width;
  const h = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (w === 0 || h === 0) return null;

  // Window size: aim for ~7% of shorter side, in [16, 60]
  const shortSide = Math.min(w, h);
  const size = Math.max(16, Math.min(60, Math.round(shortSide * 0.07)));
  const half = Math.floor(size / 2);
  const x0 = Math.max(0, Math.round(imgX) - half);
  const y0 = Math.max(0, Math.round(imgY) - half);
  const x1 = Math.min(w, x0 + size);
  const y1 = Math.min(h, y0 + size);
  const sampleW = x1 - x0;
  const sampleH = y1 - y0;
  if (sampleW <= 0 || sampleH <= 0) return null;

  // Render into a small canvas at full source resolution
  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, x0, y0, sampleW, sampleH, 0, 0, sampleW, sampleH);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    // Drop very bright (likely reflections / glare) and very dark (text/edges)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 30 && g < 30 && b < 30) continue;
    if (r > 248 && g > 248 && b > 248) continue;
    rs.push(r);
    gs.push(g);
    bs.push(b);
  }

  if (rs.length === 0) {
    // All filtered — fallback to whatever we have
    for (let i = 0; i < data.length; i += 4) {
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }
  }

  return {
    r: median(rs),
    g: median(gs),
    b: median(bs),
    size,
    pixelCount: rs.length,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Format an RGB tuple as a CSS color string. */
export function rgbToCss(c: { r: number; g: number; b: number }): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

/** Convert event coordinates on an <img> element to source-pixel coordinates. */
export function eventToImageCoords(
  e: React.MouseEvent | React.TouchEvent,
  imgEl: HTMLImageElement
): { x: number; y: number } | null {
  const rect = imgEl.getBoundingClientRect();
  let clientX = 0;
  let clientY = 0;
  if ("touches" in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if ("changedTouches" in e && (e as React.TouchEvent).changedTouches.length > 0) {
    clientX = (e as React.TouchEvent).changedTouches[0].clientX;
    clientY = (e as React.TouchEvent).changedTouches[0].clientY;
  } else if ("clientX" in e) {
    clientX = (e as React.MouseEvent).clientX;
    clientY = (e as React.MouseEvent).clientY;
  } else {
    return null;
  }
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
    return null;
  }
  const scaleX = imgEl.naturalWidth / rect.width;
  const scaleY = imgEl.naturalHeight / rect.height;
  return { x: localX * scaleX, y: localY * scaleY };
}
