"""Analysis endpoint — the core of PST Image Reader."""

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from PIL import Image
import io

from ..services.image_processor import analyze_image, analyze_combined_image
from ..services.color_science import srgb_to_lab, compute_deltas
from ..services.pst_calculator import get_calculator
from ..services.white_balance import (
    apply_white_balance,
    auto_white_balance,
    paper_anchored_white_balance,
)
from ..services.image_pipeline import run_pipeline
from ..database import get_db

router = APIRouter(prefix="/api", tags=["analysis"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_upload(upload_file: UploadFile, prefix: str) -> str:
    """Save uploaded file and return the filename."""
    ext = os.path.splitext(upload_file.filename or "image.jpg")[1] or ".jpg"
    filename = f"{prefix}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(upload_file.file.read())
    return filename


@router.post("/analyze")
async def analyze(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...),
    user_id: int = Form(default=1),
    location: str = Form(default=""),
    notes: str = Form(default=""),
    white_balance: str = Form(default="none"),
    wb_ref_x: int = Form(default=0),
    wb_ref_y: int = Form(default=0),
):
    """Analyze before/after images and return PST result.

    white_balance options:
      "none"   - no correction (default; matches model's training calibration)
      "paper"  - paper-anchored (opt-in; needs model retraining to use safely)
      "auto"   - legacy gray-world (DESTROYS purple signal — kept for back-compat)
      "manual" - use wb_ref_x/wb_ref_y as a click-selected white point
    """
    try:
        before_bytes = await before_image.read()
        after_bytes = await after_image.read()

        before_img = Image.open(io.BytesIO(before_bytes)).convert("RGB")
        after_img = Image.open(io.BytesIO(after_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    # Apply white balance if requested
    if white_balance == "paper":
        before_img = paper_anchored_white_balance(before_img)
        after_img = paper_anchored_white_balance(after_img)
    elif white_balance == "auto":
        before_img = auto_white_balance(before_img)
        after_img = auto_white_balance(after_img)
    elif white_balance == "manual" and wb_ref_x > 0 and wb_ref_y > 0:
        before_img = apply_white_balance(before_img, wb_ref_x, wb_ref_y)
        after_img = apply_white_balance(after_img, wb_ref_x, wb_ref_y)

    # Analyze both images
    before_analysis = analyze_image(before_img)
    after_analysis = analyze_image(after_img)

    before_lab = (
        before_analysis["lab"]["L"],
        before_analysis["lab"]["a"],
        before_analysis["lab"]["b"],
    )
    after_lab = (
        after_analysis["lab"]["L"],
        after_analysis["lab"]["a"],
        after_analysis["lab"]["b"],
    )

    # Calculate PST
    calculator = get_calculator()
    result = calculator.calculate_pst(before_lab, after_lab)

    # Save images
    before_image.file.seek(0)
    after_image.file.seek(0)

    # Write raw bytes directly since we already read them
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    before_filename = f"before_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
    after_filename = f"after_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"

    with open(os.path.join(UPLOAD_DIR, before_filename), "wb") as f:
        f.write(before_bytes)
    with open(os.path.join(UPLOAD_DIR, after_filename), "wb") as f:
        f.write(after_bytes)

    # Store in database
    db = get_db()
    cursor = db.execute(
        """INSERT INTO tests (
            user_id, before_image_path, after_image_path,
            before_rgb_r, before_rgb_g, before_rgb_b,
            after_rgb_r, after_rgb_g, after_rgb_b,
            before_lab_l, before_lab_a, before_lab_b,
            after_lab_l, after_lab_a, after_lab_b,
            delta_a, delta_e, delta_l,
            pst_value, is_clean, label,
            location, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id, before_filename, after_filename,
            before_analysis["rgb"][0], before_analysis["rgb"][1], before_analysis["rgb"][2],
            after_analysis["rgb"][0], after_analysis["rgb"][1], after_analysis["rgb"][2],
            before_lab[0], before_lab[1], before_lab[2],
            after_lab[0], after_lab[1], after_lab[2],
            result["deltas"]["delta_a"], result["deltas"]["delta_E"], result["deltas"]["delta_L"],
            result["pst_value"], result["is_clean"], result["label"],
            location or None, notes or None,
        ),
    )
    db.commit()
    test_id = cursor.lastrowid
    db.close()

    return {
        "test_id": test_id,
        "pst_value": result["pst_value"],
        "is_clean": result["is_clean"],
        "label": result["label"],
        "color_class": result["color_class"],
        "before_rgb": list(before_analysis["rgb"]),
        "after_rgb": list(after_analysis["rgb"]),
        "before_lab": result["before_lab"],
        "after_lab": result["after_lab"],
        "deltas": result["deltas"],
        "before_image_url": f"/uploads/{before_filename}",
        "after_image_url": f"/uploads/{after_filename}",
        "location": location or None,
        "notes": notes or None,
        "created_at": datetime.now().isoformat(),
    }


@router.post("/analyze-combined")
async def analyze_combined(
    image: UploadFile = File(...),
    user_id: int = Form(default=1),
    location: str = Form(default=""),
    notes: str = Form(default=""),
    white_balance: str = Form(default="none"),
):
    """Analyze a single combined image (before on left, after on right).

    The image is automatically split down the middle into before/after halves.
    Default white_balance is "none" — matches the model's training calibration.
    "paper" mode (paper-anchored WB) is implemented but requires the model
    to be retrained on paper-WB-applied features before defaulting on.
    """
    try:
        image_bytes = await image.read()
        combined_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    # Split into left (before) and right (after) halves
    w, h = combined_img.size
    before_img = combined_img.crop((0, 0, w // 2, h))
    after_img = combined_img.crop((w // 2, 0, w, h))

    if white_balance == "paper":
        before_img = paper_anchored_white_balance(before_img)
        after_img = paper_anchored_white_balance(after_img)
    elif white_balance == "auto":
        before_img = auto_white_balance(before_img)
        after_img = auto_white_balance(after_img)

    before_analysis = analyze_image(before_img)
    after_analysis = analyze_image(after_img)

    before_lab = (
        before_analysis["lab"]["L"],
        before_analysis["lab"]["a"],
        before_analysis["lab"]["b"],
    )
    after_lab = (
        after_analysis["lab"]["L"],
        after_analysis["lab"]["a"],
        after_analysis["lab"]["b"],
    )

    calculator = get_calculator()
    result = calculator.calculate_pst(before_lab, after_lab)

    # Save the two halves as separate images
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    before_filename = f"before_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
    after_filename = f"after_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"

    before_img.save(os.path.join(UPLOAD_DIR, before_filename), "JPEG", quality=90)
    after_img.save(os.path.join(UPLOAD_DIR, after_filename), "JPEG", quality=90)

    db = get_db()
    cursor = db.execute(
        """INSERT INTO tests (
            user_id, before_image_path, after_image_path,
            before_rgb_r, before_rgb_g, before_rgb_b,
            after_rgb_r, after_rgb_g, after_rgb_b,
            before_lab_l, before_lab_a, before_lab_b,
            after_lab_l, after_lab_a, after_lab_b,
            delta_a, delta_e, delta_l,
            pst_value, is_clean, label,
            location, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id, before_filename, after_filename,
            before_analysis["rgb"][0], before_analysis["rgb"][1], before_analysis["rgb"][2],
            after_analysis["rgb"][0], after_analysis["rgb"][1], after_analysis["rgb"][2],
            before_lab[0], before_lab[1], before_lab[2],
            after_lab[0], after_lab[1], after_lab[2],
            result["deltas"]["delta_a"], result["deltas"]["delta_E"], result["deltas"]["delta_L"],
            result["pst_value"], result["is_clean"], result["label"],
            location or None, notes or None,
        ),
    )
    db.commit()
    test_id = cursor.lastrowid
    db.close()

    return {
        "test_id": test_id,
        "pst_value": result["pst_value"],
        "is_clean": result["is_clean"],
        "label": result["label"],
        "color_class": result["color_class"],
        "before_rgb": list(before_analysis["rgb"]),
        "after_rgb": list(after_analysis["rgb"]),
        "before_lab": result["before_lab"],
        "after_lab": result["after_lab"],
        "deltas": result["deltas"],
        "before_image_url": f"/uploads/{before_filename}",
        "after_image_url": f"/uploads/{after_filename}",
        "location": location or None,
        "notes": notes or None,
        "created_at": datetime.now().isoformat(),
    }


@router.post("/validate-and-prepare")
async def validate_and_prepare(
    image: UploadFile = File(...),
    user_id: int = Form(default=1),
    location: str = Form(default=""),
    notes: str = Form(default=""),
    apply_auto_wb: bool = Form(default=False),
):
    """Run the full Lightroom-style pre-processing pipeline.

    1. Upscale if needed
    2. Detect the two bottles
    3. Auto-crop to canonical 4:3 around them
    4. Run quality checks (brightness, sharpness, dimensions)
    5. (Optional, off by default) conservatively auto-white-balance using a
       clean neutral reference OUTSIDE the bottle regions. Disabled by default
       because real-field testing on Hefei 利乐冠 3次 showed it over-corrects
       (PST 0.26 vs puriSCOPE truth 0.18). Can be re-enabled per-request.
    6. If approved, run analysis on the prepared image and return PST.
       If rejected, return reason + detail for retake guidance.
    """
    try:
        raw = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read upload: {e}")

    result = run_pipeline(raw, apply_auto_wb=apply_auto_wb)

    if not result.approved:
        return {
            "approved": False,
            "reject_reason": result.reject_reason,
            "reject_detail": result.reject_detail,
            "auto_upscaled_factor": result.auto_upscaled_factor,
        }

    # Save the prepared image and run analysis through the existing pipeline
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    prepared_filename = f"prepared_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
    prepared_path = os.path.join(UPLOAD_DIR, prepared_filename)
    result.image.save(prepared_path, "JPEG", quality=92)

    # Analyze the prepared image
    before, after = analyze_combined_image(result.image)
    before_lab = (before["lab"]["L"], before["lab"]["a"], before["lab"]["b"])
    after_lab = (after["lab"]["L"], after["lab"]["a"], after["lab"]["b"])
    calculator = get_calculator()
    pst_result = calculator.calculate_pst(before_lab, after_lab)

    # Save half-images for the result page
    w, h = result.image.size
    before_img = result.image.crop((0, 0, w // 2, h))
    after_img = result.image.crop((w // 2, 0, w, h))
    before_filename = f"before_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
    after_filename = f"after_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
    before_img.save(os.path.join(UPLOAD_DIR, before_filename), "JPEG", quality=90)
    after_img.save(os.path.join(UPLOAD_DIR, after_filename), "JPEG", quality=90)

    db = get_db()
    cursor = db.execute(
        """INSERT INTO tests (
            user_id, before_image_path, after_image_path,
            before_rgb_r, before_rgb_g, before_rgb_b,
            after_rgb_r, after_rgb_g, after_rgb_b,
            before_lab_l, before_lab_a, before_lab_b,
            after_lab_l, after_lab_a, after_lab_b,
            delta_a, delta_e, delta_l,
            pst_value, is_clean, label,
            location, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id, before_filename, after_filename,
            before["rgb"][0], before["rgb"][1], before["rgb"][2],
            after["rgb"][0], after["rgb"][1], after["rgb"][2],
            before_lab[0], before_lab[1], before_lab[2],
            after_lab[0], after_lab[1], after_lab[2],
            pst_result["deltas"]["delta_a"], pst_result["deltas"]["delta_E"], pst_result["deltas"]["delta_L"],
            pst_result["pst_value"], pst_result["is_clean"], pst_result["label"],
            location or None, notes or None,
        ),
    )
    db.commit()
    test_id = cursor.lastrowid
    db.close()

    return {
        "approved": True,
        "test_id": test_id,
        "pst_value": pst_result["pst_value"],
        "is_clean": pst_result["is_clean"],
        "label": pst_result["label"],
        "color_class": pst_result["color_class"],
        "before_rgb": list(before["rgb"]),
        "after_rgb": list(after["rgb"]),
        "before_lab": pst_result["before_lab"],
        "after_lab": pst_result["after_lab"],
        "deltas": pst_result["deltas"],
        "before_image_url": f"/uploads/{before_filename}",
        "after_image_url": f"/uploads/{after_filename}",
        "prepared_image_url": f"/uploads/{prepared_filename}",
        "wb_applied": result.wb_applied,
        "wb_reference_rgb": list(result.wb_reference_rgb) if result.wb_reference_rgb else None,
        "auto_upscaled_factor": result.auto_upscaled_factor,
        "location": location or None,
        "notes": notes or None,
        "created_at": datetime.now().isoformat(),
    }


@router.get("/tests")
async def list_tests(user_id: int = 1, limit: int = 50, offset: int = 0):
    """List tests for a user."""
    db = get_db()
    rows = db.execute(
        """SELECT id, pst_value, is_clean, label, location, notes, created_at
        FROM tests WHERE user_id = ?
        ORDER BY created_at DESC LIMIT ? OFFSET ?""",
        (user_id, limit, offset),
    ).fetchall()
    db.close()
    return [dict(row) for row in rows]


@router.get("/tests/{test_id}")
async def get_test(test_id: int):
    """Get a single test result."""
    db = get_db()
    row = db.execute("SELECT * FROM tests WHERE id = ?", (test_id,)).fetchone()
    db.close()
    if not row:
        raise HTTPException(status_code=404, detail="Test not found")

    r = dict(row)
    return {
        "test_id": r["id"],
        "pst_value": r["pst_value"],
        "is_clean": bool(r["is_clean"]),
        "label": r["label"],
        "before_rgb": [r["before_rgb_r"], r["before_rgb_g"], r["before_rgb_b"]],
        "after_rgb": [r["after_rgb_r"], r["after_rgb_g"], r["after_rgb_b"]],
        "before_lab": {"L": r["before_lab_l"], "a": r["before_lab_a"], "b": r["before_lab_b"]},
        "after_lab": {"L": r["after_lab_l"], "a": r["after_lab_a"], "b": r["after_lab_b"]},
        "deltas": {"delta_a": r["delta_a"], "delta_E": r["delta_e"], "delta_L": r["delta_l"]},
        "before_image_url": f"/uploads/{r['before_image_path']}",
        "after_image_url": f"/uploads/{r['after_image_path']}",
        "location": r["location"],
        "notes": r["notes"],
        "created_at": r["created_at"],
    }


@router.get("/thresholds")
async def get_thresholds():
    """Get current PST threshold configuration."""
    calculator = get_calculator()
    return {"thresholds": calculator.thresholds}


@router.put("/thresholds")
async def update_thresholds(data: dict):
    """Update PST threshold configuration."""
    thresholds = data.get("thresholds")
    if not thresholds or not isinstance(thresholds, list):
        raise HTTPException(status_code=400, detail="Invalid thresholds format")

    for t in thresholds:
        if not all(k in t for k in ("max", "label", "color_class", "is_clean")):
            raise HTTPException(status_code=400, detail="Each threshold needs: max, label, color_class, is_clean")

    calculator = get_calculator()
    calculator.save_thresholds(thresholds)
    return {"status": "ok", "thresholds": thresholds}


@router.post("/auth/register")
async def register(data: dict):
    """Register a new user."""
    import hashlib
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    company = data.get("company_name", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO users (email, password_hash, company_name) VALUES (?, ?, ?)",
            (email, password_hash, company or None),
        )
        db.commit()
        user_id = cursor.lastrowid
    except Exception:
        db.close()
        raise HTTPException(status_code=409, detail="Email already registered")
    db.close()

    return {"user_id": user_id, "email": email, "company_name": company}


@router.post("/auth/login")
async def login(data: dict):
    """Login and return user info."""
    import hashlib
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    db = get_db()
    row = db.execute(
        "SELECT id, email, company_name FROM users WHERE email = ? AND password_hash = ?",
        (email, password_hash),
    ).fetchone()
    db.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"user_id": row["id"], "email": row["email"], "company_name": row["company_name"]}


@router.get("/calibration/info")
async def calibration_info():
    """Get calibration model info."""
    calculator = get_calculator()
    return {
        "r_squared": calculator.r_squared,
        "n_samples": calculator.n_samples,
        "thresholds": calculator.thresholds,
    }
