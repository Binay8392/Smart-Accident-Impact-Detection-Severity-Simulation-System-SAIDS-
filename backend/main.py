"""SAIDSS FastAPI backend with ML inference and MongoDB analytics."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

try:
    import shap
except Exception:  # noqa: BLE001
    shap = None

app = FastAPI(title="SAIDSS API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURE_ORDER = [
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

SEVERITY_LABELS = {0: "Low", 1: "Medium", 2: "High", 3: "Severe"}

MOCK_USERS: Dict[str, Dict[str, Any]] = {
    "admin": {
        "id": "admin-001",
        "name": "Admin Controller",
        "email": "admin@saidss.ai",
        "role": "admin",
        "password": "admin123",
        "avatar": "A",
    },
    "user1": {
        "id": "usr-001",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "role": "user",
        "password": "user123",
        "avatar": "R",
        "device_id": "WDEV-4821",
        "device_status": "connected",
    },
    "user2": {
        "id": "usr-002",
        "name": "Priya Singh",
        "email": "priya@example.com",
        "role": "user",
        "password": "user123",
        "avatar": "P",
        "device_id": "WDEV-3317",
        "device_status": "connected",
    },
    "user3": {
        "id": "usr-003",
        "name": "Arjun Mehta",
        "email": "arjun@example.com",
        "role": "user",
        "password": "user123",
        "avatar": "M",
        "device_id": "WDEV-7743",
        "device_status": "disconnected",
    },
}

MODEL = None
SCALER = None
MODEL_ERROR: Optional[str] = None
EXPLAINER = None
SHAP_ERROR: Optional[str] = None

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = "saidss_db"
MONGO_COLLECTION = "accidents"

mongo_client: Optional[AsyncIOMotorClient] = None
accidents_collection = None
mongo_ready = False
mongo_error: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class PredictInput(BaseModel):
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
    vehicle_type: int = Field(..., ge=0, le=2)
    airbag_triggered: int = Field(..., ge=0, le=1)
    seatbelt_status: int = Field(..., ge=0, le=1)


def _candidate_model_dirs() -> List[Path]:
    backend_dir = Path(__file__).resolve().parent
    return [
        backend_dir.parent / "model",
        backend_dir.parent / "saidss" / "models",
    ]


def load_model_artifacts() -> None:
    global MODEL, SCALER, MODEL_ERROR, EXPLAINER, SHAP_ERROR

    for model_dir in _candidate_model_dirs():
        model_path = model_dir / "accident_model.pkl"
        scaler_path = model_dir / "scaler.pkl"
        if model_path.exists() and scaler_path.exists():
            try:
                candidate_model = joblib.load(model_path)
                candidate_scaler = joblib.load(scaler_path)
                expected_feature_count = len(FEATURE_ORDER)
                scaler_feature_count = getattr(candidate_scaler, "n_features_in_", None)
                if scaler_feature_count is not None and scaler_feature_count != expected_feature_count:
                    MODEL_ERROR = (
                        f"Incompatible scaler in {model_dir}: expected {expected_feature_count} features, "
                        f"found {scaler_feature_count}"
                    )
                    continue
                MODEL = candidate_model
                SCALER = candidate_scaler
                MODEL_ERROR = None
                EXPLAINER, SHAP_ERROR = build_shap_explainer(candidate_model)
                return
            except Exception as exc:  # noqa: BLE001
                MODEL_ERROR = f"Failed loading artifacts from {model_dir}: {exc}"

    MODEL = None
    SCALER = None
    EXPLAINER = None
    SHAP_ERROR = "Model artifacts not loaded"
    if MODEL_ERROR is None:
        MODEL_ERROR = "Could not locate accident_model.pkl and scaler.pkl"


def build_shap_explainer(model: Any) -> tuple[Optional[Any], Optional[str]]:
    if shap is None:
        return None, "shap dependency not available"

    try:
        return shap.TreeExplainer(model), None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


async def init_mongo() -> None:
    global mongo_client, accidents_collection, mongo_ready, mongo_error

    try:
        mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        await mongo_client.admin.command("ping")
        database = mongo_client[MONGO_DB_NAME]
        accidents_collection = database[MONGO_COLLECTION]
        mongo_ready = True
        mongo_error = None
    except Exception as exc:  # noqa: BLE001
        mongo_ready = False
        mongo_error = str(exc)
        accidents_collection = None


@app.on_event("startup")
async def on_startup() -> None:
    load_model_artifacts()
    await init_mongo()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    if mongo_client is not None:
        mongo_client.close()


def ensure_model_ready() -> None:
    if MODEL is None or SCALER is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model artifacts unavailable: {MODEL_ERROR or 'unknown error'}",
        )


def ensure_db_ready() -> None:
    if not mongo_ready or accidents_collection is None:
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {mongo_error or 'not connected'}",
        )


def build_feature_vector(payload: PredictInput) -> np.ndarray:
    values = payload.model_dump()
    ordered = [float(values[key]) for key in FEATURE_ORDER]
    return np.array(ordered, dtype=np.float64).reshape(1, -1)


def normalize_probabilities(raw: np.ndarray, classes: np.ndarray) -> List[float]:
    probabilities = [0.0, 0.0, 0.0, 0.0]
    for index, class_id in enumerate(classes):
        class_int = int(class_id)
        if 0 <= class_int <= 3:
            probabilities[class_int] = float(raw[index])
    return probabilities


def extract_class_shap_values(raw_values: Any, predicted_class: int) -> Optional[np.ndarray]:
    array = np.asarray(raw_values)
    feature_count = len(FEATURE_ORDER)

    if isinstance(raw_values, list):
        if not raw_values:
            return None
        index = min(predicted_class, len(raw_values) - 1)
        class_values = np.asarray(raw_values[index])
        return class_values[0] if class_values.ndim > 1 else class_values

    if array.ndim == 2:
        return array[0]

    if array.ndim == 3:
        if array.shape[1] == feature_count:
            index = min(predicted_class, array.shape[2] - 1)
            return array[0, :, index]
        if array.shape[2] == feature_count:
            if array.shape[0] == 1:
                index = min(predicted_class, array.shape[1] - 1)
                return array[0, index, :]
            index = min(predicted_class, array.shape[0] - 1)
            return array[index, 0, :]

    return None


def generate_explanation(scaled_features: np.ndarray, predicted_class: int) -> List[Dict[str, Any]]:
    if EXPLAINER is None:
        return []

    try:
        shap_values = EXPLAINER.shap_values(scaled_features)
        class_values = extract_class_shap_values(shap_values, predicted_class)
        if class_values is None:
            return []

        abs_values = np.abs(np.asarray(class_values, dtype=np.float64))
        top_indices = np.argsort(abs_values)[::-1][:5]

        explanation = []
        for index in top_indices:
            explanation.append(
                {
                    "feature": FEATURE_ORDER[int(index)],
                    "impact": float(round(abs_values[int(index)], 6)),
                }
            )
        return explanation
    except Exception:  # noqa: BLE001
        return []


async def persist_accident(record: Dict[str, Any]) -> bool:
    if not mongo_ready or accidents_collection is None:
        return False

    try:
        await accidents_collection.insert_one(record)
        return True
    except PyMongoError:
        return False


def serialize_record(doc: Dict[str, Any]) -> Dict[str, Any]:
    out = {**doc}
    out["id"] = str(out.pop("_id"))
    timestamp = out.get("timestamp")
    if isinstance(timestamp, datetime):
        out["timestamp"] = timestamp.isoformat()
    return out


@app.post("/auth/login")
async def login(request: LoginRequest) -> Dict[str, Any]:
    user = MOCK_USERS.get(request.username)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    safe_user = {k: v for k, v in user.items() if k != "password"}
    return {"success": True, "user": safe_user, "token": f"tok-{safe_user['id']}"}


@app.post("/predict")
async def predict(payload: PredictInput) -> Dict[str, Any]:
    ensure_model_ready()

    try:
        feature_vector = build_feature_vector(payload)
        scaled = SCALER.transform(feature_vector)
        predicted_class = int(MODEL.predict(scaled)[0])

        if hasattr(MODEL, "predict_proba") and hasattr(MODEL, "classes_"):
            raw_probabilities = MODEL.predict_proba(scaled)[0]
            class_ids = MODEL.classes_
            probabilities = normalize_probabilities(raw_probabilities, class_ids)
        else:
            probabilities = [0.0, 0.0, 0.0, 0.0]
            probabilities[predicted_class] = 1.0
        explanation = generate_explanation(scaled, predicted_class)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    timestamp = datetime.now(timezone.utc)
    record = {
        "timestamp": timestamp,
        **payload.model_dump(),
        "severity": predicted_class,
        "probabilities": probabilities,
        "explanation": explanation,
    }
    stored = await persist_accident(record)

    return {
        "severity": predicted_class,
        "severity_label": SEVERITY_LABELS.get(predicted_class, "Unknown"),
        "probabilities": probabilities,
        "explanation": explanation,
        "timestamp": timestamp.isoformat(),
        "stored": stored,
    }


@app.get("/accidents")
async def get_accidents() -> List[Dict[str, Any]]:
    ensure_db_ready()

    try:
        cursor = accidents_collection.find().sort("timestamp", -1).limit(50)
        records = await cursor.to_list(length=50)
        return [serialize_record(doc) for doc in records]
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch accidents: {exc}") from exc


@app.get("/analytics/severity")
async def severity_analytics() -> Dict[str, int]:
    ensure_db_ready()

    try:
        pipeline = [
            {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
        ]
        rows = await accidents_collection.aggregate(pipeline).to_list(length=10)

        result = {"Low": 0, "Medium": 0, "High": 0, "Severe": 0}
        for row in rows:
            label = SEVERITY_LABELS.get(int(row["_id"]))
            if label:
                result[label] = int(row["count"])
        return result
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed severity analytics: {exc}") from exc


@app.get("/analytics/trends")
async def trend_analytics() -> List[Dict[str, Any]]:
    ensure_db_ready()

    try:
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$timestamp"},
                        "month": {"$month": "$timestamp"},
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}},
        ]
        rows = await accidents_collection.aggregate(pipeline).to_list(length=120)
        return [
            {
                "month": f"{int(row['_id']['year']):04d}-{int(row['_id']['month']):02d}",
                "count": int(row["count"]),
            }
            for row in rows
        ]
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed trend analytics: {exc}") from exc


@app.get("/features")
async def get_features() -> List[str]:
    return FEATURE_ORDER


@app.get("/users")
async def get_users() -> Dict[str, List[Dict[str, Any]]]:
    users = [
        {k: v for k, v in user.items() if k != "password"}
        for user in MOCK_USERS.values()
        if user["role"] == "user"
    ]
    return {"users": users}


@app.get("/users/{user_id}")
async def get_user(user_id: str) -> Dict[str, Any]:
    for user in MOCK_USERS.values():
        if user["id"] == user_id:
            return {k: v for k, v in user.items() if k != "password"}
    raise HTTPException(status_code=404, detail="User not found")


@app.get("/admin/stats")
async def admin_stats() -> Dict[str, Any]:
    severity_data = {"Low": 0, "Medium": 0, "High": 0, "Severe": 0}
    trend_data: List[Dict[str, Any]] = []

    if mongo_ready and accidents_collection is not None:
        try:
            severity_data = await severity_analytics()
            trend_data = await trend_analytics()
        except HTTPException:
            pass

    return {
        "severity_distribution": severity_data,
        "monthly_trends": trend_data,
        "mongodb_ready": mongo_ready,
    }


@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "name": "SAIDSS API",
        "status": "online",
        "model_ready": MODEL is not None,
        "mongodb_ready": mongo_ready,
    }


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "status": "healthy" if (MODEL is not None and mongo_ready) else "degraded",
        "model_ready": MODEL is not None,
        "shap_ready": EXPLAINER is not None,
        "shap_error": SHAP_ERROR,
        "mongodb_ready": mongo_ready,
        "mongo_error": mongo_error,
    }
