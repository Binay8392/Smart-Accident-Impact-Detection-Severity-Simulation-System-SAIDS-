import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff, Zap, Activity, Cpu, Lock, User } from 'lucide-react'
import axios from 'axios'

const QUICK_LOGINS = [
    { label: 'Admin', username: 'admin', password: 'admin123', role: 'admin', color: '#8b5cf6', icon: Cpu },
    { label: 'Rahul (User)', username: 'user1', password: 'user123', role: 'user', color: '#3b82f6', icon: User },
    { label: 'Priya (User)', username: 'user2', password: 'user123', role: 'user', color: '#ec4899', icon: User },
    { label: 'Arjun (User)', username: 'user3', password: 'user123', role: 'user', color: '#10b981', icon: User },
]

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await axios.post('/api/auth/login', form)
            login(data.user)
            navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Check credentials.')
        } finally {
            setLoading(false)
        }
    }

    const quickLogin = async (creds) => {
        setLoading(true); setError('')
        try {
            const { data } = await axios.post('/api/auth/login', { username: creds.username, password: creds.password })
            login(data.user)
            navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
        } catch { setError('Quick login failed') } finally { setLoading(false) }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4" style={{ zIndex: 1 }}>
            {/* Animated background grid */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
            }} />

            {/* Floating orbs */}
            <div className="fixed top-20 left-20 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle,rgba(59,130,246,.15) 0%,transparent 70%)', filter: 'blur(40px)' }} />
            <div className="fixed bottom-20 right-20 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle,rgba(6,182,212,.1) 0%,transparent 70%)', filter: 'blur(50px)' }} />

            <div className="relative w-full max-w-md anim-fade-in">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', boxShadow: '0 0 40px rgba(59,130,246,.5)' }}>
                        <Shield size={36} className="text-white" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-[#020c1b] anim-pulse" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">SAIDS<span className="text-blue-400">S</span></h1>
                    <p className="text-sm text-slate-400 mt-2">Smart Accident Impact Detection & Safety System</p>
                    <div className="flex items-center justify-center gap-4 mt-3">
                        {[['Phase 1', '#3b82f6'], ['AI-Powered', '#06b6d4'], ['Wearable-First', '#10b981']].map(([t, c]) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                                style={{ color: c, borderColor: `${c}40`, background: `${c}12` }}>{t}</span>
                        ))}
                    </div>
                </div>

                {/* Card */}
                <div className="card p-8">
                    <h2 className="text-lg font-bold text-white mb-1">Sign In</h2>
                    <p className="text-xs text-slate-500 mb-6">Access your safety dashboard</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="label-xs mb-2 block">Username</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text" value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    placeholder="admin / user1 / user2 / user3"
                                    className="w-full bg-white/4 border border-white/8 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label-xs mb-2 block">Password</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPw ? 'text' : 'password'} value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="admin123 / user123"
                                    className="w-full bg-white/4 border border-white/8 rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/50 transition-all"
                                    required
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-shimmer w-full py-3 text-sm flex items-center justify-center gap-2">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full anim-spin" />Authenticating...</>
                                : <><Zap size={15} />Sign In to Dashboard</>}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-white/6" />
                        <span className="text-xs text-slate-600">Quick Access</span>
                        <div className="flex-1 h-px bg-white/6" />
                    </div>

                    {/* Quick login buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        {QUICK_LOGINS.map(q => (
                            <button key={q.username} onClick={() => quickLogin(q)} disabled={loading}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all disabled:opacity-50"
                                style={{ borderColor: `${q.color}30`, background: `${q.color}10`, color: q.color }}
                                onMouseEnter={e => e.currentTarget.style.background = `${q.color}20`}
                                onMouseLeave={e => e.currentTarget.style.background = `${q.color}10`}>
                                <q.icon size={12} />
                                {q.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {[['7', 'Incident Types'], ['4', 'Severity Classes'], ['3', 'Active Devices']].map(([n, l]) => (
                        <div key={l} className="card p-3 text-center">
                            <p className="text-xl font-black text-blue-400 mono">{n}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{l}</p>
                        </div>
                    ))}
                </div>

                <p className="text-center text-xs text-slate-700 mt-6">
                    SAIDSS v2.0 · Phase 1 Software Simulation · Made with ❤️ for safety
                </p>
            </div>
        </div>
    )
}
