import React from 'react'
import { Activity, Shield, History, Wifi, WifiOff } from 'lucide-react'

export default function Header({ backendOnline, showHistory, onToggleHistory, historyCount }) {
    return (
        <header className="sticky top-0 z-50 border-b border-white/8 backdrop-blur-xl"
            style={{ background: 'rgba(5,11,24,0.85)' }}>
            <div className="max-w-[1800px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
                        <Shield size={20} className="text-white" />
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#050b18] animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white leading-tight tracking-tight">
                            SAIDS<span className="text-blue-400">S</span>
                        </h1>
                        <p className="text-xs text-slate-400 hidden sm:block">
                            Smart Accident Impact Detection System
                        </p>
                    </div>
                </div>

                {/* Center Badge */}
                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/8"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Activity size={14} className="text-cyan-400" />
                    <span className="text-xs font-medium text-slate-300">AI-Powered • Phase 1 Simulation</span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3">
                    {/* Backend status */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
            ${backendOnline
                            ? 'border-green-500/30 text-green-400 bg-green-500/10'
                            : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                        {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                        <span className="hidden sm:inline">{backendOnline ? 'API Online' : 'API Offline'}</span>
                    </div>

                    {/* History toggle */}
                    <button
                        onClick={onToggleHistory}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${showHistory
                                ? 'border-blue-500/50 text-blue-300 bg-blue-500/20'
                                : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}>
                        <History size={14} />
                        <span className="hidden sm:inline">History</span>
                        {historyCount > 0 && (
                            <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                {historyCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    )
}
