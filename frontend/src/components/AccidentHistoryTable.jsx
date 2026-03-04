import React from 'react'

const SEVERITY_COLORS = {
  0: '#10b981',
  1: '#f59e0b',
  2: '#f97316',
  3: '#ef4444',
}

const SEVERITY_LABELS = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Severe',
}

function formatVehicle(value) {
  const map = { 0: 'Bike', 1: 'Car', 2: 'Scooter' }
  return map[value] || String(value)
}

export default function AccidentHistoryTable({ rows = [], loading = false, error = '' }) {
  const normalizedRows = Array.isArray(rows) ? rows.filter(Boolean) : []

  if (loading) {
    return (
      <div className="card p-5">
        <p className="text-sm text-slate-300">Loading accident history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-5">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    )
  }

  if (!normalizedRows.length) {
    return (
      <div className="card p-5">
        <p className="text-sm text-slate-400">No accident history exists yet.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/6 px-5 py-3">
        <h3 className="text-sm font-bold text-white">Accident History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs text-slate-300">
          <thead className="bg-white/5 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Delta Speed</th>
              <th className="px-4 py-3">Impact Duration</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Probabilities</th>
            </tr>
          </thead>
          <tbody>
            {normalizedRows.map((row) => {
              const severity = Number(row.severity) || 0
              const color = SEVERITY_COLORS[severity] || '#94a3b8'
              const label = SEVERITY_LABELS[severity] || 'Unknown'
              const timestamp = row?.timestamp ? new Date(row.timestamp).toLocaleString() : 'No timestamp'
              const probabilities = Array.isArray(row?.probabilities) ? row.probabilities : []
              return (
                <tr key={row.id || row.timestamp} className="border-t border-white/6">
                  <td className="px-4 py-3">{timestamp}</td>
                  <td className="px-4 py-3">{formatVehicle(row.vehicle_type)}</td>
                  <td className="px-4 py-3">{row.delta_speed}</td>
                  <td className="px-4 py-3">{row.impact_duration}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-1 font-semibold" style={{ color, background: `${color}20` }}>
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 mono">{probabilities.map((value) => Number(value).toFixed(2)).join(' | ')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
