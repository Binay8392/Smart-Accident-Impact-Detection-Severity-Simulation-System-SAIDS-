import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Wifi } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import SimPanel from '../components/SimPanel'
import ResultCard from '../components/ResultCard'
import AccidentHistoryTable from '../components/AccidentHistoryTable'
import SeverityPieChart from '../components/SeverityPieChart'
import AccidentTrendChart from '../components/AccidentTrendChart'
import {
  checkApiHealth,
  fetchAccidents,
  fetchSeverityAnalytics,
  fetchTrendAnalytics,
} from '../services/saidssApi'

const SEVERITY_META = {
  0: { label: 'Low', color: '#10b981' },
  1: { label: 'Medium', color: '#f59e0b' },
  2: { label: 'High', color: '#f97316' },
  3: { label: 'Severe', color: '#ef4444' },
}

function TopBar({ title, online }) {
  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between border-b border-white/6 px-6 py-3"
      style={{ background: 'rgba(2,12,27,.9)', backdropFilter: 'blur(20px)' }}
    >
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <div
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${online
          ? 'border-green-500/30 bg-green-500/10 text-green-400'
          : 'border-red-500/30 bg-red-500/10 text-red-400'}`}
      >
        <Wifi size={11} />
        {online ? 'API Online' : 'API Offline'}
      </div>
    </div>
  )
}

function LatestPredictionCard({ prediction }) {
  if (!prediction) {
    return (
      <div className="card p-4">
        <p className="label-sm">Latest Prediction</p>
        <p className="mt-2 text-sm text-slate-400">No prediction available yet.</p>
      </div>
    )
  }

  const severity = Number(prediction.severity) || 0
  const meta = SEVERITY_META[severity] || SEVERITY_META[0]
  const probabilities = Array.isArray(prediction.probabilities) ? prediction.probabilities : [0, 0, 0, 0]
  const timestampText = prediction?.timestamp
    ? new Date(prediction.timestamp).toLocaleString()
    : 'No timestamp'

  return (
    <div className="card p-4">
      <p className="label-sm">Latest Prediction</p>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Accident Severity Indicator</p>
          <p className="text-2xl font-black" style={{ color: meta.color }}>{meta.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Timestamp</p>
          <p className="mono text-xs text-slate-300">{timestampText}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400 mono">
        {probabilities.map((item) => Number(item).toFixed(2)).join(' | ')}
      </p>
      {severity === 3 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2 text-red-300">
          <AlertTriangle size={14} />
          <span className="text-sm font-bold">Emergency Alert Triggered</span>
        </div>
      )}
    </div>
  )
}

export default function UserDashboard() {
  const [page, setPage] = useState('/dashboard')
  const [apiOnline, setApiOnline] = useState(false)
  const [latestPrediction, setLatestPrediction] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  const [accidents, setAccidents] = useState([])
  const [severityAnalytics, setSeverityAnalytics] = useState({ Low: 0, Medium: 0, High: 0, Severe: 0 })
  const [trendAnalytics, setTrendAnalytics] = useState([])

  const [historyLoading, setHistoryLoading] = useState(false)
  const [severityLoading, setSeverityLoading] = useState(false)
  const [trendLoading, setTrendLoading] = useState(false)

  const [historyError, setHistoryError] = useState('')
  const [severityError, setSeverityError] = useState('')
  const [trendError, setTrendError] = useState('')

  const pageTitle = useMemo(() => {
    if (page === '/dashboard/simulate') return 'Simulate Incident'
    if (page === '/dashboard/history') return 'Accident History'
    return 'My Dashboard'
  }, [page])

  const refreshHealth = useCallback(async () => {
    try {
      await checkApiHealth()
      setApiOnline(true)
    } catch {
      setApiOnline(false)
    }
  }, [])

  const refreshAccidents = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const rows = await fetchAccidents()
      setAccidents(Array.isArray(rows) ? rows : [])
    } catch (error) {
      setHistoryError(error?.response?.data?.detail || 'Failed to load accident history.')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const refreshSeverityAnalytics = useCallback(async () => {
    setSeverityLoading(true)
    setSeverityError('')
    try {
      const data = await fetchSeverityAnalytics()
      setSeverityAnalytics(data || { Low: 0, Medium: 0, High: 0, Severe: 0 })
    } catch (error) {
      setSeverityError(error?.response?.data?.detail || 'Failed to load severity analytics.')
    } finally {
      setSeverityLoading(false)
    }
  }, [])

  const refreshTrendAnalytics = useCallback(async () => {
    setTrendLoading(true)
    setTrendError('')
    try {
      const data = await fetchTrendAnalytics()
      setTrendAnalytics(Array.isArray(data) ? data : [])
    } catch (error) {
      setTrendError(error?.response?.data?.detail || 'Failed to load trend analytics.')
    } finally {
      setTrendLoading(false)
    }
  }, [])

  const refreshAnalytics = useCallback(async () => {
    await Promise.all([
      refreshAccidents(),
      refreshSeverityAnalytics(),
      refreshTrendAnalytics(),
    ])
  }, [refreshAccidents, refreshSeverityAnalytics, refreshTrendAnalytics])

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        await refreshHealth()
        await refreshAnalytics()
      } finally {
        if (active) setBootstrapping(false)
      }
    }

    bootstrap()

    const intervalId = setInterval(refreshHealth, 12000)
    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [refreshHealth, refreshAnalytics])

  const handlePrediction = (prediction) => {
    setLatestPrediction(prediction)
    refreshAnalytics()
  }

  return (
    <div className="relative flex h-screen" style={{ zIndex: 1 }}>
      <Sidebar activePage={page} onNavigate={setPage} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar title={pageTitle} online={apiOnline} />

        <main className="flex-1 overflow-y-auto p-5">
          {bootstrapping && page === '/dashboard' && (
            <div className="card p-4 text-sm text-slate-300">Loading dashboard...</div>
          )}

          {page === '/dashboard/simulate' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[460px_1fr]">
              <SimPanel onResult={handlePrediction} onLoadingChange={setSimulating} />
              <ResultCard result={latestPrediction} loading={simulating} />
            </div>
          )}

          {page === '/dashboard/history' && (
            <AccidentHistoryTable rows={accidents} loading={historyLoading} error={historyError} />
          )}

          {page === '/dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="card p-4">
                  <p className="label-sm">API Status</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Activity size={14} className={apiOnline ? 'text-green-400' : 'text-red-400'} />
                    <p className={`text-sm font-semibold ${apiOnline ? 'text-green-300' : 'text-red-300'}`}>
                      {apiOnline ? 'API Online' : 'API Offline'}
                    </p>
                  </div>
                </div>
                <LatestPredictionCard prediction={latestPrediction} />
              </div>

              {simulating && (
                <div className="card p-4 text-sm text-blue-300">Running prediction and updating analytics...</div>
              )}

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SeverityPieChart data={severityAnalytics || {}} loading={severityLoading} error={severityError} />
                <AccidentTrendChart trends={trendAnalytics || []} loading={trendLoading} error={trendError} />
              </div>

              <AccidentHistoryTable rows={accidents || []} loading={historyLoading} error={historyError} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
