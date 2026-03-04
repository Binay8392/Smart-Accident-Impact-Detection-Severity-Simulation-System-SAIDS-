import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import SimPanel from '../components/SimPanel'
import ResultCard from '../components/ResultCard'
import AlertBanner from '../components/AlertBanner'
import {
  Users,
  Activity,
  AlertTriangle,
  Wifi,
  Watch,
  RefreshCw,
  BarChart2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'
import axios from 'axios'

const SEV_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']
const SEV_LABELS = ['Low', 'Medium', 'High', 'Severe']
const INC_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981']
const INC_NAMES = ['Bike', 'Car', 'Truck', 'Pedestrian', 'Industrial', 'Elderly', 'Sports']

const EMPTY_OVERVIEW_STATS = {
  total_incidents: 0,
  by_severity: [0, 0, 0, 0],
  by_incident_type: [0, 0, 0, 0, 0, 0, 0],
  severity_rate: { severe_pct: 0, moderate_pct: 0 },
  users: [],
  user_incident_count: {},
  total_users: 0,
  active_devices: 0,
  recent: [],
}

function toCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toCountArray(source, length, namedOrder = null) {
  if (Array.isArray(source)) {
    return Array.from({ length }, (_, index) => toCount(source?.[index]))
  }

  if (source && typeof source === 'object') {
    if (Array.isArray(namedOrder)) {
      return namedOrder.map((name) => toCount(source?.[name]))
    }
    return Array.from({ length }, (_, index) => toCount(source?.[index]))
  }

  return Array(length).fill(0)
}

function normalizeOverviewStats(raw) {
  const safe = raw && typeof raw === 'object' ? raw : {}
  const bySeverityLegacy = toCountArray(safe.by_severity, 4)
  const bySeverityNamed = toCountArray(safe.severity_distribution, 4, SEV_LABELS)
  const bySeverity = bySeverityLegacy.some((count) => count > 0) ? bySeverityLegacy : bySeverityNamed

  const byIncidentType = toCountArray(safe.by_incident_type, 7)
  const users = Array.isArray(safe.users) ? safe.users : []
  const recent = Array.isArray(safe.recent) ? safe.recent : []
  const userIncidentCount = safe.user_incident_count && typeof safe.user_incident_count === 'object'
    ? safe.user_incident_count
    : {}

  const totalIncidents = safe.total_incidents != null
    ? toCount(safe.total_incidents)
    : bySeverity.reduce((sum, count) => sum + count, 0)

  const severePct = safe?.severity_rate?.severe_pct != null
    ? toCount(safe.severity_rate.severe_pct)
    : (totalIncidents ? Number(((bySeverity[3] / totalIncidents) * 100).toFixed(1)) : 0)

  const moderatePct = safe?.severity_rate?.moderate_pct != null
    ? toCount(safe.severity_rate.moderate_pct)
    : (totalIncidents ? Number(((bySeverity[2] / totalIncidents) * 100).toFixed(1)) : 0)

  const totalUsers = safe.total_users != null ? toCount(safe.total_users) : users.length
  const activeDevices = safe.active_devices != null
    ? toCount(safe.active_devices)
    : users.filter((user) => user?.device_status === 'connected').length

  return {
    total_incidents: totalIncidents,
    by_severity: bySeverity,
    by_incident_type: byIncidentType,
    severity_rate: { severe_pct: severePct, moderate_pct: moderatePct },
    users,
    user_incident_count: userIncidentCount,
    total_users: totalUsers,
    active_devices: activeDevices,
    recent,
  }
}

function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
      <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-blue-400 anim-spin" />
      {label}
    </div>
  )
}

