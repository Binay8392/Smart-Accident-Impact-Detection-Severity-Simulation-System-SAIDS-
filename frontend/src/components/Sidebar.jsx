import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Shield, LayoutDashboard, Zap, History, Users, Settings,
    LogOut, Activity, ChevronRight, Cpu
} from 'lucide-react'

const USER_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard', exact: true },
    { to: '/dashboard/simulate', icon: Zap, label: 'Simulate Incident' },
    { to: '/dashboard/history', icon: History, label: 'My History' },
]

const ADMIN_NAV = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
    { to: '/admin/incidents', icon: Activity, label: 'All Incidents' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/simulate', icon: Zap, label: 'Test Simulator' },
]

export default function Sidebar({ activePage, onNavigate }) {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()
    const nav = isAdmin ? ADMIN_NAV : USER_NAV

    const handleLogout = () => { logout(); navigate('/login') }

    return (
        <aside className="sidebar flex flex-col w-60 shrink-0 h-screen sticky top-0">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', boxShadow: '0 0 16px rgba(59,130,246,.4)' }}>
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-white">SAIDS<span className="text-blue-400">S</span></p>
                        <p className="text-[10px] text-slate-500 leading-tight">Safety Platform v2</p>
                    </div>
                </div>
            </div>

            {/* User info */}
            <div className="px-4 py-3 mx-3 mt-3 rounded-xl border border-white/6 bg-white/3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: isAdmin ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
                        {user?.avatar || user?.name?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-400' : 'bg-green-400'}`} />
                            <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    {isAdmin && <Cpu size={12} className="text-purple-400 ml-auto shrink-0" />}
                </div>
                {!isAdmin && user?.device_id && (
                    <div className="mt-2 pt-2 border-t border-white/6 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${user.device_status === 'connected' ? 'bg-green-400 anim-pulse' : 'bg-red-400'}`} />
                        <p className="text-[10px] text-slate-500">Device: <span className="text-slate-400 font-mono">{user.device_id}</span></p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
                <p className="label-xs px-2 mb-2">{isAdmin ? 'Admin Controls' : 'Navigation'}</p>
                {nav.map(({ icon: Icon, label, to }) => {
                    const isActive = activePage === to || activePage === label
                    return (
                        <button key={to}
                            onClick={() => onNavigate(to)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group text-left
                ${isActive
                                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                            <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                            {label}
                            {isActive && <ChevronRight size={14} className="ml-auto text-blue-400" />}
                        </button>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className="px-3 pb-4 border-t border-white/6 pt-4">
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                    <LogOut size={14} />
                    Sign Out
                </button>
                <p className="text-center text-[10px] text-slate-700 mt-3">SAIDSS v2 · Phase 1</p>
            </div>
        </aside>
    )
}
