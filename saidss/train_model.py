"""Train SAIDSS accident severity model and export model artifacts."""
from __future__ import annotations

import logging
import shutil
from pathlib import Path
from typing import Dict, Tuple

import joblib
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
RAW_DATASET_PATH = DATASET_DIR / "accident_dataset_with_severity_95_97_accuracy.xlsx"
CANONICAL_DATASET_PATH = DATASET_DIR / "accident_dataset_with_severity.xlsx"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "accident_model.pkl"
SCALER_PATH = MODELS_DIR / "scaler.pkl"

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

SEVERITY_COLUMN = "Severity"
TARGET_COLUMN = "severity_class"
SEVERITY_MAP = {"Low": 0, "Medium": 1, "High": 2, "Severe": 3}
VEHICLE_MAP = {"bike": 0, "car": 1, "scooter": 2}


def ensure_directories() -> None:
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)


def ensure_canonical_dataset() -> Path:
    """Ensure the canonical dataset name exists in dataset/ for training."""
    if CANONICAL_DATASET_PATH.exists():
        return CANONICAL_DATASET_PATH
    if RAW_DATASET_PATH.exists():
        shutil.copy2(RAW_DATASET_PATH, CANONICAL_DATASET_PATH)
        logger.info("Copied dataset to canonical path: %s", CANONICAL_DATASET_PATH)
        return CANONICAL_DATASET_PATH
    raise FileNotFoundError(
        "Dataset not found. Expected one of: "
        f"{CANONICAL_DATASET_PATH} or {RAW_DATASET_PATH}"
    )


def load_dataset(path: Path) -> pd.DataFrame:
    logger.info("Loading dataset from %s", path)
    return pd.read_excel(path)


def validate_schema(df: pd.DataFrame) -> None:
    required = set(FEATURE_COLUMNS + [SEVERITY_COLUMN])
    missing = sorted(required.difference(df.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")


def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Map categorical labels to numeric classes and drop invalid rows."""
    out = df.copy()
    out[SEVERITY_COLUMN] = out[SEVERITY_COLUMN].astype(str).str.strip().str.title()
    out["vehicle_type"] = out["vehicle_type"].astype(str).str.strip().str.lower()

    out[TARGET_COLUMN] = out[SEVERITY_COLUMN].map(SEVERITY_MAP)
    out["vehicle_type"] = out["vehicle_type"].map(VEHICLE_MAP)

    invalid_mask = out[TARGET_COLUMN].isna() | out["vehicle_type"].isna()
    if invalid_mask.any():
        logger.warning("Dropping %d rows with unsupported labels", int(invalid_mask.sum()))
        out = out.loc[~invalid_mask].copy()

    out[FEATURE_COLUMNS] = out[FEATURE_COLUMNS].apply(pd.to_numeric, errors="coerce")
    numeric_invalid = out[FEATURE_COLUMNS].isna().any(axis=1)
    if numeric_invalid.any():
        logger.warning("Dropping %d rows with invalid numeric values", int(numeric_invalid.sum()))
        out = out.loc[~numeric_invalid].copy()

    out["vehicle_type"] = out["vehicle_type"].astype(int)
    out[TARGET_COLUMN] = out[TARGET_COLUMN].astype(int)
    return out


def split_and_scale(df: pd.DataFrame):
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler


def build_models() -> Dict[str, object]:
    return {
        "RandomForestClassifier": RandomForestClassifier(
            n_estimators=250,
            random_state=42,
            n_jobs=-1,
        ),
        "GradientBoostingClassifier": GradientBoostingClassifier(random_state=42),
        "XGBoostClassifier": XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="multi:softprob",
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
        ),
    }


def evaluate_model(name: str, model: object, X_test, y_test) -> Dict[str, object]:
    predictions = model.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(precision_score(y_test, predictions, average="macro", zero_division=0)),
        "recall": float(recall_score(y_test, predictions, average="macro", zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, predictions),
    }

    logger.info(
        "%s | accuracy=%.4f precision=%.4f recall=%.4f",
        name,
        metrics["accuracy"],
        metrics["precision"],
        metrics["recall"],
    )
    logger.info("%s | confusion_matrix:\n%s", name, metrics["confusion_matrix"])
    return metrics


def train_best_model(df: pd.DataFrame) -> Tuple[str, object, StandardScaler, Dict[str, object]]:
    X_train, X_test, y_train, y_test, scaler = split_and_scale(df)

    best_name = ""
    best_model = None
    best_metrics: Dict[str, object] = {}
    best_accuracy = -1.0

    for model_name, model in build_models().items():
        logger.info("Training %s", model_name)
        model.fit(X_train, y_train)
        metrics = evaluate_model(model_name, model, X_test, y_test)
        if metrics["accuracy"] > best_accuracy:
            best_accuracy = metrics["accuracy"]
            best_name = model_name
            best_model = model
            best_metrics = metrics

    if best_model is None:
        raise RuntimeError("No model was trained successfully.")

    return best_name, best_model, scaler, best_metrics


def save_artifacts(model: object, scaler: StandardScaler) -> None:
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    logger.info("Saved model to %s", MODEL_PATH)
    logger.info("Saved scaler to %s", SCALER_PATH)


def main() -> None:
    ensure_directories()
    dataset_path = ensure_canonical_dataset()

    df = load_dataset(dataset_path)
    validate_schema(df)
    processed_df = preprocess_dataframe(df)

    if processed_df.empty:
        raise RuntimeError("No valid rows remain after preprocessing.")

    best_name, best_model, scaler, best_metrics = train_best_model(processed_df)
    save_artifacts(best_model, scaler)

    logger.info("Best model: %s", best_name)
    logger.info(
        "Best metrics | accuracy=%.4f precision=%.4f recall=%.4f",
        best_metrics["accuracy"],
        best_metrics["precision"],
        best_metrics["recall"],
    )


if __name__ == "__main__":
    main()
