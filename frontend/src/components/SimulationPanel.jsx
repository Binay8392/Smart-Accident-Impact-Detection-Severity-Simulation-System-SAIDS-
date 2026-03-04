import React from 'react'
import {
    Zap, ArrowRight, RotateCcw, AlertTriangle,
    Gauge, Wind, Clock, Heart, Activity
} from 'lucide-react'

const SLIDERS = [
    {
        key: 'accel_x', label: 'Acceleration X', unit: 'm/s²',
        min: -20, max: 20, step: 0.1,
        icon: Activity, color: '#3b82f6',
        tooltip: 'Forward/backward acceleration force'
    },
    {
        key: 'accel_y', label: 'Acceleration Y', unit: 'm/s²',
        min: -20, max: 20, step: 0.1,
        icon: Activity, color: '#06b6d4',
        tooltip: 'Side-to-side acceleration force'
    },
    {
        key: 'accel_z', label: 'Acceleration Z', unit: 'm/s²',
        min: -20, max: 20, step: 0.1,
        icon: Activity, color: '#8b5cf6',
        tooltip: 'Vertical acceleration (9.8 = normal gravity)'
    },
    {
        key: 'speed_before', label: 'Speed Before', unit: 'km/h',
        min: 0, max: 200, step: 1,
        icon: Gauge, color: '#10b981',
        tooltip: 'Vehicle speed before impact'
    },
    {
        key: 'speed_after', label: 'Speed After', unit: 'km/h',
        min: 0, max: 200, step: 1,
        icon: Gauge, color: '#f59e0b',
        tooltip: 'Vehicle speed after impact'
    },
    {
        key: 'gyro', label: 'Gyroscope Rotation', unit: '°/s',
        min: -180, max: 180, step: 1,
        icon: Wind, color: '#f97316',
        tooltip: 'Rotational velocity of the vehicle'
    },
    {
        key: 'impact_duration', label: 'Impact Duration', unit: 'ms',
        min: 0, max: 1000, step: 5,
        icon: Clock, color: '#ec4899',
        tooltip: 'How long the impact force lasted'
    },
    {
        key: 'heart_rate_before', label: 'Heart Rate Before', unit: 'bpm',
        min: 40, max: 180, step: 1,
        icon: Heart, color: '#10b981',
        tooltip: 'Passenger heart rate pre-event'
    },
    {
        key: 'heart_rate_after', label: 'Heart Rate After', unit: 'bpm',
        min: 40, max: 220, step: 1,
        icon: Heart, color: '#ef4444',
        tooltip: 'Passenger heart rate post-event'
    },
]

const PRESETS = {
    'Normal Drive': {
        accel_x: 0.2, accel_y: 0.1, accel_z: 9.8,
        speed_before: 30, speed_after: 30,
        gyro: 3, impact_duration: 5,
        heart_rate_before: 72, heart_rate_after: 74,
    },
    'Minor Bump': {
        accel_x: 2.5, accel_y: 1.8, accel_z: 8.5,
        speed_before: 40, speed_after: 32,
        gyro: 15, impact_duration: 60,
        heart_rate_before: 80, heart_rate_after: 95,
    },
    'Moderate Crash': {
        accel_x: 6.0, accel_y: 4.5, accel_z: 6.0,
        speed_before: 70, speed_after: 35,
        gyro: 45, impact_duration: 180,
        heart_rate_before: 85, heart_rate_after: 120,
    },
    'Severe Impact': {
        accel_x: 14.0, accel_y: 10.0, accel_z: 2.5,
        speed_before: 120, speed_after: 15,
        gyro: 95, impact_duration: 450,
        heart_rate_before: 90, heart_rate_after: 155,
    },
}

function SliderRow({ config, value, onChange }) {
    const { key, label, unit, min, max, step, icon: Icon, color, tooltip } = config
    const pct = ((value - min) / (max - min)) * 100

    return (
        <div className="group py-2">
            <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color }} />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="mono text-xs font-semibold" style={{ color }}>
                        {Number(value).toFixed(key.includes('duration') || key.includes('speed') || key.includes('heart') ? 0 : 1)}
                    </span>
                    <span className="text-xs text-slate-500">{unit}</span>
                </div>
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min} max={max} step={step}
                    value={value}
                    onChange={e => onChange(key, parseFloat(e.target.value))}
                    className="w-full"
                    style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`
                    }}
                />
            </div>
        </div>
    )
}

export default function SimulationPanel({ values, onChange, onSimulate, loading, error }) {
    const handleChange = (key, val) => onChange(prev => ({ ...prev, [key]: val }))

    const applyPreset = (preset) => {
        onChange(PRESETS[preset])
    }

    const reset = () => {
        onChange({
            accel_x: 0.5, accel_y: 0.3, accel_z: 9.8,
            speed_before: 40, speed_after: 35,
            gyro: 5, impact_duration: 10,
            heart_rate_before: 75, heart_rate_after: 78,
        })
    }

    const deltaV = Math.abs(values.speed_before - values.speed_after)
    const accelMag = Math.sqrt(values.accel_x ** 2 + values.accel_y ** 2 + values.accel_z ** 2).toFixed(2)

    return (
        <div className="glass-card flex flex-col gap-0 overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            Accident Simulation Panel
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Configure sensor parameters & simulate</p>
                    </div>
                    <button
                        onClick={reset}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 
              hover:text-white border border-white/8 hover:border-white/20 transition-all">
                        <RotateCcw size={12} />
                        Reset
                    </button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="px-3 py-2 rounded-lg bg-white/3 border border-white/6">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">ΔV (Speed Loss)</p>
                        <p className="mono text-sm font-bold text-amber-400 mt-0.5">{deltaV.toFixed(0)} km/h</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-white/3 border border-white/6">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">|Accel| Magnitude</p>
                        <p className="mono text-sm font-bold text-blue-400 mt-0.5">{accelMag} m/s²</p>
                    </div>
                </div>
            </div>

            {/* Preset Buttons */}
            <div className="px-5 py-3 border-b border-white/6">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Quick Presets</p>
                <div className="grid grid-cols-4 gap-1.5">
                    {Object.keys(PRESETS).map(name => {
                        const colors = {
                            'Normal Drive': 'text-green-400 border-green-500/30 hover:bg-green-500/10',
                            'Minor Bump': 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10',
                            'Moderate Crash': 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10',
                            'Severe Impact': 'text-red-400 border-red-500/30 hover:bg-red-500/10',
                        }
                        return (
                            <button
                                key={name}
                                onClick={() => applyPreset(name)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${colors[name]}`}>
                                {name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Sliders */}
            <div className="flex-1 px-5 py-3 overflow-y-auto divide-y divide-white/4">
                {SLIDERS.map(cfg => (
                    <SliderRow key={cfg.key} config={cfg} value={values[cfg.key]} onChange={handleChange} />
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="mx-5 mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300">{error}</p>
                </div>
            )}

            {/* Simulate Button */}
            <div className="p-5 border-t border-white/6">
                <button
                    onClick={onSimulate}
                    disabled={loading}
                    className="btn-shimmer w-full py-3.5 rounded-xl font-bold text-white text-sm
            flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Zap size={16} />
                            Simulate Crash
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
