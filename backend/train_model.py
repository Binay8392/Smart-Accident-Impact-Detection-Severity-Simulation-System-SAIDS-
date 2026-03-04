"""
SAIDSS — Smart Accident Impact Detection & Safety System
Multi-incident-type ML model trainer (Phase 1)

Supports 7 incident categories:
  0 = Bike Accident
  1 = Car Accident
  2 = Truck Accident
  3 = Pedestrian Fall
  4 = Industrial Accident
  5 = Elderly Fall
  6 = Sports Impact

Severity labels (per incident):
  0 = No Incident / Normal
  1 = Minor
  2 = Moderate
  3 = Severe
"""

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import os

np.random.seed(42)

INCIDENT_TYPES = {
    0: "Bike Accident",
    1: "Car Accident",
    2: "Truck Accident",
    3: "Pedestrian Fall",
    4: "Industrial Accident",
    5: "Elderly Fall",
    6: "Sports Impact",
}

# Feature names (10 features including incident_type)
FEATURE_NAMES = [
    "incident_type",
    "accel_x", "accel_y", "accel_z",
    "speed_before", "speed_after",
    "gyro", "impact_duration",
    "heart_rate_before", "heart_rate_after",
]


def gen_class(n, inc_type, accel_scale, speed_range, speed_drop_range,
              gyro_scale, dur_range, hr_delta, hr_base=78):
    """Generate n samples for a given incident type and implied severity."""
    ax = np.random.normal(accel_scale[0], accel_scale[0] * 0.3 + 0.2, n)
    ay = np.random.normal(accel_scale[1], accel_scale[1] * 0.3 + 0.2, n)
    az = np.random.normal(accel_scale[2], abs(accel_scale[2]) * 0.2 + 0.3, n)
    sb = np.random.uniform(*speed_range, n)
    drop = np.random.uniform(*speed_drop_range, n)
    sa = np.maximum(0, sb - drop)
    gy = np.random.normal(gyro_scale, gyro_scale * 0.35 + 1, n)
    dur = np.random.uniform(*dur_range, n)
    hr_b = np.random.normal(hr_base, 8, n)
    hr_a = hr_b + np.random.normal(hr_delta, max(2, hr_delta * 0.3), n)
    hr_a = np.clip(hr_a, 30, 280)
    it = np.full(n, inc_type, dtype=float)
    return np.column_stack([it, ax, ay, az, sb, sa, gy, dur, hr_b, hr_a])


