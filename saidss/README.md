# SAIDSS - Smart Accident Impact Detection & Severity System

SAIDSS is a Phase-1 machine learning backend that predicts accident severity from sensor-based features.

## Project Structure

```text
saidss/
|-- dataset/
|   |-- accident_dataset_with_severity_95_97_accuracy.xlsx
|   `-- accident_dataset_with_severity.xlsx
|-- models/
|   |-- accident_model.pkl
|   `-- scaler.pkl
|-- backend/
|   `-- main.py
|-- train_model.py
|-- requirements.txt
`-- README.md
```

## 1) Install Dependencies

```bash
pip install -r requirements.txt
```

## 2) Train the Model

Training script flow:
- Loads dataset using pandas
- Converts `Severity` and `vehicle_type` to numeric classes
- Splits features/target
- Performs train-test split (80/20)
- Applies `StandardScaler`
- Trains and compares:
  - `RandomForestClassifier`
  - `GradientBoostingClassifier`
  - `XGBoostClassifier`
- Prints:
  - accuracy
  - precision
  - recall
  - confusion matrix
- Selects the best model by accuracy
- Saves artifacts:
  - `models/accident_model.pkl`
  - `models/scaler.pkl`

Run training:

```bash
python train_model.py
```

## 3) Start API Server

```bash
uvicorn backend.main:app --reload
```

## 4) Test Prediction Endpoint

Endpoint:

```text
POST /predict
```

Sample request:

```bash
curl -X POST "http://127.0.0.1:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "resultant_accel": 30.5,
    "max_resultant_accel": 58.2,
    "avg_resultant_accel": 28.9,
    "resultant_jerk": 410.0,
    "impact_duration": 0.63,
    "area_under_accel_curve": 19.8,
    "delta_speed": 46.3,
    "impact_energy_estimate": 54000.0,
    "pre_crash_speed_avg": 62.0,
    "max_gyro_value": 9.8,
    "angular_acceleration": 15.1,
    "tilt_angle_change": 24.5,
    "heart_rate_change": 26.0,
    "heart_rate_variability": 47.0,
    "fall_detected": 0,
    "vehicle_type": "car",
    "airbag_triggered": 1,
    "seatbelt_status": 1
  }'
```

Sample response:

```json
{
  "severity": 2,
  "probabilities": [0.02, 0.18, 0.65, 0.15]
}
```

## Label Encoding

Severity:
- Low = 0
- Medium = 1
- High = 2
- Severe = 3

Vehicle type:
- bike = 0
- car = 1
- scooter = 2

## Notes

- API validates incoming payload and rejects unknown fields.
- If model artifacts are missing, run `python train_model.py` first.
