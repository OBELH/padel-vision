"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Trophy, Zap, Target, Wind, Clock, Share2, Check } from "lucide-react"
import { shareContent, getPlayerShareUrl } from "@/lib/share"
import { trackView, trackShare } from "@/lib/analytics"

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

function PlayerCard({ player, stats }: { player: Player; stats: PlayerStats }) {
  const levelColors: Record<string, string> = {
    beginner: "from-gray-500 to-gray-700",
    intermediate: "from-blue-500 to-blue-700",
    advanced: "from-purple-500 to-purple-700",
    pro: "from-yellow-500 to-amber-700",
  }
  const gradient = levelColors[player.level || ""] || "from-green-500 to-emerald-700"

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-xl sm:p-6`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-4 border-white" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full border-4 border-white" />
      </div>
      <div className="relative">
        <div className="mb-3 flex items-start justify-between sm:mb-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-80 sm:text-xs">Padel Vision</p>
            <h2 className="text-xl font-bold sm:text-2xl">{player.full_name}</h2>
            {player.nickname && <p className="text-xs opacity-80 sm:text-sm">&quot;{player.nickname}&quot;</p>}
          </div>
          <div className="rounded-lg bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase backdrop-blur-sm sm:px-3 sm:py-1 sm:text-sm">
            {player.level || "N/A"}
          </div>
        </div>
        <div className="mb-4 flex items-end gap-2 sm:mb-5">
          <span className="text-4xl font-black sm:text-5xl">{stats.win_rate}</span>
          <span className="mb-0.5 text-base opacity-80 sm:mb-1 sm:text-lg">% win</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
            <p className="text-lg font-bold sm:text-xl">{stats.total_matches}</p>
            <p className="text-[9px] uppercase tracking-wider opacity-70 sm:text-[10px]">Matchs</p>
          </div>
          <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
            <p className="text-lg font-bold sm:text-xl">{stats.wins}</p>
            <p className="text-[9px] uppercase tracking-wider opacity-70 sm:text-[10px]">Victoires</p>
          </div>
          <div className="rounded-lg bg-white/15 p-2 text-center backdrop-blur-sm">
            <p className="text-lg font-bold sm:text-xl">{stats.smashes}</p>
            <p className="text-[9px] uppercase tracking-wider opacity-70 sm:text-[10px]">Smashs</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-2.5 sm:mt-4 sm:pt-3">
          <div className="flex gap-3 text-[11px] opacity-70 sm:gap-4 sm:text-xs">
            <span>{stats.aces} aces</span>
            <span>{stats.lobs} lobs</span>
            <span>{stats.total_highlights} highlights</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] opacity-70 sm:text-xs">
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
  const [shareToast, setShareToast] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) return
    trackView("player", params.id as string)
    Promise.all([
      apiFetch<Player>(`/api/players/${params.id}`),
      apiFetch<PlayerStats>(`/api/players/${params.id}/stats`),
    ])
      .then(([p, s]) => { setPlayer(p); setStats(s) })
      .catch(() => { setPlayer(null); setStats(null) })
  }, [params.id])

  if (!player || !stats) {
    return <div className="p-4 text-muted-foreground sm:p-8">Chargement du joueur...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Profil joueur</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={async () => {
            const url = getPlayerShareUrl(player.id)
            const result = await shareContent({
              title: `${player.full_name} - Padel Vision`,
              text: `${player.full_name} — ${stats.win_rate}% win rate, ${stats.total_matches} matchs sur Padel Vision`,
              url,
            })
            trackShare("player", player.id, result === "shared" ? "webshare" : "clipboard")
            if (result === "copied") {
              setShareToast("Lien copié !")
              setTimeout(() => setShareToast(null), 2000)
            } else if (result === "shared") {
              setShareToast("Partagé !")
              setTimeout(() => setShareToast(null), 2000)
            }
          }}
        >
          <Share2 className="h-4 w-4" /> Partager
        </Button>
      </div>

      <div className="mx-auto mb-6 max-w-sm sm:mb-8">
        <PlayerCard player={player} stats={stats} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-lg border p-3 text-center sm:p-4">
          <Trophy className="mx-auto mb-1 h-4 w-4 text-primary sm:h-5 sm:w-5" />
          <p className="text-xl font-bold sm:text-2xl">{stats.win_rate}%</p>
          <p className="text-[11px] text-muted-foreground sm:text-xs">Win rate</p>
        </div>
        <div className="rounded-lg border p-3 text-center sm:p-4">
          <Zap className="mx-auto mb-1 h-4 w-4 text-yellow-500 sm:h-5 sm:w-5" />
          <p className="text-xl font-bold sm:text-2xl">{stats.smashes}</p>
          <p className="text-[11px] text-muted-foreground sm:text-xs">Smashs</p>
        </div>
        <div className="rounded-lg border p-3 text-center sm:p-4">
          <Target className="mx-auto mb-1 h-4 w-4 text-red-500 sm:h-5 sm:w-5" />
          <p className="text-xl font-bold sm:text-2xl">{stats.aces}</p>
          <p className="text-[11px] text-muted-foreground sm:text-xs">Aces</p>
        </div>
        <div className="rounded-lg border p-3 text-center sm:p-4">
          <Wind className="mx-auto mb-1 h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
          <p className="text-xl font-bold sm:text-2xl">{stats.lobs}</p>
          <p className="text-[11px] text-muted-foreground sm:text-xs">Lobs</p>
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
                    <p className="text-xs font-medium sm:text-sm">
                      {new Date(m.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">Team {m.team} — {m.duration_minutes ? `${m.duration_minutes} min` : "—"}</p>
                  </div>
                  <div className="text-right">
                    {m.status === "completed" ? (
                      <>
                        <p className="font-mono text-xs font-semibold sm:text-sm">{m.score_team_a}</p>
                        <p className={`text-[11px] font-medium sm:text-xs ${isWinner ? "text-green-600" : "text-red-500"}`}>
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

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
            <Check className="h-4 w-4" />
            {shareToast}
          </div>
        </div>
      )}
    </div>
  )
}
