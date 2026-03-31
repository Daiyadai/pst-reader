"""
White balance normalization for images taken outside standardized light box conditions.

Allows users to select a reference white point in the image to normalize
color temperature before PST analysis.
"""

from PIL import Image
import numpy as np


def apply_white_balance(image, ref_x, ref_y, ref_size=20):
    """Apply white balance correction based on a user-selected reference point.

    The user clicks on a known-white area (e.g., the white markings on the
    graduated cylinder). The pixel color at that point is used to compute
    a correction factor that normalizes the image's white point.

    Args:
        image: PIL Image (RGB)
        ref_x: X coordinate of the white reference point
        ref_y: Y coordinate of the white reference point
        ref_size: Size of the sampling area around the reference point

    Returns:
        White-balanced PIL Image
    """
    img_array = np.array(image, dtype=np.float64)
    h, w = img_array.shape[:2]

    # Sample a region around the reference point
    x1 = max(0, ref_x - ref_size // 2)
    x2 = min(w, ref_x + ref_size // 2)
    y1 = max(0, ref_y - ref_size // 2)
    y2 = min(h, ref_y + ref_size // 2)

    ref_region = img_array[y1:y2, x1:x2]
    ref_color = ref_region.mean(axis=(0, 1))  # Mean RGB of reference area

    # The reference area should be white (255, 255, 255)
    # Compute per-channel scaling factors
    # Avoid division by zero
    scale = np.array([255.0, 255.0, 255.0])
    for i in range(3):
        if ref_color[i] > 10:  # Only correct if reference has meaningful value
            scale[i] = 255.0 / ref_color[i]
        else:
            scale[i] = 1.0

    # Limit scaling to prevent extreme corrections
    scale = np.clip(scale, 0.5, 2.0)

    # Apply correction
    corrected = img_array * scale[np.newaxis, np.newaxis, :]
    corrected = np.clip(corrected, 0, 255).astype(np.uint8)

    return Image.fromarray(corrected)


def auto_white_balance(image):
    """Apply automatic white balance using the gray world assumption.

    Assumes that the average color of the scene should be neutral gray.
    This is a simple but effective method for most cleaning test images.

    Args:
        image: PIL Image (RGB)

    Returns:
        White-balanced PIL Image
    """
    img_array = np.array(image, dtype=np.float64)

    # Gray world: scale each channel so its mean equals the overall mean
    avg_r = img_array[:, :, 0].mean()
    avg_g = img_array[:, :, 1].mean()
    avg_b = img_array[:, :, 2].mean()
    avg_gray = (avg_r + avg_g + avg_b) / 3.0

    if avg_gray < 10:
        return image  # Image is too dark, skip

    scale_r = avg_gray / avg_r if avg_r > 10 else 1.0
    scale_g = avg_gray / avg_g if avg_g > 10 else 1.0
    scale_b = avg_gray / avg_b if avg_b > 10 else 1.0

    # Limit corrections
    scale_r = max(0.5, min(2.0, scale_r))
    scale_g = max(0.5, min(2.0, scale_g))
    scale_b = max(0.5, min(2.0, scale_b))

    corrected = img_array.copy()
    corrected[:, :, 0] *= scale_r
    corrected[:, :, 1] *= scale_g
    corrected[:, :, 2] *= scale_b
    corrected = np.clip(corrected, 0, 255).astype(np.uint8)

    return Image.fromarray(corrected)
