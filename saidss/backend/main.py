"""FastAPI backend for SAIDSS accident severity predictions."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "accident_model.pkl"
SCALER_PATH = BASE_DIR / "models" / "scaler.pkl"

VEHICLE_MAP: Dict[str, int] = {"bike": 0, "car": 1, "scooter": 2}
FEATURE_COLUMNS = [
    "resultant_accel",
    "max_resultant_accel",
    "avg_resultant_accel",
    "resultant_jerk",
    "impact_duration",
    "area_under_accel_curve",
    "delta_speed",
    "impact_energy_estimate",
    "pre_crash_speed_avg",
    "max_gyro_value",
    "angular_acceleration",
    "tilt_angle_change",
    "heart_rate_change",
    "heart_rate_variability",
    "fall_detected",
    "vehicle_type",
    "airbag_triggered",
    "seatbelt_status",
]
NUM_CLASSES = 4

app = FastAPI(title="SAIDSS Severity API", version="1.0.0")
model = None
scaler = None


class PredictionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resultant_accel: float
    max_resultant_accel: float
    avg_resultant_accel: float
    resultant_jerk: float
    impact_duration: float
    area_under_accel_curve: float
    delta_speed: float
    impact_energy_estimate: float
    pre_crash_speed_avg: float
    max_gyro_value: float
    angular_acceleration: float
    tilt_angle_change: float
    heart_rate_change: float
    heart_rate_variability: float
    fall_detected: int = Field(..., ge=0, le=1)
    vehicle_type: str
    airbag_triggered: int = Field(..., ge=0, le=1)
    seatbelt_status: int = Field(..., ge=0, le=1)

    @field_validator("vehicle_type")
    @classmethod
    def validate_vehicle_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in VEHICLE_MAP:
            raise ValueError("vehicle_type must be one of: bike, car, scooter")
        return normalized


class PredictionResponse(BaseModel):
    severity: int = Field(..., ge=0, le=3)
    probabilities: List[float]


def load_artifacts() -> None:
    global model, scaler
    if model is not None and scaler is not None:
        return

    if not MODEL_PATH.exists() or not SCALER_PATH.exists():
        raise RuntimeError(
            "Model artifacts not found. Run train_model.py to create models/accident_model.pkl and models/scaler.pkl"
        )

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)


def to_feature_frame(payload: PredictionInput) -> pd.DataFrame:
    feature_values = [
        payload.resultant_accel,
        payload.max_resultant_accel,
        payload.avg_resultant_accel,
        payload.resultant_jerk,
        payload.impact_duration,
        payload.area_under_accel_curve,
        payload.delta_speed,
        payload.impact_energy_estimate,
        payload.pre_crash_speed_avg,
        payload.max_gyro_value,
        payload.angular_acceleration,
        payload.tilt_angle_change,
        payload.heart_rate_change,
        payload.heart_rate_variability,
        float(payload.fall_detected),
        float(VEHICLE_MAP[payload.vehicle_type]),
        float(payload.airbag_triggered),
        float(payload.seatbelt_status),
    ]
    row = np.array(feature_values, dtype=np.float64).reshape(1, -1)
    return pd.DataFrame(row, columns=FEATURE_COLUMNS)


def build_probability_vector(raw_probabilities: List[float], model_classes: List[int]) -> List[float]:
    """Return a stable [Low, Medium, High, Severe] probability vector."""
    if len(raw_probabilities) == NUM_CLASSES and sorted(model_classes) == [0, 1, 2, 3]:
        return raw_probabilities

    probabilities = [0.0] * NUM_CLASSES
    for idx, class_label in enumerate(model_classes):
        if 0 <= class_label < NUM_CLASSES:
            probabilities[class_label] = float(raw_probabilities[idx])
    return probabilities


@app.on_event("startup")
def startup_event() -> None:
    load_artifacts()


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionInput) -> PredictionResponse:
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model service is not initialized")

    try:
        feature_frame = to_feature_frame(payload)
        scaled_vector = scaler.transform(feature_frame)
        predicted_class = int(model.predict(scaled_vector)[0])
        raw_probabilities = model.predict_proba(scaled_vector)[0].tolist()
        model_classes = [int(value) for value in getattr(model, "classes_", [])]
        probabilities = build_probability_vector(raw_probabilities, model_classes)
        return PredictionResponse(severity=predicted_class, probabilities=probabilities)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input data: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
