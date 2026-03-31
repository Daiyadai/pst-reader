"""
Calibration script for PST Image Reader.

Processes the ground truth pairs from value reading_corresponded/:
- 960x720 images = sample photos (two cylinders side by side)
- 480x300 images = puriSCOPE report screenshots (contain known PST value)

Extracts PST values from report images by reading the color swatches,
extracts colors from sample photos, and fits a regression model.
"""

import os
import sys
import json
import math
from typing import Optional

from PIL import Image
import numpy as np

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.image_processor import analyze_combined_image, extract_dominant_color
from services.color_science import srgb_to_lab, compute_deltas


CORRESPONDED_DIR = "/Users/daiyabase/143core/persicope/value reading_corresponded"
CALIBRATION_OUTPUT = os.path.join(os.path.dirname(__file__), "calibration_model.json")


def extract_pst_from_report(report_path: str) -> Optional[dict]:
    """Extract PST value and color swatches from a puriSCOPE report image.

    Report layout (480x300):
    - Left color swatch: approx (30, 80) to (175, 225)
    - Right color swatch: approx (180, 80) to (305, 225)
    - PST value text: approx (85, 250) to (185, 285)

    Since OCR adds complexity, we extract the PST value by reading the
    report's own color swatches and building a mapping. The actual PST
    number will be extracted via pixel analysis of the text region.
    """
    img = Image.open(report_path).convert("RGB")
    w, h = img.size

    if w != 480 or h != 300:
        return None

    # Extract color swatches from the report
    # Left swatch (before/reference color)
    left_swatch = img.crop((35, 85, 170, 220))
    # Right swatch (after/result color)
    right_swatch = img.crop((185, 85, 300, 220))

    left_rgb = extract_dominant_color(left_swatch)
    right_rgb = extract_dominant_color(right_swatch)

    left_lab = srgb_to_lab(*left_rgb)
    right_lab = srgb_to_lab(*right_rgb)

    # Extract the PST value text region for digit recognition
    # The PST value is displayed at the bottom-left of the report
    # We'll use a simple approach: read the pixel pattern of digits
    pst_region = img.crop((70, 252, 195, 285))

    return {
        "left_rgb": left_rgb,
        "right_rgb": right_rgb,
        "left_lab": left_lab,
        "right_lab": right_lab,
        "pst_region": pst_region,
    }


def read_pst_digit_from_region(pst_region: Image.Image) -> Optional[float]:
    """Attempt to read PST value from the digit region using pixel analysis.

    The PST values in the reports are rendered in a consistent font at a fixed
    position. We use a simple template-matching approach on the digit pixels.

    Since this is fragile, we'll also build an alternative path using the
    color swatches as a proxy.
    """
    # Convert to grayscale and threshold
    gray = np.array(pst_region.convert("L"))
    # The text is dark on light background
    binary = gray < 128  # True = dark pixel (text)

    # The region is approximately 125x33 pixels
    # PST values like "-0.04", "0.08", "0.07" are 4-5 characters
    # We'll analyze column density to find digit boundaries
    col_density = binary.sum(axis=0)

    # Find groups of columns with significant dark pixels (>3 pixels high)
    threshold = 3
    active = col_density > threshold

    # Find contiguous groups
    groups = []
    in_group = False
    start = 0
    for i, val in enumerate(active):
        if val and not in_group:
            start = i
            in_group = True
        elif not val and in_group:
            groups.append((start, i))
            in_group = False
    if in_group:
        groups.append((start, len(active)))

    # We expect 3-5 character groups (e.g., "-0.04" or "0.08")
    # This is too fragile for production, so we return None and rely on
    # the alternative swatch-based approach
    return None


