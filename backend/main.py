"""PST Image Reader — FastAPI Backend."""

import os
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from .routers import analyze, reports
from .database import init_db

app = FastAPI(
    title="PST Image Reader API",
    description="Analyze before/after cleaning images and calculate PST values",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Routers
app.include_router(analyze.router)
app.include_router(reports.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "pst-image-reader"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print(f"ERROR: {exc}\n{tb}")
    return JSONResponse(status_code=500, content={"detail": str(exc), "traceback": tb})


@app.on_event("startup")
async def startup():
    init_db()
