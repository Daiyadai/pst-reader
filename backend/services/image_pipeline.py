"""
Image pre-processing pipeline.

Goal: take a raw user upload and either
  (a) return a canonical 960x720 image ready for analysis, with optional
      white-balance correction applied when a clear neutral reference is
      found OUTSIDE the bottle regions, OR
  (b) reject the upload with a structured reason + actionable advice.

Why these steps (and why this order):
  1. Upscale if the input is small — bigger pixels make subsequent steps
     (bottle detection, color sampling) more reliable.
  2. Detect the two bottles — find their bounding boxes via purple-pixel
     analysis. This is the gate: if we can't find two distinct vertical
     regions, the photo doesn't match what the model knows.
  3. Auto-crop to a 4:3 box around the detected bottles. This replaces the
     hardcoded center-crop that was the original field bug.
  4. Quality checks on the cropped result (brightness, sharpness, color cast)
     — reject anything genuinely unusable.
  5. Conservative auto-WB: scan ONLY the non-bottle areas of the crop for a
     bright near-neutral reference. Only apply WB when one is found AND it
     shows a real cast. Otherwise leave the image alone.

The whole pipeline is one Python module with pure functions; tests at the
bottom and the analyze.py endpoint composes them.
"""

from __future__ import annotations

import io
import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from PIL import Image


# ---------- public types ----------

@dataclass
class BBox:
    x: int
    y: int
    width: int
    height: int

    @property
    def x2(self) -> int:
        return self.x + self.width

    @property
    def y2(self) -> int:
        return self.y + self.height

    @property
    def cx(self) -> float:
        return self.x + self.width / 2

    @property
    def cy(self) -> float:
        return self.y + self.height / 2


@dataclass
class PipelineResult:
    """Outcome of running the pipeline on one image."""
    approved: bool
    # Either approved or rejected; populated based on which
    image: Optional[Image.Image] = None         # canonical 960x720 result, if approved
    standard_bbox: Optional[BBox] = None        # in the *cropped* image's coord space
    test_bbox: Optional[BBox] = None
    wb_applied: bool = False
    wb_reference_rgb: Optional[tuple[int, int, int]] = None
    wb_scales: Optional[tuple[float, float, float]] = None
    auto_upscaled_factor: int = 1
    reject_reason: Optional[str] = None         # one of: 'no_bottles' | 'too_dark' | 'too_bright' | 'too_blurry' | 'too_low_res'
    reject_detail: dict = field(default_factory=dict)


# ---------- thresholds ----------

OUTPUT_W = 960
OUTPUT_H = 720
OUTPUT_ASPECT = OUTPUT_W / OUTPUT_H

UPSCALE_TARGET_LONG_DIM = 1200
UPSCALE_MAX_FACTOR = 4

# Bottle detection
PURPLE_MIN_R_OVER_G = 18      # r - g must exceed this to count as purple
PURPLE_MIN_RED = 90           # minimum red channel value for a purple pixel
# 1% empirically: training data has some lower-saturation standards that
# only reach 1.0-1.5% purple; 2% rejected 9 valid lab images.
PURPLE_AREA_MIN_RATIO = 0.01
PURPLE_BBOX_PAD_RATIO = 0.10  # pad the tight purple bbox by 10% before locking aspect

# Quality checks (on the cropped output)
MIN_BRIGHTNESS = 60
MAX_BRIGHTNESS = 220
# 10 empirically: real iPod photos register 50-200+; bilinear-upscaled PDF
# extracts hit ~2; 10 admits genuinely-readable-but-compressed photos while
# still rejecting truly out-of-focus shots.
MIN_SHARPNESS_VAR = 10
MIN_OUTPUT_DIM = 400  # below this on a side, the analysis pipeline isn't reliable

# Conservative auto-WB
WB_REFERENCE_MIN_BRIGHTNESS = 180   # only consider points that are clearly bright
WB_REFERENCE_MAX_BRIGHTNESS = 245   # but not blown out
WB_REFERENCE_MIN_CAST = 12          # max-min channel spread must indicate a real cast
WB_REFERENCE_MAX_CAST = 50          # too much spread = colored surface, not white
WB_TARGET = 240.0
WB_SCALE_MIN = 0.5
WB_SCALE_MAX = 2.0


