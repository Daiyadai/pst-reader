"""
Image processing for PST Image Reader.
Handles ROI detection and dominant color extraction from sample images.
"""

from PIL import Image
import numpy as np
from .color_science import srgb_to_lab


def extract_liquid_roi(image: Image.Image, margin_x: float = 0.30, margin_y: float = 0.20) -> Image.Image:
    """Extract the liquid region from a single cylinder image.

    Crops the center of the image to avoid graduated markings on edges
    and measurement text at top/bottom.

    Args:
        image: PIL Image of a single graduated cylinder
        margin_x: fraction to crop from each side (default 30%)
        margin_y: fraction to crop from top and bottom (default 20%)

    Returns:
        Cropped PIL Image of the liquid region
    """
    w, h = image.size
    left = int(w * margin_x)
    right = int(w * (1 - margin_x))
    top = int(h * margin_y)
    bottom = int(h * (1 - margin_y))
    return image.crop((left, top, right, bottom))


def extract_liquid_roi_from_combined(image: Image.Image) -> tuple:
    """Extract before (left) and after (right) liquid regions from a combined two-cylinder image.

    Used for processing legacy data where both cylinders are in a single photo.

    Returns:
        Tuple of (before_roi, after_roi) as PIL Images
    """
    w, h = image.size
    mid = w // 2

    left_half = image.crop((0, 0, mid, h))
    right_half = image.crop((mid, 0, w, h))

    before_roi = extract_liquid_roi(left_half)
    after_roi = extract_liquid_roi(right_half)
    return before_roi, after_roi


def extract_dominant_color(roi: Image.Image) -> tuple:
    """Extract the dominant liquid color from an ROI image.

    Filters out dark pixels (text/markings) and bright pixels (reflections),
    then uses the median of remaining pixels for robustness.

    Returns:
        (R, G, B) median color tuple
    """
    rgb = roi.convert("RGB")
    pixels = np.array(rgb)  # shape: (H, W, 3)
    flat = pixels.reshape(-1, 3)

    # Filter out very dark (text/markings) and very bright (reflections) pixels
    mask = (
        (flat[:, 0] > 60) & (flat[:, 0] < 240) &
        (flat[:, 1] > 60) & (flat[:, 1] < 240) &
        (flat[:, 2] > 60) & (flat[:, 2] < 240)
    )
    filtered = flat[mask]

    if len(filtered) < 100:
        # Fallback: use all pixels if too many were filtered
        filtered = flat

    r = int(np.median(filtered[:, 0]))
    g = int(np.median(filtered[:, 1]))
    b = int(np.median(filtered[:, 2]))
    return r, g, b


def analyze_image(image: Image.Image) -> dict:
    """Full analysis pipeline for a single image.

    Returns dict with RGB, LAB values and the ROI used.
    """
    roi = extract_liquid_roi(image)
    rgb = extract_dominant_color(roi)
    lab = srgb_to_lab(*rgb)

    return {
        "rgb": rgb,
        "lab": {"L": round(lab[0], 2), "a": round(lab[1], 2), "b": round(lab[2], 2)},
        "roi_size": roi.size,
    }


def analyze_combined_image(image: Image.Image) -> tuple:
    """Analyze a combined two-cylinder image (legacy format).

    Returns (before_analysis, after_analysis) dicts.
    """
    before_roi, after_roi = extract_liquid_roi_from_combined(image)

    before_rgb = extract_dominant_color(before_roi)
    after_rgb = extract_dominant_color(after_roi)

    before_lab = srgb_to_lab(*before_rgb)
    after_lab = srgb_to_lab(*after_rgb)

    before = {
        "rgb": before_rgb,
        "lab": {"L": round(before_lab[0], 2), "a": round(before_lab[1], 2), "b": round(before_lab[2], 2)},
    }
    after = {
        "rgb": after_rgb,
        "lab": {"L": round(after_lab[0], 2), "a": round(after_lab[1], 2), "b": round(after_lab[2], 2)},
    }
    return before, after
