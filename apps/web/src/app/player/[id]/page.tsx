"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Trophy, Zap, Target, Wind, Clock, Share2 } from "lucide-react"

interface Player {
  id: string
  full_name: string
  nickname: string | null
  email: string
  level: string | null
}

interface PlayerStats {
  total_matches: number
  wins: number
  losses: number
  win_rate: number
  total_highlights: number
  smashes: number
  aces: number
  lobs: number
  total_play_time_minutes: number
  recent_matches: {
    match_id: string
    scheduled_at: string
    status: string
    score_team_a: string | null
    score_team_b: string | null
    team: string | null
    duration_minutes: number | null
  }[]
}

function MatchCard({ player, stats }: { player: Player; stats: PlayerStats }) {
  const levelColors: Record<string, string> = {
    beginner: "from-gray-500 to-gray-700",
    intermediate: "from-blue-500 to-blue-700",
    advanced: "from-purple-500 to-purple-700",
    pro: "from-yellow-500 to-amber-700",
  }
  const gradient = levelColors[player.level || ""] || "from-green-500 to-emerald-700"

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-4 border-white" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full border-4 border-white" />
      </div>
      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">Padel Vision</p>
            <h2 className="text-2xl font-bold">{player.full_name}</h2>
            {player.nickname && <p className="text-sm opacity-80">&quot;{player.nickname}&quot;</p>}
          </div>
          <div className="rounded-lg bg-white/20 px-3 py-1 text-sm font-bold uppercase backdrop-blur-sm">
            {player.level || "N/A"}
          </div>
        </div>
        <div className="mb-5 flex items-end gap-2">
          <span className="text-5xl font-black">{stats.win_rate}</span>
          <span className="mb-1 text-lg opacity-80">% win</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">{stats.total_matches}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-70">Matchs</p>
          </div>
          <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">{stats.wins}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-70">Victoires</p>
          </div>
          <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">{stats.smashes}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-70">Smashs</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
          <div className="flex gap-4 text-xs opacity-70">
            <span>{stats.aces} aces</span>
            <span>{stats.lobs} lobs</span>
            <span>{stats.total_highlights} highlights</span>
          </div>
          <div className="flex items-center gap-1 text-xs opacity-70">
            <Clock className="h-3 w-3" />
            {Math.round(stats.total_play_time_minutes / 60)}h jouées
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlayerPage() {
  const params = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [stats, setStats] = useState<PlayerStats | null>(null)

  useEffect(() => {
    if (!params.id) return
    Promise.all([
      apiFetch<Player>(`/api/players/${params.id}`),
      apiFetch<PlayerStats>(`/api/players/${params.id}/stats`),
    ])
      .then(([p, s]) => { setPlayer(p); setStats(s) })
      .catch(() => { setPlayer(null); setStats(null) })
  }, [params.id])

  if (!player || !stats) {
    return <div className="p-8 text-muted-foreground">Chargement du joueur...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profil joueur</h1>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" /> Partager
        </Button>
      </div>

      <div className="mx-auto mb-8 max-w-sm">
        <MatchCard player={player} stats={stats} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-4 text-center">
          <Trophy className="mx-auto mb-1 h-5 w-5 text-primary" />
          <p className="text-2xl font-bold">{stats.win_rate}%</p>
          <p className="text-xs text-muted-foreground">Win rate</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <Zap className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
          <p className="text-2xl font-bold">{stats.smashes}</p>
          <p className="text-xs text-muted-foreground">Smashs</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <Target className="mx-auto mb-1 h-5 w-5 text-red-500" />
          <p className="text-2xl font-bold">{stats.aces}</p>
          <p className="text-xs text-muted-foreground">Aces</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <Wind className="mx-auto mb-1 h-5 w-5 text-blue-500" />
          <p className="text-2xl font-bold">{stats.lobs}</p>
          <p className="text-xs text-muted-foreground">Lobs</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Matchs récents</h2>
        <div className="space-y-2">
          {stats.recent_matches.map((m) => {
            const isWinner = m.score_team_a && m.score_team_b && m.status === "completed" && (() => {
              const setsA = m.score_team_a!.split(" ").filter(s => s.includes("-")).filter(s => parseInt(s.split("-")[0]) > parseInt(s.split("-")[1])).length
              const setsB = m.score_team_b!.split(" ").filter(s => s.includes("-")).filter(s => parseInt(s.split("-")[0]) > parseInt(s.split("-")[1])).length
              return (m.team === "A" && setsA > setsB) || (m.team === "B" && setsB > setsA)
            })()
            return (
              <Link key={m.match_id} href={`/match/${m.match_id}`} className="block">
                <div className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50 ${isWinner ? "border-l-4 border-l-green-500" : m.status === "completed" ? "border-l-4 border-l-red-400" : ""}`}>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(m.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground">Team {m.team} — {m.duration_minutes ? `${m.duration_minutes} min` : "—"}</p>
                  </div>
                  <div className="text-right">
                    {m.status === "completed" ? (
                      <>
                        <p className="font-mono text-sm font-semibold">{m.score_team_a}</p>
                        <p className={`text-xs font-medium ${isWinner ? "text-green-600" : "text-red-500"}`}>
                          {isWinner ? "Victoire" : "Défaite"}
                        </p>
                      </>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{m.status}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
