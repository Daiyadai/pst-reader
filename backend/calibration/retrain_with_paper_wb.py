"""
Retrain the PST regression model on paper-WB-corrected features.

Why this exists:
  Field reports from Yili (Hefei + Xi'an) showed iPod-via-web underreading by
  ~50% versus the puriSCOPE baseline. Diagnosis pointed to lighting-domain
  shift between training facility and field facility. Paper-anchored white
  balance (in services/white_balance.py) corrects this WITHOUT damaging the
  saturated purple PST signal — but applying it only at inference would
  break calibration, since the existing model was fit on un-WB features.

  This script applies paper WB to *all* training images, recomputes features,
  refits the hybrid poly+KNN model, and saves alongside a backup of the
  current model. Once validated, the API default switches to white_balance="paper".

Inputs:
  - Original 101 sample images: value reading_corresponded/<IMG_xxxx.JPG>
  - 28 new high-PST samples:    value reading_corresponded 02/<n>.JPG
  - PST labels for original 101: reconstructed from current model JSON
  - PST labels for new 28:       NEW_PST_VALUES dict (copied from retrain_with_new_data.py)
  - File pairing for original 101: backend/calibration/calibration_model.json

Outputs:
  - calibration/pst_regression_model.json                              (overwritten)
  - calibration/pst_regression_model_backup_pre_paper_wb.json          (backup)
"""

import os
import sys
import json
import shutil
from datetime import datetime

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.image_processor import analyze_combined_image  # noqa: E402
from services.color_science import compute_deltas              # noqa: E402
from services.white_balance import paper_anchored_white_balance  # noqa: E402

# Paths
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BACKEND_DIR, "calibration", "pst_regression_model.json")
CALIBRATION_PATH = os.path.join(BACKEND_DIR, "calibration", "calibration_model.json")
BACKUP_PATH = os.path.join(BACKEND_DIR, "calibration", "pst_regression_model_backup_pre_paper_wb.json")

ORIGINAL_DIR = "/Users/daiyabase/143core/testing projects/persicope/value reading_corresponded"
NEW_DIR = "/Users/daiyabase/143core/testing projects/persicope/value reading_corresponded 02"

# Ground truth PST values for the 28 new samples (sample_number -> pst).
# Copied verbatim from retrain_with_new_data.py.
NEW_PST_VALUES = {
    1: 1.06, 3: 0.99, 5: 0.93, 7: 0.88, 9: 0.72, 11: 0.65, 13: 0.60,
    15: 0.57, 17: 0.49, 19: 0.35, 21: 0.34, 23: 0.32, 25: 0.30, 27: 0.27,
    29: 0.25, 31: 0.22, 33: 0.18, 35: 0.14, 37: 0.11, 39: 0.10, 41: 0.09,
    43: 0.08, 45: 0.07, 47: 0.06, 49: 0.06, 51: 0.05, 53: 0.04, 55: 0.01,
}


def reconstruct_pst_from_model(model: dict) -> list[float]:
    """Recover PST labels for each training sample from the existing model JSON.

    For each row i: pst[i] = poly(features[i]) + residual[i].
    """
    coeffs = model["poly_coefficients"]
    features = np.array(model["knn_reference_features"])
    residuals = np.array(model["knn_reference_residuals"])

    psts = []
    for i in range(len(features)):
        da, dE, dL, before_a, after_a = features[i]
        poly = [1.0, da, dE, dL, before_a, after_a, dE**2, da**2, da * before_a, dE * before_a]
        poly_pred = sum(c * x for c, x in zip(coeffs, poly))
        psts.append(round(float(poly_pred + residuals[i]), 4))
    return psts


def extract_features_with_paper_wb(image_path: str) -> list[float] | None:
    """Apply paper WB to a sample image, then extract the 5 LAB-derived features."""
    try:
        img = Image.open(image_path).convert("RGB")
        img = paper_anchored_white_balance(img)
        before, after = analyze_combined_image(img)
        before_lab = (before["lab"]["L"], before["lab"]["a"], before["lab"]["b"])
        after_lab = (after["lab"]["L"], after["lab"]["a"], after["lab"]["b"])
        deltas = compute_deltas(before_lab, after_lab)
        return [
            deltas["delta_a"],
            deltas["delta_E"],
            deltas["delta_L"],
            before_lab[1],   # before_a
            after_lab[1],    # after_a
        ]
    except Exception as e:
        print(f"   FAILED ({os.path.basename(image_path)}): {e}")
        return None


