/**
 * Auto-upscale helper.
 *
 * If a user uploads a small image (screenshot, compressed forward, etc.),
 * we enlarge it 2×–4× via canvas resampling before showing the crop UI.
 * Larger pixels make the crop rectangle easier to drag accurately and the
 * preview is clearer.
 *
 * IMPORTANT: this does NOT add real detail — it's a UX aid. The PST
 * analysis still depends on the source pixels' actual color information.
 * If the original image is genuinely too small to be informative
 * (e.g. 100×75), upscaling will produce a comfortable crop UI but the
 * downstream quality check will still flag it via `tooLowRes`.
 */

const TARGET_LONGER_DIM = 1200;   // aim for at least this many pixels on the long side
const MAX_SCALE = 4;              // never upscale more than 4×
const HARD_MIN_DIM = 250;         // below this on either axis = analysis can't recover

export interface UpscaledImage {
  /** Object URL pointing to the (possibly upscaled) image. */
  url: string;
  /** Final width after upscaling. */
  width: number;
  /** Final height after upscaling. */
  height: number;
  /** Source width before upscaling. */
  originalWidth: number;
  /** Source height before upscaling. */
  originalHeight: number;
  /** 1 = no upscale applied, 2/3/4 = applied scale factor. */
  scale: number;
  /** True when the source was below HARD_MIN_DIM and even max upscale won't recover it. */
  belowHardFloor: boolean;
}

export async function maybeAutoUpscale(file: File): Promise<UpscaledImage> {
  const sourceUrl = URL.createObjectURL(file);
  const img = await loadImage(sourceUrl);
  const { naturalWidth: ow, naturalHeight: oh } = img;
  const longer = Math.max(ow, oh);
  const shorter = Math.min(ow, oh);
  const belowHardFloor = shorter < HARD_MIN_DIM;

  // Determine scale factor: just enough to bring the longer side near TARGET_LONGER_DIM,
  // capped by MAX_SCALE, and only when we actually need it.
  let scale = 1;
  if (longer < TARGET_LONGER_DIM) {
    scale = Math.min(MAX_SCALE, Math.ceil(TARGET_LONGER_DIM / longer));
    if (scale < 2) scale = 2; // if we're upscaling at all, do at least 2×
  }

  if (scale === 1) {
    return {
      url: sourceUrl,
      width: ow,
      height: oh,
      originalWidth: ow,
      originalHeight: oh,
      scale: 1,
      belowHardFloor,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = ow * scale;
  canvas.height = oh * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      url: sourceUrl,
      width: ow,
      height: oh,
      originalWidth: ow,
      originalHeight: oh,
      scale: 1,
      belowHardFloor,
    };
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/jpeg",
      0.92
    );
  });

  URL.revokeObjectURL(sourceUrl); // we no longer need the original
  const upscaledUrl = URL.createObjectURL(blob);

  return {
    url: upscaledUrl,
    width: canvas.width,
    height: canvas.height,
    originalWidth: ow,
    originalHeight: oh,
    scale,
    belowHardFloor,
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("failed to load image"));
    img.src = url;
  });
}