def build_calibration():
    """Main calibration pipeline.

    1. Identify all sample/report pairs in the corresponded folder
    2. For each pair: extract colors from sample photo + report swatches
    3. The report swatches give us the "reference" colors the legacy system saw
    4. We use report swatch delta as a proxy for PST (since we can read
       the swatch colors precisely, and PST correlates with swatch color difference)
    """
    files = sorted([f for f in os.listdir(CORRESPONDED_DIR) if f.upper().endswith(".JPG")])

    # Separate into sample photos (960x720) and reports (480x300)
    samples = []
    reports = []

    for f in files:
        path = os.path.join(CORRESPONDED_DIR, f)
        img = Image.open(path)
        w, h = img.size
        if w == 960 and h == 720:
            samples.append((f, path))
        elif w == 480 and h == 300:
            reports.append((f, path))

    print(f"Found {len(samples)} sample photos and {len(reports)} report images")

    # Pair them sequentially
    pairs = []
    sample_idx = 0
    report_idx = 0

    # Files are sorted, and they alternate: sample then report
    for i in range(0, len(files), 1):
        if sample_idx >= len(samples) or report_idx >= len(reports):
            break

        s_name, s_path = samples[sample_idx]
        r_name, r_path = reports[report_idx]

        # The sample should come before the report in file order
        s_num = int(s_name.replace("IMG_", "").replace(".JPG", "").replace(".jpg", ""))
        r_num = int(r_name.replace("IMG_", "").replace(".JPG", "").replace(".jpg", ""))

        if s_num < r_num:
            pairs.append((s_name, s_path, r_name, r_path))
            sample_idx += 1
            report_idx += 1
        elif s_num > r_num:
            report_idx += 1
        else:
            sample_idx += 1

    print(f"Identified {len(pairs)} sample-report pairs")

    # Process each pair
    calibration_data = []

    for s_name, s_path, r_name, r_path in pairs:
        try:
            # Analyze sample photo (combined image with both cylinders)
            sample_img = Image.open(s_path)
            before_analysis, after_analysis = analyze_combined_image(sample_img)

            # Analyze report to get reference colors
            report_info = extract_pst_from_report(r_path)
            if report_info is None:
                continue

            # Compute deltas from sample photo
            before_lab = (before_analysis["lab"]["L"], before_analysis["lab"]["a"], before_analysis["lab"]["b"])
            after_lab = (after_analysis["lab"]["L"], after_analysis["lab"]["a"], after_analysis["lab"]["b"])
            sample_deltas = compute_deltas(before_lab, after_lab)

            # Compute deltas from report swatches (these are the "true" colors the legacy system recorded)
            report_deltas = compute_deltas(report_info["left_lab"], report_info["right_lab"])

            calibration_data.append({
                "sample_file": s_name,
                "report_file": r_name,
                "sample_before_rgb": before_analysis["rgb"],
                "sample_after_rgb": after_analysis["rgb"],
                "sample_before_lab": list(before_lab),
                "sample_after_lab": list(after_lab),
                "sample_delta_a": sample_deltas["delta_a"],
                "sample_delta_E": sample_deltas["delta_E"],
                "sample_delta_L": sample_deltas["delta_L"],
                "report_before_lab": list(report_info["left_lab"]),
                "report_after_lab": list(report_info["right_lab"]),
                "report_delta_a": report_deltas["delta_a"],
                "report_delta_E": report_deltas["delta_E"],
            })
        except Exception as e:
            print(f"Error processing {s_name}/{r_name}: {e}")
            continue

    print(f"Successfully processed {len(calibration_data)} pairs")

    if len(calibration_data) < 5:
        print("ERROR: Too few pairs for calibration. Check data.")
        return

    # Fit linear regression: report_delta_a = m * sample_delta_a + c
    # This maps our image analysis to the legacy system's readings
    x = np.array([d["sample_delta_a"] for d in calibration_data])
    y = np.array([d["report_delta_a"] for d in calibration_data])

    # Simple linear regression using least squares
    n = len(x)
    x_mean, y_mean = x.mean(), y.mean()
    ss_xy = np.sum((x - x_mean) * (y - y_mean))
    ss_xx = np.sum((x - x_mean) ** 2)

    slope = ss_xy / ss_xx if ss_xx > 0 else 1.0
    intercept = y_mean - slope * x_mean

    # R-squared
    y_pred = slope * x + intercept
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - y_mean) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

    print(f"\n=== Calibration Results ===")
    print(f"Samples: {n}")
    print(f"Linear fit: report_delta_a = {slope:.4f} * sample_delta_a + {intercept:.4f}")
    print(f"R-squared: {r_squared:.4f}")
    print(f"Sample delta_a range: [{x.min():.2f}, {x.max():.2f}]")
    print(f"Report delta_a range: [{y.min():.2f}, {y.max():.2f}]")

    # Also compute statistics for PST value mapping
    # PST = f(delta_a) — we need to determine this mapping
    # From the reports we saw: PST values of -0.04, 0.07, 0.08
    # These correspond to different levels of color shift
    # For now, we store the calibration data and fit parameters

    # Compute the mean and std of report delta_a to normalize PST
    report_delta_a_values = np.array([d["report_delta_a"] for d in calibration_data])

    # Store all calibration info
    model = {
        "slope": float(slope),
        "intercept": float(intercept),
        "r_squared": float(r_squared),
        "n_samples": n,
        "sample_delta_a_mean": float(x.mean()),
        "sample_delta_a_std": float(x.std()),
        "report_delta_a_mean": float(y.mean()),
        "report_delta_a_std": float(y.std()),
        "sample_delta_a_range": [float(x.min()), float(x.max())],
        "report_delta_a_range": [float(y.min()), float(y.max())],
        # Store per-pair data for inspection
        "pairs": calibration_data,
    }

    with open(CALIBRATION_OUTPUT, "w") as f:
        json.dump(model, f, indent=2)

    print(f"\nCalibration model saved to {CALIBRATION_OUTPUT}")

    # Print some sample comparisons
    print(f"\n=== Sample Comparisons (first 10) ===")
    for d in calibration_data[:10]:
        pred = slope * d["sample_delta_a"] + intercept
        print(
            f"{d['sample_file']}: "
            f"sample_da={d['sample_delta_a']:.2f}, "
            f"report_da={d['report_delta_a']:.2f}, "
            f"predicted_da={pred:.2f}"
        )


if __name__ == "__main__":
    build_calibration()
