"""
PST value calculator for PST Image Reader.

Uses a hybrid polynomial regression + KNN correction model
fitted against all 101 ground truth legacy reports.
"""

import json
import os
import numpy as np

from .color_science import compute_deltas

CALIBRATION_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "calibration",
    "calibration_model.json",
)

THRESHOLD_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "calibration",
    "thresholds.json",
)

DEFAULT_THRESHOLDS = [
    {"max": 0.00, "label": "Not Clean", "color_class": "red", "is_clean": False},
    {"max": 0.03, "label": "Minimal", "color_class": "orange", "is_clean": False},
    {"max": 0.06, "label": "Fair", "color_class": "yellow", "is_clean": True},
    {"max": 0.10, "label": "Good", "color_class": "green", "is_clean": True},
    {"max": 999, "label": "Excellent", "color_class": "emerald", "is_clean": True},
]


class PSTCalculator:
    """Calculates PST values using hybrid polynomial + KNN model."""

    def __init__(self):
        self.thresholds = self._load_thresholds()
        self._load_model()

    def _load_thresholds(self):
        if os.path.exists(THRESHOLD_PATH):
            with open(THRESHOLD_PATH) as f:
                return json.load(f)
        return DEFAULT_THRESHOLDS

    def save_thresholds(self, thresholds):
        self.thresholds = thresholds
        with open(THRESHOLD_PATH, "w") as f:
            json.dump(thresholds, f, indent=2)

    def _load_model(self):
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "calibration",
            "pst_regression_model.json",
        )

        with open(model_path) as f:
            data = json.load(f)

        self.model_type = data.get("model_type", "linear")
        self.r_squared = data.get("r_squared", 0)
        self.n_samples = data.get("n_samples", 0)

        if self.model_type == "hybrid_poly_knn":
            self.poly_coefficients = data["poly_coefficients"]
            self.knn_k = data["knn_k"]
            self.knn_mean = np.array(data["knn_features_mean"])
            self.knn_std = np.array(data["knn_features_std"])
            self.knn_ref_features = np.array(data["knn_reference_features"])
            self.knn_ref_residuals = np.array(data["knn_reference_residuals"])
            # Normalize reference features
            self.knn_ref_norm = (self.knn_ref_features - self.knn_mean) / self.knn_std
        else:
            # Fallback to simple linear model
            self.coefficients = data.get("coefficients", [0.1])

    def _predict_pst(self, features):
        """Predict PST value from 5 base features."""
        da, dE, dL, before_a, after_a = features

        if self.model_type == "hybrid_poly_knn":
            # Step 1: Polynomial prediction
            poly_features = [
                1.0, da, dE, dL, before_a, after_a,
                dE**2, da**2, da * before_a, dE * before_a,
            ]
            poly_pred = sum(c * x for c, x in zip(self.poly_coefficients, poly_features))

            # Step 2: KNN correction on polynomial residuals
            query = np.array(features)
            query_norm = (query - self.knn_mean) / self.knn_std
            dists = np.sqrt(np.sum((self.knn_ref_norm - query_norm) ** 2, axis=1))
            nearest = np.argsort(dists)[:self.knn_k]
            weights = 1.0 / (dists[nearest] + 1e-8)
            weights /= weights.sum()
            correction = np.sum(weights * self.knn_ref_residuals[nearest])

            return poly_pred + correction
        else:
            x = [1.0] + list(features)
            return sum(c * xi for c, xi in zip(self.coefficients, x))

    def calculate_pst(self, before_lab, after_lab):
        """Calculate PST value from before/after LAB colors."""
        deltas = compute_deltas(before_lab, after_lab)

        features = [
            deltas["delta_a"],
            deltas["delta_E"],
            deltas["delta_L"],
            before_lab[1],
            after_lab[1],
        ]

        pst_value = round(self._predict_pst(features), 2)
        result = self._interpret_pst(pst_value)

        return {
            "pst_value": pst_value,
            "is_clean": result["is_clean"],
            "label": result["label"],
            "color_class": result["color_class"],
            "before_lab": {"L": round(before_lab[0], 2), "a": round(before_lab[1], 2), "b": round(before_lab[2], 2)},
            "after_lab": {"L": round(after_lab[0], 2), "a": round(after_lab[1], 2), "b": round(after_lab[2], 2)},
            "deltas": deltas,
        }

    def _interpret_pst(self, pst_value):
        for t in self.thresholds:
            if pst_value < t["max"]:
                return {"label": t["label"], "color_class": t["color_class"], "is_clean": t["is_clean"]}
        last = self.thresholds[-1]
        return {"label": last["label"], "color_class": last["color_class"], "is_clean": last["is_clean"]}


_calculator = None


def get_calculator():
    global _calculator
    if _calculator is None:
        _calculator = PSTCalculator()
    return _calculator
