import React, { useMemo, useState } from 'react'
import { AlertTriangle, LoaderCircle, RotateCcw, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { predictSeverity } from '../services/saidssApi'

const VEHICLE_OPTIONS = [
  { value: 0, label: 'Bike' },
  { value: 1, label: 'Car' },
  { value: 2, label: 'Scooter' },
]

const BINARY_OPTIONS = [
  { value: 0, label: 'No' },
  { value: 1, label: 'Yes' },
]

const INITIAL_FORM = {
  resultant_accel: 32,
  max_resultant_accel: 60,
  avg_resultant_accel: 35,
  resultant_jerk: 300,
  impact_duration: 0.5,
  area_under_accel_curve: 20,
  delta_speed: 40,
  impact_energy_estimate: 50000,
  pre_crash_speed_avg: 60,
  max_gyro_value: 7,
  angular_acceleration: 12,
  tilt_angle_change: 25,
  heart_rate_change: 30,
  heart_rate_variability: 40,
  fall_detected: 0,
  vehicle_type: 1,
  airbag_triggered: 0,
  seatbelt_status: 1,
}

const NUMERIC_FIELDS = [
  { key: 'resultant_accel', label: 'Resultant Accel', step: 0.1 },
  { key: 'max_resultant_accel', label: 'Max Resultant Accel', step: 0.1 },
  { key: 'avg_resultant_accel', label: 'Avg Resultant Accel', step: 0.1 },
  { key: 'resultant_jerk', label: 'Resultant Jerk', step: 0.1 },
  { key: 'impact_duration', label: 'Impact Duration', step: 0.01 },
  { key: 'area_under_accel_curve', label: 'Area Under Accel Curve', step: 0.1 },
  { key: 'delta_speed', label: 'Delta Speed', step: 0.1 },
  { key: 'impact_energy_estimate', label: 'Impact Energy Estimate', step: 1 },
  { key: 'pre_crash_speed_avg', label: 'Pre-Crash Speed Avg', step: 0.1 },
  { key: 'max_gyro_value', label: 'Max Gyro Value', step: 0.1 },
  { key: 'angular_acceleration', label: 'Angular Acceleration', step: 0.1 },
  { key: 'tilt_angle_change', label: 'Tilt Angle Change', step: 0.1 },
  { key: 'heart_rate_change', label: 'Heart Rate Change', step: 0.1 },
  { key: 'heart_rate_variability', label: 'Heart Rate Variability', step: 0.1 },
]

function FieldInput({ field, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-400">{field.label}</span>
      <input
        type="number"
        step={field.step}
        value={value}
        onChange={(event) => onChange(field.key, event.target.value)}
        className="w-full rounded-lg border border-white/12 bg-white/4 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/80"
      />
    </label>
  )
}

function buildPayload(form) {
  return {
    resultant_accel: Number(form.resultant_accel),
    max_resultant_accel: Number(form.max_resultant_accel),
    avg_resultant_accel: Number(form.avg_resultant_accel),
    resultant_jerk: Number(form.resultant_jerk),
    impact_duration: Number(form.impact_duration),
    area_under_accel_curve: Number(form.area_under_accel_curve),
    delta_speed: Number(form.delta_speed),
    impact_energy_estimate: Number(form.impact_energy_estimate),
    pre_crash_speed_avg: Number(form.pre_crash_speed_avg),
    max_gyro_value: Number(form.max_gyro_value),
    angular_acceleration: Number(form.angular_acceleration),
    tilt_angle_change: Number(form.tilt_angle_change),
    heart_rate_change: Number(form.heart_rate_change),
    heart_rate_variability: Number(form.heart_rate_variability),
    fall_detected: Number(form.fall_detected),
    vehicle_type: Number(form.vehicle_type),
    airbag_triggered: Number(form.airbag_triggered),
    seatbelt_status: Number(form.seatbelt_status),
  }
}

function normalizeProbabilities(probabilities) {
  const padded = [0, 0, 0, 0]
  if (!Array.isArray(probabilities)) {
    return padded
  }

  for (let index = 0; index < Math.min(4, probabilities.length); index += 1) {
    const value = Number(probabilities[index])
    padded[index] = Number.isFinite(value) ? value : 0
  }
  return padded
}

export default function SimPanel({ onResult, onLoadingChange }) {
  const { user } = useAuth()
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const severityHint = useMemo(() => {
    const riskScore = Number(form.resultant_accel) + Number(form.delta_speed) + Number(form.max_resultant_accel)
    if (riskScore > 140) return 'High risk input profile'
    if (riskScore > 90) return 'Moderate risk input profile'
    return 'Low risk input profile'
  }, [form])

  const setField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setError('')
  }

  const handleSimulate = async () => {
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const payload = buildPayload(form)
      const response = await predictSeverity(payload)
      const normalized = normalizeProbabilities(response.probabilities)

      if (typeof onResult === 'function') {
        onResult({
          ...(response || {}),
          probabilities: normalized,
          requestPayload: payload,
          triggeredBy: user?.name || 'Unknown User',
          timestamp: response?.timestamp || new Date().toISOString(),
        })
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
        requestError?.message ||
        'Prediction request failed. Please check API availability.'
      )
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <div className="card flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/6 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Crash Simulation Form</h3>
            <p className="mt-1 text-xs text-slate-500">Fill all sensor values and trigger ML inference</p>
          </div>
          <button onClick={resetForm} className="btn-ghost px-2.5 py-1.5 text-xs">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-400">{severityHint}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {NUMERIC_FIELDS.map((field) => (
            <FieldInput key={field.key} field={field} value={form[field.key]} onChange={setField} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Vehicle Type</span>
            <select
              value={form.vehicle_type}
              onChange={(event) => setField('vehicle_type', event.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/4 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/80"
            >
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label} ({option.value})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Fall Detected</span>
            <select
              value={form.fall_detected}
              onChange={(event) => setField('fall_detected', event.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/4 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/80"
            >
              {BINARY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Airbag Triggered</span>
            <select
              value={form.airbag_triggered}
              onChange={(event) => setField('airbag_triggered', event.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/4 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/80"
            >
              {BINARY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Seatbelt Status</span>
            <select
              value={form.seatbelt_status}
              onChange={(event) => setField('seatbelt_status', event.target.value)}
              className="w-full rounded-lg border border-white/12 bg-white/4 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-blue-400/80"
            >
              {BINARY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="border-t border-white/6 p-5">
        <button onClick={handleSimulate} disabled={loading} className="btn-shimmer flex w-full items-center justify-center gap-2 py-3.5 text-sm">
          {loading ? (
            <>
              <LoaderCircle size={16} className="anim-spin" />
              Running prediction...
            </>
          ) : (
            <>
              <Zap size={16} />
              Simulate Crash
            </>
          )}
        </button>
      </div>
    </div>
  )
}
