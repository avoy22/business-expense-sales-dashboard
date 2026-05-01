"""
FastAPI entry point for the Business Data Cleaning & Profit Dashboard.

Endpoints:
    GET  /health                          quick liveness check
    POST /api/analyze                     upload CSV/XLSX/XLS, get analysis JSON
    GET  /api/download/excel/{file_id}    download the Excel report
    GET  /api/download/pdf/{file_id}      download the PDF report

Run with:
    uvicorn app.main:app --reload
"""

from __future__ import annotations

import io
import os
import uuid
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response

from app.services.analyzer import analyze
from app.services.cleaner import clean_business_data
from app.services.excel_exporter import export_to_excel
from app.services.pdf_exporter import export_to_pdf


# ---------- paths ----------

# project root = parent of the "app" package.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
GENERATED_DIR = PROJECT_ROOT / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)


# ---------- app ----------

app = FastAPI(
    title="Business Data Cleaning & Profit Dashboard",
    version="1.0.0",
    description="Upload messy business data, get a clean dashboard + downloadable reports.",
)


# CORS: local dev frontend + optional production origin from env var.
allowed_origins = ["http://localhost:5173"]
production_origin = os.getenv("FRONTEND_ORIGIN")
if production_origin:
    allowed_origins.append(production_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- helpers ----------

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def _read_uploaded_file(filename: str, content: bytes) -> pd.DataFrame:
    """Pick the right pandas reader based on file extension."""
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Please upload a CSV, XLSX, or XLS file.",
        )

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    buffer = io.BytesIO(content)
    try:
        if suffix == ".csv":
            # Try utf-8 first, fall back to latin-1 for Excel-exported CSVs.
            try:
                return pd.read_csv(buffer)
            except UnicodeDecodeError:
                buffer.seek(0)
                return pd.read_csv(buffer, encoding="latin-1")
        else:
            engine = "openpyxl" if suffix == ".xlsx" else None
            return pd.read_excel(buffer, engine=engine)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 — surfaced to the client below
        raise HTTPException(
            status_code=400,
            detail=f"Could not read the uploaded file: {exc}",
        ) from exc


# ---------- routes ----------

@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    """Return no content for browser favicon probes."""
    return Response(status_code=204)


@app.get("/health")
def health() -> dict[str, str]:
    """Lightweight check used by uptime monitors and smoke tests."""
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)) -> JSONResponse:
    """
    Accept a single uploaded CSV/XLSX/XLS file, clean it, analyze it,
    write Excel + PDF reports to disk, and return the analysis JSON
    plus URLs the frontend can use to download the reports.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    content = await file.read()
    raw_df = _read_uploaded_file(file.filename, content)

    # Clean.
    try:
        cleaned_df = clean_business_data(raw_df)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Analyze.
    analysis = analyze(cleaned_df)

    # Save reports under a unique file_id.
    file_id = uuid.uuid4().hex
    excel_path = GENERATED_DIR / f"{file_id}.xlsx"
    pdf_path = GENERATED_DIR / f"{file_id}.pdf"

    try:
        export_to_excel(
            cleaned_df=cleaned_df,
            monthly_trend=analysis["monthly_trend"],
            category_breakdown=analysis["category_breakdown"],
            top_products=analysis["top_products"],
            output_path=excel_path,
        )
        export_to_pdf(
            summary=analysis["summary"],
            monthly_trend=analysis["monthly_trend"],
            top_products=analysis["top_products"],
            category_breakdown=analysis["category_breakdown"],
            output_path=pdf_path,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report files: {exc}",
        ) from exc

    response = {
        "file_id": file_id,
        "summary": analysis["summary"],
        "monthly_trend": analysis["monthly_trend"],
        "top_products": analysis["top_products"],
        "category_breakdown": analysis["category_breakdown"],
        "preview_rows": analysis["preview_rows"],
        "download_excel_url": f"/api/download/excel/{file_id}",
        "download_pdf_url": f"/api/download/pdf/{file_id}",
    }
    return JSONResponse(content=response)


@app.get("/api/download/excel/{file_id}")
def download_excel(file_id: str) -> FileResponse:
    return _serve_generated(file_id, ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@app.get("/api/download/pdf/{file_id}")
def download_pdf(file_id: str) -> FileResponse:
    return _serve_generated(file_id, ".pdf", "application/pdf")


def _serve_generated(file_id: str, suffix: str, media_type: str) -> FileResponse:
    """Look up a generated file by id+suffix and return it, or 404."""
    # Reject anything that is not a clean uuid hex to avoid path traversal.
    if not file_id.isalnum() or len(file_id) > 64:
        raise HTTPException(status_code=400, detail="Invalid file id.")

    path = GENERATED_DIR / f"{file_id}{suffix}"
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found or has expired.")

    download_name = f"business-report-{file_id}{suffix}"
    return FileResponse(path=path, media_type=media_type, filename=download_name)
