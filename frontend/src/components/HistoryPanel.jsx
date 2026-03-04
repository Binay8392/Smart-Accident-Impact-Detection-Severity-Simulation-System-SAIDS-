import React from 'react'
import { X, Trash2, Clock, Zap, Activity } from 'lucide-react'

const SEVERITY_META = {
    0: { label: 'No Accident', color: '#10b981', emoji: '✅' },
    1: { label: 'Minor', color: '#f59e0b', emoji: '⚠️' },
    2: { label: 'Moderate', color: '#f97316', emoji: '🔶' },
    3: { label: 'Severe', color: '#ef4444', emoji: '🚨' },
}

export default function HistoryPanel({ history, onClear, onClose }) {
    const stats = {
        total: history.length,
        severe: history.filter(h => h.severity === 3).length,
        moderate: history.filter(h => h.severity === 2).length,
        avgConf: history.length
            ? (history.reduce((a, b) => a + b.confidence, 0) / history.length).toFixed(1)
            : 0,
    }

    return (
        <div className="glass-card p-5 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-white">Accident History Log</h2>
                    <p className="text-xs text-slate-500">{history.length} simulation records</p>
                </div>
                <div className="flex gap-2">
                    {history.length > 0 && (
                        <button
                            onClick={onClear}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
                            <Trash2 size={12} />
                            Clear
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition-all">
                        <X size={12} />
                        Close
                    </button>
                </div>
            </div>

            {/* Stats */}
            {history.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                        { label: 'Total Events', val: stats.total, color: '#3b82f6' },
                        { label: 'Severe', val: stats.severe, color: '#ef4444' },
                        { label: 'Moderate', val: stats.moderate, color: '#f97316' },
                        { label: 'Avg Confidence', val: `${stats.avgConf}%`, color: '#10b981' },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="rounded-xl p-3 bg-white/3 border border-white/6">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                            <p className="text-xl font-black mt-1" style={{ color }}>{val}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* History List */}
            {history.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Activity size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No simulations yet.</p>
                    <p className="text-xs mt-1">Run a crash simulation to see records appear here.</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {history.map((item, idx) => {
                        const meta = SEVERITY_META[item.severity]
                        return (
                            <div key={item.id || idx}
                                className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/6 bg-white/2 hover:bg-white/4 transition-all">
                                {/* Severity badge */}
                                <div className="text-lg shrink-0">{meta.emoji}</div>

                                {/* Main info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold" style={{ color: meta.color }}>
                                            {meta.label}
                                        </span>
                                        <span className="text-[10px] mono text-slate-600">#{item.id}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={9} />
                                            {new Date(item.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Zap size={9} />
                                            Impact: {item.impact_intensity}/100
                                        </span>
                                    </div>
                                </div>

                                {/* Confidence */}
                                <div className="text-right shrink-0">
                                    <p className="mono text-sm font-bold text-white">{item.confidence}%</p>
                                    <p className="text-[10px] text-slate-500">confidence</p>
                                </div>

                                {/* Severity bar */}
                                <div className="w-1.5 h-10 rounded-full bg-white/5 overflow-hidden shrink-0">
                                    <div
                                        className="w-full rounded-full transition-all"
                                        style={{
                                            height: `${(item.severity / 3) * 100}%`,
                                            background: meta.color,
                                            marginTop: `${100 - (item.severity / 3) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
