import React, { useState, useEffect } from 'react'
import { X, Phone, MessageSquare, MapPin, Clock, Zap, AlertTriangle, Users, FileText } from 'lucide-react'

const SEVERITY_CONFIG = {
    0: null, // No alert for "No Accident"
    1: {
        type: 'log',
        title: 'Event Logged',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
        icon: FileText,
    },
    2: {
        type: 'family',
        title: 'Family Notification Sent',
        color: '#f97316',
        bg: 'rgba(249,115,22,0.08)',
        border: 'rgba(249,115,22,0.25)',
        icon: Users,
    },
    3: {
        type: 'emergency',
        title: 'EMERGENCY ALERT TRIGGERED',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.3)',
        icon: AlertTriangle,
    },
}

function SMSPopup({ onClose, location, time }) {
    return (
        <div className="fixed top-20 right-4 z-[9999] animate-slide-up">
            <div className="glass-card p-4 w-72 border border-green-500/30"
                style={{ background: 'rgba(10,30,20,0.95)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Phone size={14} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">SMS Sent ✓</p>
                        <p className="text-[10px] text-slate-400">Emergency Contact Notified</p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-start gap-2">
                        <MessageSquare size={12} className="text-green-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                            🚨 EMERGENCY ALERT: Severe accident detected at{' '}
                            <strong className="text-white">{location}</strong>.{' '}
                            Emergency services dispatched at {time}.
                            Please respond immediately.
                        </p>
                    </div>
                </div>
                <p className="text-[10px] text-green-400 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Message delivered to emergency contact
                </p>
            </div>
        </div>
    )
}

export default function EmergencyAlert({ severity, result, onDismiss }) {
    const config = SEVERITY_CONFIG[severity]
    const [showSMS, setShowSMS] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        setDismissed(false)
        if (severity === 3) {
            const timer = setTimeout(() => setShowSMS(true), 800)
            return () => clearTimeout(timer)
        }
    }, [result?.id, severity])

    if (!config || dismissed) return null

    const time = new Date(result.timestamp).toLocaleTimeString()
    const Icon = config.icon

    const handleDismiss = () => {
        setDismissed(true)
        setShowSMS(false)
        onDismiss()
    }

    // ── Severity 1: Minimal log banner ────────────────────────────────────────
    if (severity === 1) {
        return (
            <div className="mx-4 lg:mx-6 mt-2 px-4 py-2.5 rounded-xl border flex items-center gap-3 animate-slide-up"
                style={{ background: config.bg, borderColor: config.border }}>
                <FileText size={14} style={{ color: config.color }} />
                <p className="text-xs flex-1" style={{ color: config.color }}>
                    <strong>Minor event logged.</strong> No action required. Stored in accident history for analysis.
                </p>
                <button onClick={handleDismiss} className="text-slate-500 hover:text-white ml-2">
                    <X size={14} />
                </button>
            </div>
        )
    }

    // ── Severity 2: Family notification ──────────────────────────────────────
    if (severity === 2) {
        return (
            <div className="mx-4 lg:mx-6 mt-2 rounded-xl border overflow-hidden animate-slide-up"
                style={{ background: config.bg, borderColor: config.border }}>
                <div className="px-4 py-3 flex items-center gap-3">
                    <Users size={16} style={{ color: config.color }} />
                    <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: config.color }}>Family Notification Panel</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            A <strong>moderate impact</strong> was detected. Family members have been notified automatically.
                        </p>
                    </div>
                    <button onClick={handleDismiss} className="text-slate-500 hover:text-white">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-4 pb-3 grid grid-cols-3 gap-3">
                    {[
                        { icon: MapPin, label: 'Location', val: result.gps_location.address.split(',')[0] },
                        { icon: Clock, label: 'Time', val: time },
                        { icon: Zap, label: 'Impact', val: `${result.impact_intensity}/100` },
                    ].map(({ icon: Ic, label, val }) => (
                        <div key={label} className="rounded-lg px-3 py-2 bg-white/5 border border-white/8">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <Ic size={11} style={{ color: config.color }} />
                                <p className="text-[10px] text-slate-500">{label}</p>
                            </div>
                            <p className="text-xs font-semibold text-white truncate">{val}</p>
                        </div>
                    ))}
                </div>
                <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <Phone size={11} className="text-orange-400" />
                        <p className="text-[10px] text-orange-300">
                            SMS notification sent to registered family contacts
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // ── Severity 3: Full emergency ────────────────────────────────────────────
    return (
        <>
            {showSMS && (
                <SMSPopup
                    onClose={() => setShowSMS(false)}
                    location={result.gps_location.address}
                    time={time}
                />
            )}

            <div className="mx-4 lg:mx-6 mt-2 rounded-xl border overflow-hidden animate-slide-up"
                style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.5)' }}>
                {/* Animated header */}
                <div className="px-4 py-3 animate-emergency flex items-center gap-3"
                    style={{ background: 'rgba(239,68,68,0.2)', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>
                    <div className="relative">
                        <AlertTriangle size={20} className="text-red-400" />
                        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-400 opacity-30" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-black text-red-400 tracking-wide">🚨 EMERGENCY ALERT TRIGGERED</p>
                        <p className="text-xs text-red-300">Severe accident detected — Emergency services dispatched</p>
                    </div>
                    <button onClick={handleDismiss}
                        className="text-red-300 hover:text-white transition-colors p-1 rounded">
                        <X size={16} />
                    </button>
                </div>

                {/* Details grid */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { icon: MapPin, label: 'Location', val: result.gps_location.address.split(',')[0], color: '#ef4444' },
                        { icon: Clock, label: 'Time', val: time, color: '#f97316' },
                        { icon: Zap, label: 'Impact Score', val: `${result.impact_intensity}/100`, color: '#ef4444' },
                        { icon: AlertTriangle, label: 'Confidence', val: `${result.confidence}%`, color: '#ef4444' },
                    ].map(({ icon: Ic, label, val, color }) => (
                        <div key={label} className="rounded-lg px-3 py-2.5 border"
                            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Ic size={11} style={{ color }} />
                                <p className="text-[10px] text-red-300 uppercase tracking-wider">{label}</p>
                            </div>
                            <p className="text-sm font-bold text-white">{val}</p>
                        </div>
                    ))}
                </div>

                {/* Action indicators */}
                <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    {[
                        { icon: Phone, text: '📞 Emergency services contacted', done: true },
                        { icon: MessageSquare, text: '💬 SMS sent to family', done: true },
                        { icon: MapPin, text: '📍 Location shared with responders', done: true },
                    ].map(({ icon: Ic, text, done }) => (
                        <div key={text} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                            <p className="text-[10px] text-red-200">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