# ---------- step 1: upscale ----------

def maybe_upscale(img: Image.Image) -> tuple[Image.Image, int]:
    """Upscale small images so subsequent steps have enough resolution.

    Returns (image, upscale_factor). Factor is 1 if no upscale was needed.
    """
    w, h = img.size
    long_dim = max(w, h)
    if long_dim >= UPSCALE_TARGET_LONG_DIM:
        return img, 1
    factor = min(UPSCALE_MAX_FACTOR, math.ceil(UPSCALE_TARGET_LONG_DIM / long_dim))
    factor = max(2, factor)
    new_size = (w * factor, h * factor)
    return img.resize(new_size, Image.LANCZOS), factor


# ---------- step 2: bottle detection ----------

def detect_bottles(img: Image.Image) -> Optional[tuple[BBox, BBox]]:
    """Find the standard (purple) and test (lighter) bottles.

    Strategy:
      1. Find all purple-ish pixels — this isolates the standard cylinder.
      2. Compute the tight bounding box of those pixels.
      3. Assume the test cylinder is approximately the same size and to the
         right (per the photo guidelines: standard on left, test on right).
      4. If the purple region is missing or too small, return None — caller
         rejects with `no_bottles`.
    """
    arr = np.asarray(img.convert("RGB"))
    h, w = arr.shape[:2]

    R, G, B = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    purple_mask = (
        (R.astype(int) - G.astype(int) > PURPLE_MIN_R_OVER_G)
        & (B.astype(int) > G.astype(int) - 8)
        & (R > PURPLE_MIN_RED)
        & ~((R > 240) & (G > 240) & (B > 240))
        & ~((R < 40) & (G < 40) & (B < 40))
    )

    purple_count = int(purple_mask.sum())
    if purple_count / (w * h) < PURPLE_AREA_MIN_RATIO:
        return None

    ys, xs = np.where(purple_mask)
    minX, maxX = int(xs.min()), int(xs.max())
    minY, maxY = int(ys.min()), int(ys.max())

    # Sanity: purple bbox should be column-shaped (taller than wide)
    purple_w = maxX - minX + 1
    purple_h = maxY - minY + 1
    if purple_h < purple_w * 0.6:  # too wide to be a single cylinder column
        return None

    # Pad the standard bbox slightly
    pad = int(purple_w * PURPLE_BBOX_PAD_RATIO)
    standard = BBox(
        x=max(0, minX - pad),
        y=max(0, minY - pad),
        width=min(w, maxX + pad) - max(0, minX - pad),
        height=min(h, maxY + pad) - max(0, minY - pad),
    )

    # Test bottle assumed to mirror standard to the right.
    test_x = standard.x2 + max(2, int(standard.width * 0.05))  # tiny gap
    test_x = min(test_x, w - standard.width)
    test = BBox(
        x=test_x,
        y=standard.y,
        width=min(standard.width, w - test_x),
        height=standard.height,
    )

    # Test bbox must not be off-screen
    if test.width < standard.width * 0.6:
        return None

    return standard, test


# ---------- step 3: auto-crop ----------

