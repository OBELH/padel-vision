"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Users, Trophy, MapPin, Activity } from "lucide-react"

interface Club {
  id: string
  name: string
  city: string | null
  courts_count: number
  email: string | null
  address: string | null
}

interface ClubStats {
  total_matches: number
  completed_matches: number
  total_players: number
  courts_count: number
}

interface Player {
  id: string
  full_name: string
  nickname: string | null
  level: string | null
}

interface Match {
  id: string
  court_number: number | null
  scheduled_at: string
  status: string
  score_team_a: string | null
  score_team_b: string | null
  duration_minutes: number | null
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  )
}

function LevelBadge({ level }: { level: string | null }) {
  const colors: Record<string, string> = {
    beginner: "bg-gray-100 text-gray-600",
    intermediate: "bg-blue-100 text-blue-600",
    advanced: "bg-purple-100 text-purple-600",
    pro: "bg-yellow-100 text-yellow-700",
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[level || ""] || "bg-gray-100 text-gray-600"}`}>
      {level || "N/A"}
    </span>
  )
}

export default function ClubDashboard() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [stats, setStats] = useState<ClubStats | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Club[]>("/api/clubs/")
      .then((data) => {
        setClubs(data)
        if (data.length > 0) setSelectedClub(data[0])
      })
      .catch(() => setClubs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedClub) return
    Promise.all([
      apiFetch<ClubStats>(`/api/clubs/${selectedClub.id}/stats`).catch(() => null),
      apiFetch<Player[]>(`/api/players/?club_id=${selectedClub.id}`).catch(() => []),
      apiFetch<Match[]>(`/api/matches/?club_id=${selectedClub.id}`).catch(() => []),
    ]).then(([s, p, m]) => {
      setStats(s)
      setPlayers(p)
      setMatches(m)
    })
  }, [selectedClub])

  if (loading) return <div className="p-8 text-muted-foreground">Chargement...</div>
  if (clubs.length === 0) return <div className="p-8 text-muted-foreground">Aucun club trouvé.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{selectedClub?.name}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" /> {selectedClub?.city} — {selectedClub?.address}
          </p>
        </div>
        {clubs.length > 1 && (
          <select
            className="rounded-md border px-3 py-1.5 text-sm"
            value={selectedClub?.id}
            onChange={(e) => setSelectedClub(clubs.find((c) => c.id === e.target.value) || null)}
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={MapPin} label="Terrains" value={stats.courts_count} />
          <StatCard icon={Users} label="Joueurs" value={stats.total_players} />
          <StatCard icon={Trophy} label="Matchs joués" value={stats.completed_matches} />
          <StatCard icon={Activity} label="Total matchs" value={stats.total_matches} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Matchs récents</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Terrain</th>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-left font-medium">Score</th>
                <th className="px-4 py-2 text-left font-medium">Durée</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-2">Court {m.court_number || "—"}</td>
                  <td className="px-4 py-2">{new Date(m.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-2 font-mono">{m.score_team_a || "—"}</td>
                  <td className="px-4 py-2">{m.duration_minutes ? `${m.duration_minutes} min` : "—"}</td>
                  <td className="px-4 py-2"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-2">
                    <Link href={`/match/${m.id}`}>
                      <Button variant="ghost" size="sm">Voir</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Joueurs du club</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <Link key={p.id} href={`/player/${p.id}`} className="block">
              <div className="rounded-lg border p-4 transition-colors hover:bg-accent/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.full_name}</p>
                    {p.nickname && <p className="text-xs text-muted-foreground">&quot;{p.nickname}&quot;</p>}
                  </div>
                  <LevelBadge level={p.level} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
