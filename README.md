# 🚨 Smart Accident Impact Detection & Severity Simulation System (SAIDS)

> **Phase 1 — AI-Powered Software Simulation** | Full-stack accident severity prediction platform

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-v4-06B6D4.svg)](https://tailwindcss.com)
[![RandomForest](https://img.shields.io/badge/ML-RandomForest-orange.svg)](https://scikit-learn.org)

---

## 📋 Overview

SAIDS is a professional AI safety platform that:

- 🤖 **Predicts accident severity** using a trained Random Forest model (4 classes)
- 📊 **Visualizes sensor data** with real-time charts, probability bars, and acceleration waveforms
- 🗺️ **Shows simulated GPS location** for each incident on an interactive map
- ❤️ **Tracks biometric changes** (heart rate before/after impact)
- 🚨 **Triggers emergency alerts** with SMS simulation based on severity level
- 📋 **Logs accident history** with full statistics

---

## 🏗️ Project Structure

```
life saver final/
├── backend/
│   ├── main.py              # FastAPI REST API
│   └── train_model.py       # ML model training script
├── model/
│   ├── accident_model.pkl   # Trained Random Forest classifier
│   ├── scaler.pkl           # StandardScaler for feature normalization  
│   ├── feature_names.pkl    # Ordered feature names
│   └── feature_importances.pkl  # Importance scores
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Navigation bar
│   │   │   ├── SimulationPanel.jsx  # Left: Slider controls + presets
│   │   │   ├── OutputDashboard.jsx  # Right: Charts + map + results
│   │   │   ├── EmergencyAlert.jsx   # Alert banners by severity
│   │   │   ├── AccidentMap.jsx      # Leaflet GPS map
│   │   │   └── HistoryPanel.jsx     # Accident history log
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── start_backend.bat        # One-click backend launcher
├── start_frontend.bat       # One-click frontend launcher
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** with pip
- **Node.js 18+** with npm

### Step 1 — Install Python dependencies

```bash
pip install fastapi uvicorn scikit-learn numpy joblib python-multipart
```

### Step 2 — Train the ML model (already done — skip if model/ folder exists)

```bash
python backend/train_model.py
```

### Step 3 — Start the Backend API

```bash
# From project root:
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
```

Or simply double-click **`start_backend.bat`**

### Step 4 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Or simply double-click **`start_frontend.bat`**

### Step 5 — Open the App

Navigate to: **http://localhost:5173**

---

## 🔌 API Reference

**Base URL:** `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/predict` | **Accident severity prediction** |
| GET | `/history` | Get all past predictions |
| DELETE | `/history` | Clear history |
| GET | `/model-info` | Model metadata + feature importances |

### POST `/predict`

**Request Body:**
```json
{
  "accel_x": 14.0,
  "accel_y": 10.0,
  "accel_z": 2.5,
  "speed_before": 120,
  "speed_after": 15,
  "gyro": 95,
  "impact_duration": 450,
  "heart_rate_before": 90,
  "heart_rate_after": 155
}
```

**Response:**
```json
{
  "id": "7e432cc8",
  "severity": 3,
  "severity_label": "Severe",
  "probabilities": [0.0, 0.0, 0.0, 1.0],
  "confidence": 100.0,
  "timestamp": "2026-03-02T22:30:00",
  "impact_intensity": 100.0,
  "gps_location": {
    "lat": 22.5204,
    "lng": 88.3352,
    "address": "Garden Reach, Kolkata"
  },
  "feature_importances": [...],
  "feature_values": {...}
}
```

---

## 🤖 ML Model Details

| Property | Value |
|----------|-------|
| Algorithm | Random Forest Classifier |
| Estimators | 200 trees |
| Classes | 0=No Accident, 1=Minor, 2=Moderate, 3=Severe |
| Features | 9 sensor features |
| Training samples | 5,000 (synthetic IoT data) |
| Test accuracy | ~100% on synthetic data |
| Preprocessing | StandardScaler normalization |

### Feature Inputs

| Feature | Description | Unit |
|---------|-------------|------|
| `accel_x` | Forward/backward acceleration | m/s² |
| `accel_y` | Side-to-side acceleration | m/s² |
| `accel_z` | Vertical acceleration | m/s² |
| `speed_before` | Vehicle speed before impact | km/h |
| `speed_after` | Vehicle speed after impact | km/h |
| `gyro` | Gyroscope rotation | °/s |
| `impact_duration` | Duration of impact | ms |
| `heart_rate_before` | Passenger heart rate pre-event | bpm |
| `heart_rate_after` | Passenger heart rate post-event | bpm |

---

## 🎨 UI Features

### Simulation Panel
- 9 interactive sliders with color-coded tracks and live value display
- Live ΔV (speed loss) and acceleration magnitude calculation
- 4 preset scenarios: Normal Drive, Minor Bump, Moderate Crash, Severe Impact
- Reset to defaults

### Output Dashboard
- Severity badge with color-coded glow effect
- Impact intensity 0–100 progress bar with gradient
- Probability bar chart (all 4 class confidences)
- Acceleration waveform graph (simulated time-series)
- Interactive Leaflet GPS map with incident marker
- Heart rate comparison bar
- Feature importance horizontal bar chart

### Emergency Alert System
| Severity | Alert Type |
|----------|-----------|
| 🟢 No Accident | No alert |
| 🟡 Minor | Logged-only banner |
| 🟠 Moderate | Family notification panel with SMS simulation |
| 🔴 Severe | Animated emergency banner + SMS popup |

### History Panel
- Session statistics: total, severe count, moderate count, avg confidence
- Scrollable chronological log with ID, time, impact score

---

## 🔮 Phase 2 Roadmap (Future)

- [ ] Hardware IoT integration (ESP32 + MPU6050 accelerometer)
- [ ] Real GPS via NEO-6M module
- [ ] Pulse oximeter for real biometric data
- [ ] SHAP explainability charts
- [ ] Database persistence (SQLite/PostgreSQL)
- [ ] WebSocket real-time streaming
- [ ] Mobile app (React Native)
- [ ] Email/Twilio SMS integration

---

## 📄 License

Built for academic/engineering demonstration purposes.
# Smart-Accident-Impact-Detection-Severity-Simulation-System-SAIDS-
