"""AHOE's standalone FastAPI synthetic provider for local development only."""

from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from .domain import DEMO_NOTICE, DEMO_JURISDICTIONS, DEMO_PARCELS, DEMO_REGIONAL_INDICATORS, calculate_feasibility, housing_indicators, search_parcels


if os.getenv("AHOE_ENV", "development").lower() == "production":
    raise RuntimeError("The synthetic AHOE API is development-only and refuses production mode.")

app = FastAPI(
    title="AHOE Demonstration API",
    version="0.1.0",
    description="Synthetic, unauthenticated development API. Do not expose publicly or use for real property decisions.",
)
origins = [value.strip() for value in os.getenv("AHOE_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if value.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class FeasibilityRequest(BaseModel):
    parcelAreaSqFt: float = Field(default=0, ge=0, le=10_000_000)
    densityUnitsPerAcre: float = Field(default=48, ge=0, le=500)
    netToGross: float = Field(default=0.82, ge=0, le=1)
    constructionCostPerSqFt: float = Field(default=340, ge=0, le=5000)
    landCostPerSqFt: float = Field(default=48, ge=0, le=100_000)
    monthlyRentPerUnit: float = Field(default=2450, ge=0, le=100_000)
    unitSizeSqFt: float = Field(default=760, gt=0, le=100_000)
    affordableSharePct: float = Field(default=25, ge=0, le=100)


class ZoningQuery(BaseModel):
    question: str = Field(min_length=1, max_length=1600)
    parcelId: str | None = Field(default=None, max_length=100)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    parcelId: str | None = Field(default=None, max_length=100)


class ReportRequest(BaseModel):
    parcelId: str = Field(min_length=1, max_length=100)
    format: Literal["json", "csv"] = "json"


def envelope(data):
    return {"data": data, "dataClassification": "synthetic demonstration", "notice": DEMO_NOTICE}


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "mode": "demonstration", "dataClassification": "synthetic"}


@app.get("/api/v1/jurisdictions")
def jurisdictions():
    return {"data": DEMO_JURISDICTIONS, "dataClassification": "configuration metadata", "notice": "Target jurisdictions only; source coverage remains unverified."}


@app.get("/api/v1/housing-indicators")
def list_housing_indicators(geography: str | None = Query(default=None, max_length=100)):
    rows = housing_indicators()
    if geography:
        rows = [row for row in rows if geography.lower() in row["geography"].lower()]
    return {"data": rows, "dataClassification": "synthetic demonstration", "notice": DEMO_NOTICE}


@app.get("/api/v1/regional-analytics")
def regional_analytics():
    return {"data": {"scope": "Southern California pilot", "indicators": DEMO_REGIONAL_INDICATORS, "jurisdictions": DEMO_JURISDICTIONS}, "dataClassification": "synthetic demonstration placeholders", "notice": DEMO_NOTICE}


@app.get("/api/v1/data-providers")
def data_providers():
    return {"data": [{"name": "Synthetic parcel inventory", "type": "Parcel records", "status": "Demo provider", "live": False}, {"name": "Sample zoning library", "type": "Zoning documents", "status": "Demo provider", "live": False}], "liveConnections": 0, "dataClassification": "provider configuration"}


@app.get("/api/v1/parcels")
def list_parcels(
    q: str = Query(default="", max_length=160),
    category: str | None = Query(default=None, max_length=80),
    page: int = Query(default=1, ge=1, le=10_000),
    pageSize: int = Query(default=25, ge=1, le=100),
):
    rows = search_parcels(q, category)
    start = (page - 1) * pageSize
    return {"data": rows[start : start + pageSize], "pagination": {"page": page, "pageSize": pageSize, "total": len(rows), "hasMore": start + pageSize < len(rows)}, "dataClassification": "synthetic demonstration", "notice": DEMO_NOTICE}


@app.get("/api/v1/parcels/search")
def filter_parcels(
    q: str = Query(default="", max_length=160),
    category: str | None = Query(default=None, max_length=80),
    minArea: float = Query(default=0, ge=0),
    maxArea: float = Query(default=0, ge=0),
    minScore: float = Query(default=0, ge=0, le=100),
):
    if maxArea and minArea > maxArea:
        raise HTTPException(status_code=400, detail={"code": "INVALID_QUERY", "message": "minArea must not exceed maxArea."})
    rows = [p for p in search_parcels(q, category) if p["areaSqFt"] >= minArea and (not maxArea or p["areaSqFt"] <= maxArea) and p["score"] >= minScore]
    return {"data": rows, "total": len(rows), "dataClassification": "synthetic demonstration", "notice": DEMO_NOTICE}


@app.get("/api/v1/parcels/{parcel_id}")
def get_parcel(parcel_id: str):
    parcel = next((p for p in DEMO_PARCELS if parcel_id in (p["id"], p["apn"])), None)
    if parcel is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Demonstration parcel not found."})
    return envelope(parcel)


@app.post("/api/v1/parcels/{parcel_id}/analyze")
def analyze_parcel(parcel_id: str, request: FeasibilityRequest):
    parcel = next((p for p in DEMO_PARCELS if parcel_id in (p["id"], p["apn"])), None)
    if parcel is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Demonstration parcel not found."})
    inputs = request.model_dump()
    if inputs["parcelAreaSqFt"] == 0:
        inputs["parcelAreaSqFt"] = parcel["areaSqFt"]
    result = calculate_feasibility(inputs)
    return {"data": {"parcelId": parcel["id"], "inputs": inputs, "result": result}, "dataClassification": "synthetic demonstration", "disclaimer": "Illustrative assumptions only; not a valuation or code determination."}


@app.get("/api/v1/opportunities/rank")
def rank_opportunities(minScore: int = Query(default=0, ge=0, le=100), limit: int = Query(default=50, ge=1, le=100)):
    rows = sorted((p for p in DEMO_PARCELS if p["score"] >= minScore), key=lambda p: p["score"], reverse=True)[:limit]
    return {"data": rows, "total": len(rows), "weights": {"parcelSize": 0.30, "housingNeed": 0.27, "transit": 0.20, "infrastructure": 0.13, "constraintScreen": 0.10}, "dataClassification": "synthetic demonstration"}


@app.post("/api/v1/zoning/query")
def query_zoning(request: ZoningQuery):
    return {
        "answer": f'I found two demonstration excerpts related to “{request.question.strip()}”. The excerpts are fictional and do not establish adopted requirements. Verify the current code with the relevant planning authority.',
        "evidence": [
            {"title": "Demonstration zoning excerpt · Housing district", "citation": "Fictional sample document · section 4.2 · page 11"},
            {"title": "Demonstration land use schedule", "citation": "Fictional sample document · table 2 · page 6"},
        ],
        "parcelId": request.parcelId,
        "confidence": "low",
        "dataClassification": "fictional demonstration excerpts",
    }


@app.post("/api/v1/ai/chat")
def assistant_chat(request: ChatRequest):
    message = request.message.strip()
    selected = next((p for p in DEMO_PARCELS if p["id"] == request.parcelId), DEMO_PARCELS[0])
    if "top" in message.lower() or "rank" in message.lower():
        top = sorted(DEMO_PARCELS, key=lambda p: p["score"], reverse=True)[:5]
        answer = "Top synthetic sites: " + ", ".join(f'{p["apn"]} ({p["score"]}/100)' for p in top) + ". These are not verified properties or recommendations."
    else:
        answer = f'{selected["apn"]} is a synthetic {selected["areaSqFt"]:,} sq ft demonstration site with a {selected["score"]}/100 screening score. Verify current zoning, ownership, title, survey, environmental conditions, utilities, and market assumptions before any decision.'
    return {"answer": answer, "scope": "synthetic demonstration workspace", "disclaimer": "Not legal, financial, environmental, or entitlement advice."}


@app.post("/api/v1/reports")
def create_report(request: ReportRequest):
    parcel = next((p for p in DEMO_PARCELS if request.parcelId in (p["id"], p["apn"])), None)
    if parcel is None:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Demonstration parcel not found."})
    if request.format == "csv":
        rows = [
            "field,value",
            f'parcel_id,{parcel["id"]}',
            f'apn,{parcel["apn"]}',
            f'site_label,{parcel["address"]}',
            f'city,{parcel["city"]}',
            f'area_sq_ft,{parcel["areaSqFt"]}',
            f'opportunity_score,{parcel["score"]}',
            f'category,{parcel["category"]}',
            f'confidence,{parcel["confidence"]}',
            "data_classification,synthetic demonstration data",
        ]
        return PlainTextResponse("\n".join(rows), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename=ahoe-{parcel["apn"].lower()}-demo.csv'})
    return {"data": {"title": "AHOE Demonstration Property Brief", "notice": DEMO_NOTICE, "parcel": parcel, "disclaimer": "Synthetic property data; not a verified property record."}, "format": request.format, "dataClassification": "synthetic demonstration"}
