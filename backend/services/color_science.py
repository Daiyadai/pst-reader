"""
Color science utilities for PST Image Reader.
Handles sRGB -> CIELAB conversion and delta calculations.
"""

import math


def linearize_srgb(c: float) -> float:
    """Convert sRGB gamma-encoded value (0-1) to linear RGB."""
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def srgb_to_xyz(r: int, g: int, b: int) -> tuple:
    """Convert sRGB (0-255) to CIE XYZ (D65 illuminant)."""
    rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
    rl, gl, bl = linearize_srgb(rn), linearize_srgb(gn), linearize_srgb(bn)

    # sRGB -> XYZ matrix (D65 reference white)
    x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
    y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
    z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041
    return x, y, z


def xyz_to_lab(x: float, y: float, z: float) -> tuple:
    """Convert CIE XYZ to CIELAB. D65 reference white."""
    # D65 reference white point
    xn, yn, zn = 0.95047, 1.00000, 1.08883

    def f(t: float) -> float:
        if t > 0.008856:
            return t ** (1.0 / 3.0)
        return 7.787 * t + 16.0 / 116.0

    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)

    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b = 200.0 * (fy - fz)
    return L, a, b


def srgb_to_lab(r: int, g: int, b: int) -> tuple:
    """Convert sRGB (0-255) to CIELAB."""
    x, y, z = srgb_to_xyz(r, g, b)
    return xyz_to_lab(x, y, z)


def delta_e76(lab1: tuple, lab2: tuple) -> float:
    """CIE76 Delta E (Euclidean distance in LAB space)."""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(lab1, lab2)))


def compute_deltas(
    before_lab: tuple,
    after_lab: tuple,
) -> dict:
    """Compute all color difference metrics between before and after."""
    delta_L = after_lab[0] - before_lab[0]
    delta_a = after_lab[1] - before_lab[1]
    delta_b = after_lab[2] - before_lab[2]
    delta_E = math.sqrt(delta_L**2 + delta_a**2 + delta_b**2)

    return {
        "delta_L": round(delta_L, 4),
        "delta_a": round(delta_a, 4),
        "delta_b": round(delta_b, 4),
        "delta_E": round(delta_E, 4),
    }
