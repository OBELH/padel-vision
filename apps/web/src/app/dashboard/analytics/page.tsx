"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Eye, Share2, TrendingUp, BarChart3, Trophy, Zap } from "lucide-react"

interface DailyCount {
  date: string
  count: number
}

interface EntityStats {
  entity_type: string
  entity_id: string
  views: number
  shares: number
}

interface Dashboard {
  total_views: number
  total_shares: number
  views_today: number
  shares_today: number
  top_highlights: EntityStats[]
  top_matches: EntityStats[]
  daily_views: DailyCount[]
  daily_shares: DailyCount[]
}

function MiniBarChart({ data, color }: { data: DailyCount[]; color: string }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Pas encore de données</p>

  const max = Math.max(...data.map((d) => d.count), 1)

  // Fill in last 14 days
  const today = new Date()
  const days: { label: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    const found = data.find((x) => x.date === dateStr)
    days.push({
      label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      count: found?.count || 0,
    })
  }

  return (
    <div className="flex items-end gap-1" style={{ height: 80 }}>
      {days.map((d, i) => (
        <div key={i} className="group relative flex-1">
          <div
            className={`w-full rounded-t ${color} transition-all hover:opacity-80`}
            style={{
              height: `${Math.max(2, (d.count / max) * 72)}px`,
            }}
          />
          <div className="invisible absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:visible">
            {d.label}: {d.count}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Dashboard>("/api/analytics/dashboard?days=30")
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-4 text-muted-foreground sm:p-8">Chargement des analytics...</div>
  }

  if (!dashboard) {
    return <div className="p-4 text-muted-foreground sm:p-8">Erreur de chargement</div>
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">Suivez les vues et partages de vos contenus</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Vues totales</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{dashboard.total_views}</p>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Share2 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Partages totaux</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{dashboard.total_shares}</p>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Vues aujourd'hui</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-600">{dashboard.views_today}</p>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-purple-600">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Partages aujourd'hui</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600">{dashboard.shares_today}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4" /> Vues (14 derniers jours)
          </h3>
          <MiniBarChart data={dashboard.daily_views} color="bg-green-500" />
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4" /> Partages (14 derniers jours)
          </h3>
          <MiniBarChart data={dashboard.daily_shares} color="bg-purple-500" />
        </div>
      </div>

      {/* Top content */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4" /> Top Highlights
          </h3>
          {dashboard.top_highlights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {dashboard.top_highlights.map((h, i) => (
                <div key={h.entity_id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
                      {i + 1}
                    </span>
                    <span className="truncate text-xs font-mono text-muted-foreground">
                      {h.entity_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {h.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" /> {h.shares}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4" /> Top Matchs
          </h3>
          {dashboard.top_matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {dashboard.top_matches.map((m, i) => (
                <div key={m.entity_id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {i + 1}
                    </span>
                    <span className="truncate text-xs font-mono text-muted-foreground">
                      {m.entity_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {m.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" /> {m.shares}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
