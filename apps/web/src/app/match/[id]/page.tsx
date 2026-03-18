"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiFetch, apiUpload } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Share2, Zap, Target, Wind, Trophy, Upload, Film, Loader2, Play } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Player {
  id: string
  full_name: string
  nickname: string | null
  level: string | null
}

interface MatchPlayer {
  id: string
  player_id: string
  team: string
  position: string | null
}

interface MatchDetail {
  id: string
  club_id: string
  court_number: number | null
  scheduled_at: string
  status: string
  score_team_a: string | null
  score_team_b: string | null
  duration_minutes: number | null
  video_path: string | null
  match_players: MatchPlayer[]
}

interface Highlight {
  id: string
  match_id: string
  player_id: string | null
  timestamp_sec: number | null
  type: string
  description: string | null
  clip_path: string | null
  thumbnail_path: string | null
}

interface VideoStatus {
  has_video: boolean
  total_highlights: number
  clips_generated: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

const highlightIcons: Record<string, { icon: React.ElementType; color: string }> = {
  smash: { icon: Zap, color: "text-yellow-500 bg-yellow-50" },
  ace: { icon: Target, color: "text-red-500 bg-red-50" },
  lob: { icon: Wind, color: "text-blue-500 bg-blue-50" },
  point: { icon: Trophy, color: "text-green-500 bg-green-50" },
}

export default function MatchPage() {
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchVideoStatus = () => {
    if (!params.id) return
    apiFetch<VideoStatus>(`/api/matches/${params.id}/video-status`).then(setVideoStatus).catch(() => {})
  }

  useEffect(() => {
    if (!params.id) return

    apiFetch<MatchDetail>(`/api/matches/${params.id}`)
      .then(async (m) => {
        setMatch(m)
        apiFetch<Highlight[]>(`/api/matches/${params.id}/highlights/`).then(setHighlights).catch(() => {})
        const playerMap: Record<string, Player> = {}
        await Promise.all(
          m.match_players.map((mp) =>
            apiFetch<Player>(`/api/players/${mp.player_id}`)
              .then((p) => { playerMap[p.id] = p })
              .catch(() => {})
          )
        )
        setPlayers(playerMap)
      })
      .catch(() => setMatch(null))

    fetchVideoStatus()
  }, [params.id])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !params.id) return
    setUploading(true)
    try {
      await apiUpload(`/api/matches/${params.id}/upload-video`, file)
      fetchVideoStatus()
      // Refresh match to get video_path
      const m = await apiFetch<MatchDetail>(`/api/matches/${params.id}`)
      setMatch(m)
    } catch {
      // upload failed
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateClips = async () => {
    if (!params.id) return
    setGenerating(true)
    try {
      await apiFetch(`/api/matches/${params.id}/generate-clips`, { method: "POST" })
      // Refresh highlights and video status
      const [hl, vs] = await Promise.all([
        apiFetch<Highlight[]>(`/api/matches/${params.id}/highlights/`),
        apiFetch<VideoStatus>(`/api/matches/${params.id}/video-status`),
      ])
      setHighlights(hl)
      setVideoStatus(vs)
    } catch {
      // generation failed
    } finally {
      setGenerating(false)
    }
  }

  if (!match) {
    return <div className="p-8 text-muted-foreground">Chargement du match...</div>
  }

  const teamA = match.match_players.filter((mp) => mp.team === "A")
  const teamB = match.match_players.filter((mp) => mp.team === "B")
  const isCompleted = match.status === "completed"

  let winnerTeam: string | null = null
  if (isCompleted && match.score_team_a && match.score_team_b) {
    const setsA = match.score_team_a.split(" ").filter(s => s.includes("-")).filter(s => parseInt(s.split("-")[0]) > parseInt(s.split("-")[1])).length
    const setsB = match.score_team_b.split(" ").filter(s => s.includes("-")).filter(s => parseInt(s.split("-")[0]) > parseInt(s.split("-")[1])).length
    winnerTeam = setsA > setsB ? "A" : setsB > setsA ? "B" : null
  }

  // Build clip URL from clip_path (converts absolute path to /uploads/... URL)
  const getClipUrl = (clipPath: string) => {
    const idx = clipPath.indexOf("uploads/")
    if (idx === -1) return `${API_URL}/${clipPath}`
    return `${API_URL}/${clipPath.substring(idx)}`
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Match Detail</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Court {match.court_number || "—"}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {match.duration_minutes ? `${match.duration_minutes} min` : "—"}</span>
            <span>{new Date(match.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" /> Partager
        </Button>
      </div>

      {/* Scoreboard */}
      {isCompleted && (
        <div className="mb-8 overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="grid grid-cols-3 gap-0">
            <div className={`p-6 text-center ${winnerTeam === "A" ? "bg-green-50" : ""}`}>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Team A</p>
              {teamA.map((mp) => {
                const p = players[mp.player_id]
                return p ? (
                  <Link key={mp.id} href={`/player/${p.id}`}>
                    <p className="text-sm font-semibold hover:text-primary">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{mp.position}</p>
                  </Link>
                ) : null
              })}
              {winnerTeam === "A" && <p className="mt-2 text-xs font-bold text-green-600">VICTOIRE</p>}
            </div>
            <div className="flex flex-col items-center justify-center border-x p-6">
              <p className="text-3xl font-black tracking-wider">{match.score_team_a}</p>
              <div className="my-2 h-px w-12 bg-border" />
              <p className="text-3xl font-black tracking-wider">{match.score_team_b}</p>
            </div>
            <div className={`p-6 text-center ${winnerTeam === "B" ? "bg-green-50" : ""}`}>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Team B</p>
              {teamB.map((mp) => {
                const p = players[mp.player_id]
                return p ? (
                  <Link key={mp.id} href={`/player/${p.id}`}>
                    <p className="text-sm font-semibold hover:text-primary">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{mp.position}</p>
                  </Link>
                ) : null
              })}
              {winnerTeam === "B" && <p className="mt-2 text-xs font-bold text-green-600">VICTOIRE</p>}
            </div>
          </div>
        </div>
      )}

      {/* Non-completed match info */}
      {!isCompleted && (
        <div className="mb-8 rounded-lg border p-6 text-center">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">{match.status}</span>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Team A</p>
              {teamA.map((mp) => {
                const p = players[mp.player_id]
                return p ? <p key={mp.id} className="text-sm font-semibold">{p.full_name}</p> : null
              })}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Team B</p>
              {teamB.map((mp) => {
                const p = players[mp.player_id]
                return p ? <p key={mp.id} className="text-sm font-semibold">{p.full_name}</p> : null
              })}
            </div>
          </div>
        </div>
      )}

      {/* Video Section */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Film className="h-5 w-5" /> Vidéo du match
          </h2>
          <div className="flex gap-2">
            {videoStatus?.has_video && highlights.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleGenerateClips}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {generating ? "Génération..." : "Générer les clips"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Upload..." : "Uploader vidéo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        {videoStatus?.has_video ? (
          <div className="overflow-hidden rounded-lg border bg-black">
            <video
              controls
              className="w-full"
              src={`${API_URL}/uploads/matches/${params.id}/full.mp4`}
            />
          </div>
        ) : (
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">Cliquez pour uploader la vidéo du match</p>
            <p className="text-xs">MP4, MOV, AVI — max 2 Go</p>
          </div>
        )}

        {videoStatus && videoStatus.clips_generated > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {videoStatus.clips_generated} / {videoStatus.total_highlights} clips générés
          </p>
        )}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Highlights</h2>
          <div className="space-y-2">
            {highlights
              .sort((a, b) => (a.timestamp_sec || 0) - (b.timestamp_sec || 0))
              .map((h) => {
                const cfg = highlightIcons[h.type] || highlightIcons.point
                const Icon = cfg.icon
                const playerName = h.player_id ? players[h.player_id]?.full_name : null
                return (
                  <div key={h.id} className="rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-md p-1.5 ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{h.type.charAt(0).toUpperCase() + h.type.slice(1)}</span>
                          {playerName && (
                            <span className="text-xs text-muted-foreground">— {playerName}</span>
                          )}
                        </div>
                        {h.description && <p className="text-sm text-muted-foreground">{h.description}</p>}
                      </div>
                      {h.timestamp_sec != null && (
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                          {formatTime(h.timestamp_sec)}
                        </span>
                      )}
                    </div>
                    {h.clip_path && (
                      <div className="mt-2 overflow-hidden rounded-md bg-black">
                        <video
                          controls
                          className="w-full max-h-48"
                          poster={h.thumbnail_path ? getClipUrl(h.thumbnail_path) : undefined}
                          src={getClipUrl(h.clip_path)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
