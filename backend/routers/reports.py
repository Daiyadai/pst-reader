"""PDF report generation endpoint."""

import os
import io
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..database import get_db
from ..services.pdf_generator import generate_report_pdf

router = APIRouter(prefix="/api", tags=["reports"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


@router.get("/reports/{test_id}/pdf")
async def download_report(test_id: int, lang: str = "en"):
    """Generate and download a PDF report for a test.

    Query param: ?lang=en|zh|de
    """
    db = get_db()
    row = db.execute("SELECT * FROM tests WHERE id = ?", (test_id,)).fetchone()
    db.close()

    if not row:
        raise HTTPException(status_code=404, detail="Test not found")

    test_data = dict(row)

    before_img_path = os.path.join(UPLOAD_DIR, test_data["before_image_path"])
    after_img_path = os.path.join(UPLOAD_DIR, test_data["after_image_path"])

    pdf_buffer = generate_report_pdf(test_data, before_img_path, after_img_path, lang=lang)

    filename = f"PST_Report_{test_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