def auto_crop(img: Image.Image, standard: BBox, test: BBox) -> tuple[Image.Image, BBox, BBox]:
    """Crop a 4:3 region around the detected bottle pair and resize to 960x720.

    Returns the cropped image plus the bottle bboxes remapped into output coords.
    """
    w, h = img.size

    # Box that contains both bottles, with padding
    left = min(standard.x, test.x)
    right = max(standard.x2, test.x2)
    top = min(standard.y, test.y)
    bottom = max(standard.y2, test.y2)

    pad_x = (right - left) * 0.10
    pad_y = (bottom - top) * 0.10
    left -= pad_x
    right += pad_x
    top -= pad_y
    bottom += pad_y

    box_w = right - left
    box_h = bottom - top
    box_aspect = box_w / box_h

    # Expand to 4:3 by extending the shorter dimension symmetrically
    if box_aspect > OUTPUT_ASPECT:
        target_h = box_w / OUTPUT_ASPECT
        cy = (top + bottom) / 2
        top = cy - target_h / 2
        bottom = cy + target_h / 2
    else:
        target_w = box_h * OUTPUT_ASPECT
        cx = (left + right) / 2
        left = cx - target_w / 2
        right = cx + target_w / 2

    # Clamp to image bounds while preserving aspect (shrink to fit)
    if left < 0:
        shift = -left
        left, right = 0, right - shift
    if right > w:
        shift = right - w
        left, right = left - shift, w
    if top < 0:
        shift = -top
        top, bottom = 0, bottom - shift
    if bottom > h:
        shift = bottom - h
        top, bottom = top - shift, h

    # If clamping pushed us out of aspect, shrink the longer dim symmetrically
    cur_w = right - left
    cur_h = bottom - top
    cur_aspect = cur_w / cur_h
    if cur_aspect > OUTPUT_ASPECT:
        new_w = cur_h * OUTPUT_ASPECT
        cx = (left + right) / 2
        left = cx - new_w / 2
        right = cx + new_w / 2
    elif cur_aspect < OUTPUT_ASPECT:
        new_h = cur_w / OUTPUT_ASPECT
        cy = (top + bottom) / 2
        top = cy - new_h / 2
        bottom = cy + new_h / 2

    left, top, right, bottom = int(left), int(top), int(right), int(bottom)
    cropped = img.crop((left, top, right, bottom)).resize((OUTPUT_W, OUTPUT_H), Image.LANCZOS)

    # Remap bottle bboxes into output coords
    sx = OUTPUT_W / (right - left)
    sy = OUTPUT_H / (bottom - top)
    def remap(b: BBox) -> BBox:
        return BBox(
            x=int((b.x - left) * sx),
            y=int((b.y - top) * sy),
            width=int(b.width * sx),
            height=int(b.height * sy),
        )

    return cropped, remap(standard), remap(test)


# ---------- step 4: quality checks ----------

@dataclass
class QualityReport:
    brightness: float
    sharpness: float
    width: int
    height: int
    issues: list[str] = field(default_factory=list)


def assess_quality(img: Image.Image) -> QualityReport:
    arr = np.asarray(img.convert("RGB")).astype(float)
    h, w = arr.shape[:2]
    R, G, B = arr[..., 0], arr[..., 1], arr[..., 2]
    lum = 0.299 * R + 0.587 * G + 0.114 * B
    mean_lum = float(lum.mean())

    # Sharpness via Laplacian variance on luminance
    L = lum
    lap = (
        -4 * L[1:-1, 1:-1]
        + L[:-2, 1:-1] + L[2:, 1:-1]
        + L[1:-1, :-2] + L[1:-1, 2:]
    )
    sharpness = float(lap.var())

    report = QualityReport(brightness=mean_lum, sharpness=sharpness, width=w, height=h)

    if w < MIN_OUTPUT_DIM or h < MIN_OUTPUT_DIM:
        report.issues.append("too_low_res")
    if mean_lum < MIN_BRIGHTNESS:
        report.issues.append("too_dark")
    if mean_lum > MAX_BRIGHTNESS:
        report.issues.append("too_bright")
    if sharpness < MIN_SHARPNESS_VAR:
        report.issues.append("too_blurry")

    return report


# ---------- step 5: conservative auto-WB ----------

def find_white_reference_outside_bottles(
    img: Image.Image, standard: BBox, test: BBox
) -> Optional[tuple[int, int, int]]:
    """Scan everything OUTSIDE the bottle bboxes for a bright near-neutral patch.

    Returns the median RGB of that patch, or None if no usable reference exists.
    """
    arr = np.asarray(img.convert("RGB"))
    h, w = arr.shape[:2]

    # Mask out the bottle regions plus a small margin
    margin = 4
    bottle_mask = np.zeros((h, w), dtype=bool)
    for b in (standard, test):
        x0 = max(0, b.x - margin)
        y0 = max(0, b.y - margin)
        x1 = min(w, b.x2 + margin)
        y1 = min(h, b.y2 + margin)
        bottle_mask[y0:y1, x0:x1] = True
    available = ~bottle_mask

    R, G, B = arr[..., 0].astype(float), arr[..., 1].astype(float), arr[..., 2].astype(float)
    lum = 0.299 * R + 0.587 * G + 0.114 * B
    chroma = np.maximum(np.maximum(R, G), B) - np.minimum(np.minimum(R, G), B)

    candidate_mask = (
        available
        & (lum >= WB_REFERENCE_MIN_BRIGHTNESS)
        & (lum <= WB_REFERENCE_MAX_BRIGHTNESS)
        & (chroma >= WB_REFERENCE_MIN_CAST)
        & (chroma <= WB_REFERENCE_MAX_CAST)
    )

    if candidate_mask.sum() < 50:
        return None

    # Median RGB of the brightest 30% of candidates (the "whitest" ones)
    candidate_lum = lum[candidate_mask]
    threshold = float(np.percentile(candidate_lum, 70))
    final_mask = candidate_mask & (lum >= threshold)
    if final_mask.sum() < 30:
        final_mask = candidate_mask  # fallback to all candidates

    median = (
        int(np.median(R[final_mask])),
        int(np.median(G[final_mask])),
        int(np.median(B[final_mask])),
    )
    return median