function TopBar({ title, onRefresh, loading }) {
  const [online, setOnline] = useState(false)

  useEffect(() => {
    let active = true

    const checkHealth = async () => {
      try {
        await axios.get('/api/health', { timeout: 3000 })
        if (active) setOnline(true)
      } catch {
        if (active) setOnline(false)
      }
    }

    checkHealth()
    const intervalId = setInterval(checkHealth, 12000)
    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between border-b border-white/6 px-6 py-3"
      style={{ background: 'rgba(2,12,27,.9)', backdropFilter: 'blur(20px)' }}
    >
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
          online
            ? 'border-green-500/30 bg-green-500/10 text-green-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          <Wifi size={11} />
          {online ? 'API Online' : 'API Offline'}
        </div>
        <button onClick={onRefresh} disabled={loading} className="btn-ghost px-2.5 py-1 text-xs">
          <RefreshCw size={11} className={loading ? 'anim-spin' : ''} /> Refresh
        </button>
      </div>
    </div>
  )
}

function StatTile({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="card card-glow p-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 rounded-xl" style={{ background: bg }}>
          <div className="flex h-full w-full items-center justify-center">
            <Icon size={20} style={{ color }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="label-xs mb-1">{label}</p>
          <p className="mono text-2xl font-black text-white">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
        </div>
      </div>
    </div>
  )
}

const TooltipContent = ({ active, payload, label }) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null
  return (
    <div className="card border border-white/10 px-3 py-2 text-xs" style={{ background: '#071428' }}>
      <p className="mb-1 text-slate-300">{label}</p>
      {payload.map((item, index) => (
        <p key={`${item?.name}-${index}`} style={{ color: item?.color || item?.fill }}>
          {item?.name}: <strong>{item?.value}</strong>
        </p>
      ))}
    </div>
  )
}

function OverviewPage({ stats, loading, error, onRetry }) {
  if (loading) {
    return <Spinner label="Loading dashboard analytics..." />
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-red-300">{error}</p>
        <button className="btn-primary mx-auto mt-4" onClick={onRetry}>Retry</button>
      </div>
    )
  }

  const safeStats = normalizeOverviewStats(stats)

  const sevData = SEV_LABELS.map((name, index) => ({
    name,
    value: safeStats?.by_severity?.[index] || 0,
    color: SEV_COLORS[index],
  }))

  const typeData = INC_NAMES.map((name, index) => ({
    name,
    value: safeStats?.by_incident_type?.[index] || 0,
    color: INC_COLORS[index],
  }))

  const trendData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + index)
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      Low: Math.floor(Math.random() * 8 + 2),
      Medium: Math.floor(Math.random() * 5 + 1),
      High: Math.floor(Math.random() * 3),
      Severe: Math.floor(Math.random() * 2),
    }
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Activity}
          label="Total Incidents"
          value={safeStats.total_incidents}
          sub="All time"
          color="#3b82f6"
          bg="rgba(59,130,246,.12)"
        />
        <StatTile
          icon={AlertTriangle}
          label="Severe Events"
          value={safeStats?.by_severity?.[3] || 0}
          sub={`${safeStats?.severity_rate?.severe_pct || 0}% of total`}
          color="#ef4444"
          bg="rgba(239,68,68,.12)"
        />
        <StatTile
          icon={Users}
          label="Active Users"
          value={safeStats.total_users}
          sub="Registered"
          color="#10b981"
          bg="rgba(16,185,129,.12)"
        />
        <StatTile
          icon={Watch}
          label="Online Devices"
          value={safeStats.active_devices}
          sub="Wearables connected"
          color="#06b6d4"
          bg="rgba(6,182,212,.12)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="label-xs mb-4">Severity Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sevData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                {sevData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip content={<TooltipContent />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card col-span-2 p-5">
          <p className="label-xs mb-4">Incidents by Category</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipContent />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {typeData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={entry.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <p className="label-xs mb-4">7-Day Incident Trend (simulated)</p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
            <Tooltip content={<TooltipContent />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
            {SEV_LABELS.map((key, index) => (
              <Line key={key} dataKey={key} stroke={SEV_COLORS[index]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
          <h4 className="text-sm font-bold text-white">Recent Incidents</h4>
          <p className="text-xs text-slate-500">All users · Latest 8</p>
        </div>

        {safeStats?.recent?.length ? (
          <div className="divide-y divide-white/4">
            {safeStats.recent.slice(0, 8).map((incident, index) => {
              const severity = toCount(incident?.severity)
              const color = SEV_COLORS[severity] || '#94a3b8'
              const label = SEV_LABELS[severity] || 'Unknown'
              return (
                <div key={incident?.id || `${incident?.timestamp || 'ts'}-${index}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3">
                  <div className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{incident?.incident_name || 'Incident'}</span>
                      <span className="text-[10px]" style={{ color }}>{label}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      {incident?.user_name || 'Unknown'} · {incident?.timestamp ? new Date(incident.timestamp).toLocaleTimeString() : 'Unknown time'}
                    </p>
                  </div>
                  <span className="mono text-xs font-bold text-white">{toCount(incident?.confidence)}%</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">No recent incidents available.</div>
        )}
      </div>
    </div>
  )
}

function AllIncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadIncidents = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get('/api/accidents?limit=100')
        const rows = Array.isArray(response?.data)
          ? response.data
          : (Array.isArray(response?.data?.incidents) ? response.data.incidents : [])
        if (active) setIncidents(rows)
      } catch (loadError) {
        if (active) {
          setIncidents([])
          setError(loadError?.response?.data?.detail || 'Failed to load incidents.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadIncidents()
    return () => {
      active = false
    }
  }, [])

  const filteredIncidents = filter === 'all'
    ? incidents
    : incidents.filter((incident) => toCount(incident?.severity) === parseInt(filter, 10))

  const severityColor = (severity) => SEV_COLORS[toCount(severity)] || '#6b7280'

  if (loading) return <Spinner label="Loading incidents..." />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[['all', 'All', '#3b82f6'], ['0', 'Low', '#10b981'], ['1', 'Medium', '#f59e0b'], ['2', 'High', '#f97316'], ['3', 'Severe', '#ef4444']].map(([value, label, color]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              filter === value ? 'text-white' : 'border-white/8 text-slate-400 hover:border-white/18'
            }`}
            style={
              filter === value
                ? { borderColor: `${color}50`, background: `${color}20`, color }
                : undefined
            }
          >
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-500">{filteredIncidents?.length || 0} records</span>
      </div>

      {error ? (
        <div className="card p-5 text-sm text-red-300">{error}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="max-h-[70vh] divide-y divide-white/4 overflow-y-auto">
            {filteredIncidents?.length ? (
              filteredIncidents.map((incident, index) => {
                const severity = toCount(incident?.severity)
                const color = severityColor(severity)
                return (
                  <div key={incident?.id || `${incident?.timestamp || 't'}-${index}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3">
                    <div className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-white">{incident?.incident_name || 'Accident Event'}</span>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${color}20`, color }}>
                          {SEV_LABELS[severity] || 'Unknown'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {incident?.user_name || 'Unknown'} · {incident?.timestamp ? new Date(incident.timestamp).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mono text-xs font-bold text-white">{toCount(incident?.confidence)}%</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">No data available</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function UsersPage({ stats }) {
  const safeStats = normalizeOverviewStats(stats)
  const users = safeStats?.users?.filter((user) => user?.role === 'user') || []
  const getCount = (userId) => toCount(safeStats?.user_incident_count?.[userId])

  if (!users.length) {
    return <div className="card p-8 text-center text-sm text-slate-500">No user data available</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {users.map((user, index) => (
        <div key={user?.id || index} className="card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
              {user?.avatar || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.name || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{user?.email || 'No email'}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {[
              ['Device', user?.device_id || '-'],
              ['Status', user?.device_status || '-'],
              ['Incidents', `${getCount(user?.id)} recorded`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-white/4 pb-1">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TestSimPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[400px_1fr]">
      <SimPanel onResult={setResult} onLoadingChange={setLoading} />
      <div>
        {result || loading ? (
          <ResultCard result={result} loading={loading} />
        ) : (
          <div className="card flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <BarChart2 size={36} className="mx-auto mb-3 text-slate-700" />
              <p className="text-slate-500">Run a simulation to see results</p>
            </div>
          </div>
        )}
        {result ? <AlertBanner result={result} onDismiss={() => {}} /> : null}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  useAuth()
  const [page, setPage] = useState('/admin')
  const [stats, setStats] = useState(EMPTY_OVERVIEW_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/admin/stats')
      setStats(normalizeOverviewStats(response?.data))
    } catch (requestError) {
      setStats(EMPTY_OVERVIEW_STATS)
      setError(requestError?.response?.data?.detail || 'Failed to fetch admin stats.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const pageLabel = useMemo(() => {
    if (page === '/admin/incidents') return 'All Incidents'
    if (page === '/admin/users') return 'User Management'
    if (page === '/admin/simulate') return 'Test Simulator'
    return 'Admin Overview'
  }, [page])

  return (
    <div className="relative flex h-screen" style={{ zIndex: 1 }}>
      <Sidebar activePage={page} onNavigate={setPage} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar title={pageLabel} onRefresh={fetchStats} loading={loading} />

        <main className="flex-1 overflow-y-auto p-5">
          {page === '/admin' ? <OverviewPage stats={stats} loading={loading} error={error} onRetry={fetchStats} /> : null}
          {page === '/admin/incidents' ? <AllIncidentsPage /> : null}
          {page === '/admin/users' ? <UsersPage stats={stats} /> : null}
          {page === '/admin/simulate' ? <TestSimPage /> : null}
        </main>
      </div>
    </div>
  )
}