def build_dataset():
    X_all, y_all = [], []
    per = 500  # samples per (incident_type × severity) combination

    # ── Bike Accident ─────────────────────────────────────────────────────────
    inc = 0
    X_all.append(gen_class(per, inc, [0.3,0.2,9.8],  [0,20],   [0,2],    2,  [0,15],   2,  72))
    y_all.extend([0]*per)
    X_all.append(gen_class(per, inc, [3,2,8],        [15,45],  [5,15],   18, [30,80],  18, 78))
    y_all.extend([1]*per)
    X_all.append(gen_class(per, inc, [7,5,6],        [30,70],  [15,35],  40, [80,200], 35, 82))
    y_all.extend([2]*per)
    X_all.append(gen_class(per, inc, [13,10,3],      [50,100], [30,80],  75, [200,500],60, 88))
    y_all.extend([3]*per)

    # ── Car Accident ──────────────────────────────────────────────────────────
    inc = 1
    X_all.append(gen_class(per, inc, [0.5,0.3,9.8],  [0,60],   [0,3],    3,  [0,10],   3,  75))
    y_all.extend([0]*per)
    X_all.append(gen_class(per, inc, [2.5,1.8,8.5],  [20,60],  [5,20],   15, [30,100], 15, 80))
    y_all.extend([1]*per)
    X_all.append(gen_class(per, inc, [6,4,6],         [40,100], [20,50],  45, [100,300],35, 85))
    y_all.extend([2]*per)
    X_all.append(gen_class(per, inc, [14,10,2.5],     [60,150], [40,100], 95, [200,600],60, 90))
    y_all.extend([3]*per)

    # ── Truck Accident ────────────────────────────────────────────────────────
    inc = 2
    X_all.append(gen_class(per, inc, [0.4,0.2,9.8],  [0,80],   [0,4],    2,  [0,10],   2,  73))
    y_all.extend([0]*per)
    X_all.append(gen_class(per, inc, [4,3,8],         [20,70],  [5,25],   20, [40,120], 18, 78))
    y_all.extend([1]*per)
    X_all.append(gen_class(per, inc, [8,6,5.5],       [40,110], [25,60],  50, [120,350],40, 85))
    y_all.extend([2]*per)
    X_all.append(gen_class(per, inc, [16,12,2],       [70,180], [50,130], 110,[300,800],65, 92))
    y_all.extend([3]*per)

    # ── Pedestrian Fall ───────────────────────────────────────────────────────
    inc = 3
    X_all.append(gen_class(per, inc, [0.1,0.1,9.8],  [0,5],    [0,1],    1,  [0,5],    1,  70))
    y_all.extend([0]*per)
    X_all.append(gen_class(per, inc, [2,1.5,8],       [0,5],    [0,5],    12, [20,60],  12, 75))
    y_all.extend([1]*per)
    X_all.append(gen_class(per, inc, [4.5,3.5,6.5],   [0,5],    [0,5],    28, [50,150], 28, 80))
    y_all.extend([2]*per)
    X_all.append(gen_class(per, inc, [9,7,4],          [0,5],    [0,5],    60, [120,400],50, 88))
    y_all.extend([3]*per)

    # ── Industrial Accident ───────────────────────────────────────────────────
    inc = 4
    X_all.append(gen_class(per, inc, [0.5,0.4,9.8],  [0,10],   [0,2],    3,  [0,10],   2,  76))
    y_all.extend([0]*per)
    X_all.append(gen_class(per, inc, [3.5,2.5,8],     [5,20],   [2,10],   22, [30,90],  20, 82))
    y_all.extend([1]*per)
    X_all.append(gen_class(per, inc, [7,5.5,6],        [10,30],  [5,20],   50, [90,250], 38, 88))
    y_all.extend([2]*per)
    X_all.append(gen_class(per, inc, [14,12,3],        [10,30],  [5,25],   100,[250,700],65, 95))
    y_all.extend([3]*per)

    # ── Elderly Fall ──────────────────────────────────────────────────────────
    inc = 5
    X_all.append(gen_class(per, inc, [0.1,0.1,9.8],  [0,4],    [0,1],    1,  [0,5],    2,  72))
    y_all.extend([0]*per)
    X_all.append(gen_class(per, inc, [1.5,1,8.5],     [0,4],    [0,4],    8,  [15,50],  15, 78))
    y_all.extend([1]*per)
    X_all.append(gen_class(per, inc, [3.5,2.5,7],      [0,4],    [0,4],    20, [40,130], 30, 85))
    y_all.extend([2]*per)
    X_all.append(gen_class(per, inc, [7,5,5],           [0,4],    [0,4],    45, [100,350],55, 95))
    y_all.extend([3]*per)

    # ── Sports Impact ─────────────────────────────────────────────────────────
    inc = 6
    X_all.append(gen_class(per, inc, [0.5,0.4,9.8],  [0,25],   [0,2],    4,  [0,10],   3,  90))   # elevated baseline HR
    y_all.extend([0]*per)
    X_all.append(gen_class(per, inc, [3,2,8],          [5,30],   [1,10],   20, [20,70],  15, 110))
    y_all.extend([1]*per)
    X_all.append(gen_class(per, inc, [6,4.5,6.5],      [10,35],  [5,20],   45, [70,200], 30, 120))
    y_all.extend([2]*per)
    X_all.append(gen_class(per, inc, [12,9,3.5],        [15,40],  [10,35],  90, [180,500],55, 135))
    y_all.extend([3]*per)

    return np.vstack(X_all), np.array(y_all)


X, y = build_dataset()
print(f"Dataset: {X.shape[0]} samples, {X.shape[1]} features")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=20,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced',
)
model.fit(X_train_s, y_train)

y_pred = model.predict(X_test_s)
print("=== Model Performance ===")
print(classification_report(y_test, y_pred,
      target_names=["No Incident","Minor","Moderate","Severe"]))
print(f"Test Accuracy: {model.score(X_test_s, y_test):.4f}")

importances = model.feature_importances_.tolist()
print("\n=== Feature Importances ===")
for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1]):
    print(f"  {name}: {imp:.4f}")

os.makedirs("model", exist_ok=True)
joblib.dump(model,        "model/accident_model.pkl")
joblib.dump(scaler,       "model/scaler.pkl")
joblib.dump(FEATURE_NAMES,"model/feature_names.pkl")
joblib.dump(importances,  "model/feature_importances.pkl")
joblib.dump(INCIDENT_TYPES,"model/incident_types.pkl")

print("\n✅ Multi-type SAIDSS model saved to model/")
