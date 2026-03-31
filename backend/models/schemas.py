"""Pydantic models for API request/response schemas."""

from pydantic import BaseModel
from typing import Optional


class LabColor(BaseModel):
    L: float
    a: float
    b: float


class ColorDeltas(BaseModel):
    delta_L: float
    delta_a: float
    delta_b: float
    delta_E: float


class AnalysisResult(BaseModel):
    test_id: int
    pst_value: float
    is_clean: bool
    label: str
    color_class: str
    before_rgb: list
    after_rgb: list
    before_lab: LabColor
    after_lab: LabColor
    deltas: ColorDeltas
    before_image_url: str
    after_image_url: str
    location: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


class TestSummary(BaseModel):
    id: int
    pst_value: float
    is_clean: bool
    label: str
    location: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
