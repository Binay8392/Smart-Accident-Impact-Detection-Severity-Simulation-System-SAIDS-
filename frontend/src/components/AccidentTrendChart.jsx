import React from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function AccidentTrendChart({ trends = [], loading = false, error = '' }) {
  const safeTrends = Array.isArray(trends)
    ? trends
      .filter(Boolean)
      .map((item) => ({
        month: String(item?.month || ''),
        count: Number(item?.count) || 0,
      }))
    : []

  if (loading) {
    return <div className="card p-5 text-sm text-slate-300">Loading monthly trends...</div>
  }

  if (error) {
    return <div className="card p-5 text-sm text-red-300">{error}</div>
  }

  if (!safeTrends.length) {
    return <div className="card p-5 text-sm text-slate-400">No trend data available yet.</div>
  }

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-bold text-white">Monthly Accident Trends</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={safeTrends}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
