import React from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const SEVERITY_COLORS = {
  0: '#10b981',
  1: '#f59e0b',
  2: '#f97316',
  3: '#ef4444',
}

export default function FeatureImpactChart({ explanation = [], severity = 0 }) {
  const safeExplanation = Array.isArray(explanation)
    ? explanation
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        feature: String(item?.feature || 'unknown'),
        impact: Number(item?.impact) || 0,
      }))
      .sort((a, b) => b.impact - a.impact)
    : []

  if (safeExplanation.length === 0) {
    return <p className="text-sm text-slate-400">No explanation available</p>
  }

  const totalImpact = safeExplanation.reduce((sum, item) => sum + Number(item.impact || 0), 0)
  const chartData = safeExplanation.map((item) => {
    const impact = Number(item.impact || 0)
    return {
      feature: String(item.feature || 'unknown'),
      impact,
      percentage: totalImpact > 0 ? Number(((impact / totalImpact) * 100).toFixed(2)) : 0,
    }
  })

  const barColor = SEVERITY_COLORS[severity] || '#3b82f6'

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="feature"
            type="category"
            width={160}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name, payload) => {
              if (name === 'percentage') {
                return [`${Number(value).toFixed(2)}%`, 'Share']
              }
              return [`${Number(payload?.payload?.impact || 0).toFixed(6)}`, 'Impact']
            }}
            contentStyle={{
              background: 'rgba(2,12,27,0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
          />
          <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.feature} fill={barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