def fit_hybrid_poly_knn(features: list[list[float]], pst_values: list[float], knn_k: int = 7) -> dict:
    """Same hybrid polynomial + KNN fit used by the original training script."""
    n = len(features)
    X = np.array(features)
    y = np.array(pst_values)

    poly_X = np.column_stack([
        np.ones(n),
        X[:, 0], X[:, 1], X[:, 2], X[:, 3], X[:, 4],
        X[:, 1] ** 2, X[:, 0] ** 2,
        X[:, 0] * X[:, 3], X[:, 1] * X[:, 3],
    ])

    coeffs, *_ = np.linalg.lstsq(poly_X, y, rcond=None)
    poly_pred = poly_X @ coeffs
    poly_residuals = y - poly_pred

    ss_res = np.sum((y - poly_pred) ** 2)
    ss_tot = np.sum((y - y.mean()) ** 2)
    poly_r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0

    feat_mean = X.mean(axis=0)
    feat_std = X.std(axis=0)
    feat_std[feat_std == 0] = 1.0

    # Leave-one-out cross-validation
    loo_errors = []
    for i in range(n):
        mask = np.ones(n, dtype=bool)
        mask[i] = False
        loo_coeffs, *_ = np.linalg.lstsq(poly_X[mask], y[mask], rcond=None)
        loo_residuals = y[mask] - poly_X[mask] @ loo_coeffs
        pred_i = poly_X[i] @ loo_coeffs

        loo_X = X[mask]
        loo_mean = loo_X.mean(axis=0)
        loo_std = loo_X.std(axis=0)
        loo_std[loo_std == 0] = 1.0
        query_norm = (X[i] - loo_mean) / loo_std
        ref_norm = (loo_X - loo_mean) / loo_std
        dists = np.sqrt(np.sum((ref_norm - query_norm) ** 2, axis=1))
        nearest = np.argsort(dists)[:knn_k]
        weights = 1.0 / (dists[nearest] + 1e-8)
        weights /= weights.sum()
        correction = np.sum(weights * loo_residuals[nearest])

        loo_errors.append(abs(y[i] - (pred_i + correction)))

    return {
        "model_type": "hybrid_poly_knn",
        "poly_coefficients": coeffs.tolist(),
        "poly_feature_names": [
            "intercept", "delta_a", "delta_E", "delta_L",
            "before_a", "after_a", "delta_E^2", "delta_a^2",
            "delta_a*before_a", "delta_E*before_a",
        ],
        "knn_k": knn_k,
        "knn_features_mean": feat_mean.tolist(),
        "knn_features_std": feat_std.tolist(),
        "knn_reference_features": X.tolist(),
        "knn_reference_residuals": poly_residuals.tolist(),
        "feature_names": ["delta_a", "delta_E", "delta_L", "before_a", "after_a"],
        "r_squared": float(poly_r2),
        "n_samples": n,
        "pst_range": [float(y.min()), float(y.max())],
        "loo_cv_mae": float(np.mean(loo_errors)),
        "loo_cv_max_error": float(np.max(loo_errors)),
        "trained_at": datetime.now().isoformat(),
        "preprocessing": "paper_anchored_white_balance",
    }