def apply_white_balance(img: Image.Image, reference: tuple[int, int, int]) -> tuple[Image.Image, tuple[float, float, float]]:
    """Scale each channel so the reference color becomes WB_TARGET."""
    arr = np.asarray(img.convert("RGB")).astype(float)
    sR = max(WB_SCALE_MIN, min(WB_SCALE_MAX, WB_TARGET / max(reference[0], 10)))
    sG = max(WB_SCALE_MIN, min(WB_SCALE_MAX, WB_TARGET / max(reference[1], 10)))
    sB = max(WB_SCALE_MIN, min(WB_SCALE_MAX, WB_TARGET / max(reference[2], 10)))
    arr[..., 0] = np.clip(arr[..., 0] * sR, 0, 255)
    arr[..., 1] = np.clip(arr[..., 1] * sG, 0, 255)
    arr[..., 2] = np.clip(arr[..., 2] * sB, 0, 255)
    return Image.fromarray(arr.astype(np.uint8)), (sR, sG, sB)


# ---------- the full pipeline ----------

def run_pipeline(image_bytes: bytes, apply_auto_wb: bool = False) -> PipelineResult:
    """Run the validate+prepare pipeline on raw image bytes.

    `apply_auto_wb` is off by default. Empirically, even the conservative
    auto-WB (anchored on a bright neutral patch outside the bottles) can
    over-correct real field photos — observed on Hefei 利乐冠 3次 where
    auto-WB pushed PST from 0.18-truth to 0.26 (vs manual gap-pick which
    hit 0.19). The auto-WB code is preserved so it can be enabled per-request
    once we understand what conditions make it safe.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Step 1: upscale if needed
    img, upscale_factor = maybe_upscale(img)

    # Step 2: detect bottles
    detection = detect_bottles(img)
    if detection is None:
        return PipelineResult(
            approved=False,
            reject_reason="no_bottles",
            reject_detail={"upscaled_factor": upscale_factor},
            auto_upscaled_factor=upscale_factor,
        )
    standard, test = detection

    # Step 3: auto-crop
    cropped, std_out, test_out = auto_crop(img, standard, test)

    # Step 4: quality checks
    quality = assess_quality(cropped)
    if quality.issues:
        return PipelineResult(
            approved=False,
            reject_reason=quality.issues[0],
            reject_detail={
                "all_issues": quality.issues,
                "brightness": round(quality.brightness, 1),
                "sharpness": round(quality.sharpness, 1),
                "width": quality.width,
                "height": quality.height,
            },
            auto_upscaled_factor=upscale_factor,
        )

    # Step 5: conservative auto-WB — opt-in only.
    wb_applied = False
    wb_scales = None
    ref: Optional[tuple[int, int, int]] = None
    if apply_auto_wb:
        ref = find_white_reference_outside_bottles(cropped, std_out, test_out)
        if ref is not None:
            cropped, wb_scales = apply_white_balance(cropped, ref)
            wb_applied = True

    return PipelineResult(
        approved=True,
        image=cropped,
        standard_bbox=std_out,
        test_bbox=test_out,
        wb_applied=wb_applied,
        wb_reference_rgb=ref,
        wb_scales=wb_scales,
        auto_upscaled_factor=upscale_factor,
    )
