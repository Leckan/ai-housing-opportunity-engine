"""Synthetic demonstration provider and deterministic feasibility calculations."""

from __future__ import annotations

import math
from typing import Any


DEMO_NOTICE = "DEMONSTRATION DATA — NOT VERIFIED PROPERTY INFORMATION"
CATEGORIES = [
    "Vacant land",
    "Underutilized residential",
    "Commercial reuse",
    "Small multifamily",
    "Transit-oriented",
    "Public land",
    "ADU potential",
    "Mixed-use",
    "Parking / commercial site",
    "Locally identified",
]
CITIES = ["Los Angeles", "Long Beach", "Pasadena", "Inglewood", "Pomona"]
ZONING = ["R-3 · demo", "C-2 · demo", "MU · demo", "R-2 · demo", "P · demo"]


def _sample(index: int, salt: int) -> float:
    value = math.sin(index * 127.1 + salt * 311.7) * 43758.5453
    return value - math.floor(value)


def _round(value: float) -> int:
    """Match JavaScript Math.round for the nonnegative demo inputs."""
    return math.floor(value + 0.5)


def _demo_parcel(index: int) -> dict[str, Any]:
    area = _round(4500 + _sample(index, 1) * 66000)
    transit = _round(30 + _sample(index, 2) * 68)
    need = _round(38 + _sample(index, 3) * 58)
    infrastructure = _round(48 + _sample(index, 4) * 48)
    parcel_size_score = min(100, _round(area / 550))
    constraints = [
        "Environmental screening required" if _sample(index, 6) > 0.72 else "No demo environmental flag",
        "Utility capacity unverified" if _sample(index, 7) > 0.68 else "Street access indicator present",
    ]
    constraint_flags = sum("required" in item or "unverified" in item for item in constraints)
    constraint_score = max(40, 100 - constraint_flags * 20)
    score = _round(
        parcel_size_score * 0.30
        + need * 0.27
        + transit * 0.20
        + infrastructure * 0.13
        + constraint_score * 0.10
    )
    confidence_value = _sample(index, 13)
    return {
        "id": f"demo-{index:03d}",
        "apn": f"DEMO-{index:05d}",
        "address": f"Demonstration site {index:03d}",
        "city": CITIES[math.floor(_sample(index, 8) * len(CITIES))],
        "county": "Los Angeles",
        "state": "CA",
        "areaSqFt": area,
        "assessedValue": _round(area * (18 + _sample(index, 9) * 44)),
        "landUse": ["Vacant / demo", "Commercial / demo", "Residential / demo", "Parking / demo"][math.floor(_sample(index, 10) * 4)],
        "zoning": ZONING[math.floor(_sample(index, 11) * len(ZONING))],
        "category": CATEGORIES[math.floor(_sample(index, 12) * len(CATEGORIES))],
        "score": max(28, min(96, score)),
        "parcelSizeScore": parcel_size_score,
        "confidence": "High" if confidence_value > 0.72 else "Medium" if confidence_value > 0.33 else "Low",
        "units": max(4, math.floor((area / 43560) * (28 + _sample(index, 14) * 58))),
        "lat": 33.72 + _sample(index, 15) * 0.66,
        "lng": -118.58 + _sample(index, 16) * 0.82,
        "transit": transit,
        "housingNeed": need,
        "infrastructure": infrastructure,
        "constraintScore": constraint_score,
        "constraints": constraints,
    }


DEMO_PARCELS = [_demo_parcel(index) for index in range(1, 101)]
DEMO_JURISDICTIONS = [
    {"name": name, "jurisdictionType": "county", "state": "CA", "dataReadiness": "synthetic demo sample" if name == "Los Angeles County" else "unverified"}
    for name in ("Los Angeles County", "Riverside County", "San Bernardino County", "San Diego County", "Orange County")
]
DEMO_REGIONAL_INDICATORS = [
    {"name": "Los Angeles County", "score": 74, "sites": 100, "demand": 82},
    {"name": "Riverside County", "score": 68, "sites": 0, "demand": 77},
    {"name": "San Bernardino County", "score": 65, "sites": 0, "demand": 70},
    {"name": "Orange County", "score": 61, "sites": 0, "demand": 69},
    {"name": "San Diego County", "score": 66, "sites": 0, "demand": 73},
]


def search_parcels(q: str = "", category: str | None = None) -> list[dict[str, Any]]:
    needle = q.strip().lower()
    return [
        parcel
        for parcel in DEMO_PARCELS
        if (not needle or any(needle in str(parcel[field]).lower() for field in ("id", "apn", "address", "city", "category")))
        and (not category or category == "All opportunities" or parcel["category"] == category)
    ]


def housing_indicators() -> list[dict[str, Any]]:
    cities = sorted({parcel["city"] for parcel in DEMO_PARCELS})
    rows = []
    for city in cities:
        records = [parcel for parcel in DEMO_PARCELS if parcel["city"] == city]
        rows.append({
            "geography": city,
            "indicator": "relative_housing_need_demo_score",
            "value": _round(sum(parcel["housingNeed"] for parcel in records) / len(records)),
            "unit": "synthetic relative index (0–100)",
            "recordCount": len(records),
            "sourceClassification": "synthetic demonstration",
        })
    return rows


def calculate_feasibility(inputs: dict[str, float]) -> dict[str, float | int]:
    area = inputs["parcelAreaSqFt"]
    units = max(
        0,
        min(
            math.floor(area / 43560 * inputs["densityUnitsPerAcre"]),
            math.floor(area * inputs["netToGross"] / inputs["unitSizeSqFt"]),
        ),
    )
    gross_area = units * inputs["unitSizeSqFt"]
    land = _round(area * inputs["landCostPerSqFt"])
    hard = _round(gross_area * inputs["constructionCostPerSqFt"])
    soft = _round(hard * 0.22)
    contingency = _round(hard * 0.08)
    financing = _round((hard + soft + contingency) * 0.07)
    total = land + hard + soft + contingency + financing
    gross_rent = units * inputs["monthlyRentPerUnit"] * 12
    noi = _round(gross_rent * 0.62)
    return {
        "units": units,
        "grossFloorAreaSqFt": gross_area,
        "landAcquisition": land,
        "hardCosts": hard,
        "softCosts": soft,
        "contingency": contingency,
        "financing": financing,
        "totalDevelopmentCost": total,
        "annualGrossRent": gross_rent,
        "annualNetOperatingIncome": noi,
        "yieldOnCost": noi / total * 100 if total else 0,
        "affordableUnits": _round(units * inputs["affordableSharePct"] / 100),
        "affordableMonthlyRent": _round(inputs["monthlyRentPerUnit"] * 0.7),
    }