def main():
    print("=" * 64)
    print("PST Model Retrain — Paper-WB Features")
    print("=" * 64)

    # ---- 1. Load existing model + calibration metadata ----
    with open(MODEL_PATH) as f:
        old_model = json.load(f)
    with open(CALIBRATION_PATH) as f:
        cal = json.load(f)
    pairs = cal["pairs"]
    print(f"  current model: n_samples={old_model['n_samples']}, "
          f"R^2={old_model['r_squared']:.4f}, LOO MAE={old_model.get('loo_cv_mae', 'n/a')}")
    print(f"  calibration_model.json has {len(pairs)} pairs")

    # ---- 2. Reconstruct PST labels for the existing rows ----
    old_psts = reconstruct_pst_from_model(old_model)
    if len(old_psts) != len(pairs):
        # The first 101 rows of the model should correspond to original pairs;
        # rows 101..128 to the new batch, but new batch may also be in pairs[]
        # via Step 7 of retrain_with_new_data.py. Print sizes for diagnostic.
        print(f"  WARN: model rows ({len(old_psts)}) != pair count ({len(pairs)})")

    # ---- 3. Process each pair: apply paper WB, extract new features ----
    all_features: list[list[float]] = []
    all_pst: list[float] = []
    sources: list[str] = []
    skipped = 0

    for i, pair in enumerate(pairs):
        sample_file = pair["sample_file"]
        # Decide which folder based on file naming convention
        # original: "IMG_xxxx.JPG", new: "<n>.JPG"
        if sample_file.upper().startswith("IMG_"):
            sample_path = os.path.join(ORIGINAL_DIR, sample_file)
            source = "original"
        else:
            sample_path = os.path.join(NEW_DIR, sample_file)
            source = "new_batch_02"

        if not os.path.exists(sample_path):
            print(f"   SKIP {sample_file}: file not found at {sample_path}")
            skipped += 1
            continue

        # PST label
        if "pst_value" in pair:
            pst = float(pair["pst_value"])
        elif i < len(old_psts):
            pst = old_psts[i]
        else:
            print(f"   SKIP {sample_file}: no PST label available")
            skipped += 1
            continue

        feats = extract_features_with_paper_wb(sample_path)
        if feats is None:
            skipped += 1
            continue
        all_features.append(feats)
        all_pst.append(pst)
        sources.append(source)

        if (i + 1) % 25 == 0:
            print(f"   processed {i+1}/{len(pairs)}...")

    print(f"\n  processed: {len(all_features)} (skipped {skipped})")
    n_orig = sum(1 for s in sources if s == "original")
    n_new = sum(1 for s in sources if s == "new_batch_02")
    print(f"  composition: original={n_orig}, new_batch_02={n_new}")
    if not all_features:
        print("  ERROR: no samples processed; aborting")
        return 1

    # ---- 4. Backup the existing model ----
    if os.path.exists(MODEL_PATH) and not os.path.exists(BACKUP_PATH):
        shutil.copy2(MODEL_PATH, BACKUP_PATH)
        print(f"  backed up old model -> {os.path.basename(BACKUP_PATH)}")
    elif os.path.exists(BACKUP_PATH):
        print(f"  backup exists, leaving as-is: {os.path.basename(BACKUP_PATH)}")

    # ---- 5. Fit new model ----
    print("\n  fitting hybrid poly + KNN on paper-WB features...")
    new_model = fit_hybrid_poly_knn(all_features, all_pst, knn_k=7)
    new_model["data_sources"] = {"original": n_orig, "new_batch_02": n_new}

    # ---- 6. Save ----
    with open(MODEL_PATH, "w") as f:
        json.dump(new_model, f, indent=2)
    print(f"  wrote -> {os.path.basename(MODEL_PATH)}")

    # ---- 7. Compare ----
    print("\n" + "=" * 64)
    print("Old vs New (paper-WB)")
    print("=" * 64)
    print(f"  {'metric':<22} {'old':>14} {'new':>14}")
    print(f"  {'-'*22} {'-'*14} {'-'*14}")
    print(f"  {'samples':<22} {old_model['n_samples']:>14} {new_model['n_samples']:>14}")
    print(f"  {'polynomial R^2':<22} {old_model['r_squared']:>14.5f} {new_model['r_squared']:>14.5f}")
    print(f"  {'LOO CV MAE':<22} {old_model.get('loo_cv_mae', 0):>14.5f} {new_model['loo_cv_mae']:>14.5f}")
    print(f"  {'LOO CV max err':<22} {old_model.get('loo_cv_max_error', 0):>14.5f} {new_model['loo_cv_max_error']:>14.5f}")
    print(f"  {'PST range min':<22} {old_model['pst_range'][0]:>14.3f} {new_model['pst_range'][0]:>14.3f}")
    print(f"  {'PST range max':<22} {old_model['pst_range'][1]:>14.3f} {new_model['pst_range'][1]:>14.3f}")

    print("\nDone.")
    print("Set white_balance='paper' as default in routers/analyze.py to deploy.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
