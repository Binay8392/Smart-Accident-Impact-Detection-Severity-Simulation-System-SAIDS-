import React, { useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, ReferenceLine, Cell
} from 'recharts'
import { Brain, MapPin, Heart, TrendingUp, BarChart2, Activity, Cpu } from 'lucide-react'
import AccidentMap from './AccidentMap'

const SEVERITY_META = {
    0: {
        label: 'No Accident', color: '#10b981',
        bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)',
        cls: 'severity-none', emoji: '✅',
        desc: 'Normal driving conditions detected'
    },
    1: {
        label: 'Minor', color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
        cls: 'severity-minor', emoji: '⚠️',
        desc: 'Low-impact event — logged for records'
    },
    2: {
        label: 'Moderate', color: '#f97316',
        bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)',
        cls: 'severity-moderate', emoji: '🔶',
        desc: 'Significant impact — family notified'
    },
    3: {
        label: 'Severe', color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
        cls: 'severity-severe', emoji: '🚨',
        desc: 'Critical impact — emergency services alerted!'
    },
}

const CLASS_NAMES = ['No Accident', 'Minor', 'Moderate', 'Severe']
const CLASS_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']

function SeverityCard({ severity, label, confidence, desc, meta }) {
    return (
        <div className="rounded-xl p-4 border transition-all animate-slide-up"
            style={{ background: meta.bg, borderColor: meta.border }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Predicted Severity</p>
                        <p className={`text-2xl font-black ${meta.cls}`}>{label}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Confidence</p>
                    <p className="mono text-2xl font-black" style={{ color: meta.color }}>{confidence}%</p>
                </div>
            </div>
            <p className="text-xs text-slate-400">{desc}</p>
        </div>
    )
}

function ProbabilityChart({ probabilities }) {
    const data = CLASS_NAMES.map((name, i) => ({
        name: name.replace(' ', '\n'),
        prob: Math.round(probabilities[i] * 100),
        color: CLASS_COLORS[i],
    }))

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null
        return (
            <div className="glass-card px-3 py-2 text-xs">
                <p className="font-medium text-white">{payload[0].payload.name.replace('\n', ' ')}</p>
                <p className="text-slate-300">{payload[0].value}% probability</p>
            </div>
        )
    }

    return (
        <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Class Probabilities</p>
            <ResponsiveContainer width="100%" height={120}>
                <BarChart data={data} barCategoryGap="25%">
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                        {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

function AccelerationGraph({ featureValues }) {
    const { accel_x, accel_y, accel_z, impact_duration } = featureValues
    const points = 20
    const data = Array.from({ length: points }, (_, i) => {
        const t = (i / (points - 1)) * impact_duration
        const factor = Math.exp(-(((i - points * 0.4) ** 2) / (2 * (points * 0.15) ** 2)))
        return {
            t: Math.round(t),
            ax: parseFloat((accel_x * factor + Math.random() * 0.3).toFixed(2)),
            ay: parseFloat((accel_y * factor + Math.random() * 0.3).toFixed(2)),
            az: parseFloat((accel_z * (1 - factor * 0.4) + Math.random() * 0.3).toFixed(2)),
        }
    })

    return (
        <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                Acceleration vs Time (simulated waveform)
            </p>
            <ResponsiveContainer width="100%" height={120}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false}
                        tickLine={false} label={{ value: 'ms', position: 'insideRight', fill: '#64748b', fontSize: 8 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                        contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                        labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#94a3b8' }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                    <Line dataKey="ax" stroke="#3b82f6" strokeWidth={2} dot={false} name="X" />
                    <Line dataKey="ay" stroke="#06b6d4" strokeWidth={2} dot={false} name="Y" />
                    <Line dataKey="az" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Z" />
                </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-1">
                {[['X', '#3b82f6'], ['Y', '#06b6d4'], ['Z', '#8b5cf6']].map(([name, color]) => (
                    <span key={name} className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span className="w-3 h-0.5 inline-block" style={{ background: color }} />
                        Accel {name}
                    </span>
                ))}
            </div>
        </div>
    )
}

function HeartRateViz({ before, after }) {
    const delta = after - before
    const isUp = delta > 0
    const maxBPM = Math.max(before, after, 220)
    const pctBefore = (before / maxBPM) * 100
    const pctAfter = (after / maxBPM) * 100

    return (
        <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Heart Rate Comparison</p>
            <div className="space-y-2">
                {[
                    { label: 'Before', val: before, pct: pctBefore, color: '#10b981' },
                    { label: 'After', val: after, pct: pctAfter, color: after > 120 ? '#ef4444' : after > 100 ? '#f97316' : '#10b981' },
                ].map(({ label, val, pct, color }) => (
                    <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400 flex items-center gap-1">
                                <Heart size={10} style={{ color }} className={label === 'After' && after > 100 ? 'animate-heartbeat' : ''} />
                                {label}
                            </span>
                            <span className="mono font-bold" style={{ color }}>{val} bpm</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}80` }}
                            />
                        </div>
                    </div>
                ))}
                <p className={`text-xs font-medium mt-1 ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(delta).toFixed(0)} bpm change
                    {after > 120 && ' — signs of physiological stress'}
                </p>
            </div>
        </div>
    )
}

function FeatureImportanceChart({ importances }) {
    const top6 = importances.slice(0, 6)
    const data = top6.map(f => ({
        name: f.feature.replace('_', ' '),
        value: parseFloat(f.importance.toFixed(1)),
    }))

    return (
        <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Feature Importance (Model)</p>
            <ResponsiveContainer width="100%" height={130}>
                <BarChart data={data} layout="vertical" barCategoryGap="15%">
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                    />
                    <Tooltip
                        contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                        formatter={v => [`${v}%`, 'Importance']}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} fillOpacity={0.8}>
                        {data.map((_, i) => (
                            <Cell key={i} fill={`hsl(${210 + i * 15}, 80%, 60%)`} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default function OutputDashboard({ result, loading }) {
    if (loading) {
        return (
            <div className="glass-card flex items-center justify-center min-h-[500px]">
                <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
                        <Brain size={32} className="text-blue-400 absolute inset-0 m-auto" />
                    </div>
                    <div>
                        <p className="text-white font-semibold">Analyzing sensor data...</p>
                        <p className="text-slate-400 text-sm mt-1">Running ML inference</p>
                    </div>
                    <div className="flex gap-1 justify-center">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!result) {
        return (
            <div className="glass-card flex items-center justify-center min-h-[500px]">
                <div className="text-center space-y-4 px-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <Activity size={36} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">Ready for Analysis</h3>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                            Adjust the sensor parameters on the left panel and click{' '}
                            <strong className="text-blue-400">Simulate Crash</strong> to run AI prediction.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        {[
                            ['Random Forest', 'ML Model', '#3b82f6'],
                            ['4 Classes', 'Severity', '#10b981'],
                            ['9 Features', 'Sensors', '#f59e0b'],
                            ['Real-time', 'Inference', '#8b5cf6'],
                        ].map(([val, lbl, color]) => (
                            <div key={lbl} className="px-3 py-2 rounded-lg bg-white/3 border border-white/6">
                                <p className="font-bold" style={{ color }}>{val}</p>
                                <p className="text-slate-500">{lbl}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const meta = SEVERITY_META[result.severity]

    return (
        <div className="glass-card overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Analysis Results
                    </h2>
                    <span className="text-[10px] mono text-slate-500">ID: {result.id}</span>
                </div>

                {/* Severity Card */}
                <SeverityCard
                    severity={result.severity}
                    label={result.severity_label}
                    confidence={result.confidence}
                    desc={meta.desc}
                    meta={meta}
                />

                {/* Impact Intensity */}
                <div className="rounded-xl p-4 bg-white/3 border border-white/6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-400">Impact Intensity Score</p>
                        <p className="mono text-sm font-bold text-white">{result.impact_intensity} / 100</p>
                    </div>
                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                                width: `${Math.min(100, result.impact_intensity)}%`,
                                background: `linear-gradient(90deg, #10b981, #f59e0b, #f97316, #ef4444)`,
                                boxShadow: `0 0 12px ${meta.color}60`,
                            }}
                        />
                    </div>
                </div>

                {/* Probability Chart */}
                <div className="rounded-xl p-4 bg-white/3 border border-white/6">
                    <ProbabilityChart probabilities={result.probabilities} />
                </div>

                {/* Acceleration Graph */}
                <div className="rounded-xl p-4 bg-white/3 border border-white/6">
                    <AccelerationGraph featureValues={result.feature_values} />
                </div>

                {/* Map + Heart Rate Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Map */}
                    <div className="rounded-xl p-4 bg-white/3 border border-white/6">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin size={13} className="text-cyan-400" />
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">GPS Location</p>
                        </div>
                        <AccidentMap location={result.gps_location} severity={result.severity} />
                        <p className="text-[10px] text-slate-500 mt-2 truncate">{result.gps_location.address}</p>
                    </div>

                    {/* Heart Rate */}
                    <div className="rounded-xl p-4 bg-white/3 border border-white/6">
                        <HeartRateViz
                            before={result.feature_values.heart_rate_before}
                            after={result.feature_values.heart_rate_after}
                        />
                    </div>
                </div>

                {/* Feature Importance */}
                <div className="rounded-xl p-4 bg-white/3 border border-white/6">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu size={13} className="text-purple-400" />
                        <FeatureImportanceChart importances={result.feature_importances} />
                    </div>
                </div>

                {/* Timestamp */}
                <p className="text-[10px] text-slate-600 text-center mono">
                    Analyzed at {new Date(result.timestamp).toLocaleString()}
                </p>
            </div>
        </div>
    )
}
