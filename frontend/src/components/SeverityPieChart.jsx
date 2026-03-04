import React from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#f97316',
  Severe: '#ef4444',
}

export default function SeverityPieChart({ data, loading = false, error = '' }) {
  if (loading) {
    return <div className="card p-5 text-sm text-slate-300">Loading severity analytics...</div>
  }

  if (error) {
    return <div className="card p-5 text-sm text-red-300">{error}</div>
  }

  const source = data && typeof data === 'object' ? data : {}
  const normalized = [
    { name: 'Low', value: Number(source?.Low) || 0 },
    { name: 'Medium', value: Number(source?.Medium) || 0 },
    { name: 'High', value: Number(source?.High) || 0 },
    { name: 'Severe', value: Number(source?.Severe) || 0 },
  ]

  const total = normalized.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    return <div className="card p-5 text-sm text-slate-400">No severity analytics data available.</div>
  }

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-bold text-white">Accident Severity Chart</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={normalized} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
            {normalized.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Count']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
