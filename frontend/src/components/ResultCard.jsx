import React from 'react'
import { AlertTriangle, BarChart3, CheckCircle2, LoaderCircle } from 'lucide-react'
import FeatureImpactChart from './FeatureImpactChart'

const SEVERITY_META = {
  0: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.35)' },
  1: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)' },
  2: { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.14)', border: 'rgba(249,115,22,0.35)' },
  3: { label: 'Severe', color: '#ef4444', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.45)' },
}

const CLASS_ORDER = [
  { key: 0, name: 'Low' },
  { key: 1, name: 'Medium' },
  { key: 2, name: 'High' },
  { key: 3, name: 'Severe' },
]

function normalizeProbabilities(values) {
  const safeValues = [0, 0, 0, 0]
  if (!Array.isArray(values)) return safeValues

  for (let index = 0; index < Math.min(4, values.length); index += 1) {
    const parsed = Number(values[index])
    safeValues[index] = Number.isFinite(parsed) ? parsed : 0
  }
  return safeValues
}

function SeverityIndicator({ severity }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META[0]

  return (
    <div className="rounded-xl border p-4" style={{ background: meta.bg, borderColor: meta.border }}>
      <p className="label-sm">Accident Severity Indicator</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">Predicted Class</p>
          <p className="text-3xl font-black" style={{ color: meta.color }}>{meta.label}</p>
          <p className="mt-1 text-xs text-slate-400">Class value: {severity}</p>
        </div>
        <div className="h-12 w-12 rounded-full" style={{ background: meta.color, boxShadow: `0 0 18px ${meta.color}80` }} />
      </div>
    </div>
  )
}

function ProbabilityChart({ probabilities }) {
  const safeProbabilities = normalizeProbabilities(probabilities)

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 size={14} className="text-blue-400" />
        <p className="label-sm">Probability Chart</p>
      </div>

      <div className="space-y-3">
        {CLASS_ORDER.map((entry) => {
          const value = Math.max(0, Math.min(1, safeProbabilities[entry.key]))
          const percentage = Math.round(value * 100)
          const meta = SEVERITY_META[entry.key]

          return (
            <div key={entry.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span style={{ color: meta.color }}>{entry.name} probability</span>
                <span className="mono text-slate-300">{percentage}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%`, background: meta.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmergencyPanel({ severity }) {
  const severe = severity === 3

  return (
    <div className={`rounded-xl border p-4 ${severe ? 'anim-pulse' : ''}`} style={{
      background: severe ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.12)',
      borderColor: severe ? 'rgba(239,68,68,0.45)' : 'rgba(16,185,129,0.35)',
    }}>
      <p className="label-sm">Emergency Alert Panel</p>

      {severe ? (
        <div className="mt-2 flex items-center gap-2 text-red-300">
          <AlertTriangle size={16} />
          <p className="font-bold">Emergency Alert Triggered</p>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2 text-green-300">
          <CheckCircle2 size={16} />
          <p className="font-bold">No emergency trigger</p>
        </div>
      )}
    </div>
  )
}

export default function ResultCard({ result, loading = false }) {
  if (loading) {
    return (
      <div className="card flex min-h-[360px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle size={28} className="mx-auto text-blue-400 anim-spin" />
          <p className="mt-3 text-sm text-slate-300">Waiting for prediction...</p>
        </div>
      </div>
    )
  }

  if (!result || typeof result !== 'object') {
    return (
      <div className="card flex min-h-[360px] items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm font-semibold text-white">Prediction results will appear here</p>
          <p className="mt-1 text-xs text-slate-500">Run Simulate Crash to update severity and probability panels</p>
        </div>
      </div>
    )
  }

  const severity = Number(result.severity) || 0
  const safeProbabilities = Array.isArray(result?.probabilities) ? result.probabilities : []
  const safeExplanation = Array.isArray(result?.explanation) ? result.explanation : []

  return (
    <div className="card p-4 space-y-4">
      <SeverityIndicator severity={severity} />
      <ProbabilityChart probabilities={safeProbabilities} />

      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <p className="label-sm">AI Explanation - Top Factors Affecting Severity</p>
        <div className="mt-3">
          <FeatureImpactChart explanation={safeExplanation} severity={severity} />
        </div>
      </div>

      <EmergencyPanel severity={severity} />
    </div>
  )
}
