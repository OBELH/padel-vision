"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiFetch, apiUpload } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Share2, Zap, Target, Wind, Trophy, Upload, Film, Loader2, Play, Brain, Sparkles, Check, Copy } from "lucide-react"
import { shareContent, getHighlightShareUrl, getMatchShareUrl } from "@/lib/share"
import { trackView, trackShare } from "@/lib/analytics"

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
  confidence: number | null
  source: string | null
}

interface VideoStatus {
  has_video: boolean
  total_highlights: number
  clips_generated: number
  auto_highlights: number
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

export default function MatchClient() {
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState<string | null>(null)

  const fetchVideoStatus = () => {
    if (!params.id) return
    apiFetch<VideoStatus>(`/api/matches/${params.id}/video-status`).then(setVideoStatus).catch(() => {})
  }

  useEffect(() => {
    if (!params.id) return

    // Track page view
    trackView("match", params.id as string)

    apiFetch<MatchDetail>(`/api/matches/${params.id}`)
      .then(async (m) => {
        setMatch(m)
        apiFetch<Highlight[]>(`/api/matches/${params.id}/highlights`).then(setHighlights).catch(() => {})
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
      const m = await apiFetch<MatchDetail>(`/api/matches/${params.id}`)
      setMatch(m)
    } catch {
      // upload failed
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyzeVideo = async () => {
    if (!params.id) return
    setAnalyzing(true)
    setAnalysisResult(null)
    try {
      const result = await apiFetch<{ peaks_detected: number; highlights_created: number }>(`/api/matches/${params.id}/analyze-video`, { method: "POST" })
      setAnalysisResult(`${result.highlights_created} highlights détectés par l'IA`)
      const [hl, vs] = await Promise.all([
        apiFetch<Highlight[]>(`/api/matches/${params.id}/highlights`),
        apiFetch<VideoStatus>(`/api/matches/${params.id}/video-status`),
      ])
      setHighlights(hl)
      setVideoStatus(vs)
      const m = await apiFetch<MatchDetail>(`/api/matches/${params.id}`)
      setMatch(m)
    } catch {
      setAnalysisResult("Erreur lors de l'analyse")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateClips = async () => {
    if (!params.id) return
    setGenerating(true)
    try {
      await apiFetch(`/api/matches/${params.id}/generate-clips`, { method: "POST" })
      const [hl, vs] = await Promise.all([
        apiFetch<Highlight[]>(`/api/matches/${params.id}/highlights`),
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
    return <div className="p-4 text-muted-foreground sm:p-8">Chargement du match...</div>
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

  const getClipUrl = (clipPath: string) => {
    const normalized = clipPath.replace(/\\/g, "/")
    const idx = normalized.indexOf("uploads/")
    if (idx === -1) return `${API_URL}/${normalized}`
    return `${API_URL}/${normalized.substring(idx)}`
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Match Detail</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Court {match.court_number || "—"}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {match.duration_minutes ? `${match.duration_minutes} min` : "—"}</span>
            <span>{new Date(match.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={async () => {
          const teamANames = teamA.map(mp => players[mp.player_id]?.full_name).filter(Boolean).join(" & ")
          const teamBNames = teamB.map(mp => players[mp.player_id]?.full_name).filter(Boolean).join(" & ")
          const result = await shareContent({
            title: `${teamANames} vs ${teamBNames} - Padel Vision`,
            text: match.score_team_a ? `Score: ${match.score_team_a} - ${match.score_team_b}` : "Match de padel",
            url: getMatchShareUrl(match.id),
          })
          trackShare("match", match.id, result === "shared" ? "webshare" : "clipboard")
          if (result === "copied") {
            setShareToast("Lien copié !")
            setTimeout(() => setShareToast(null), 2000)
          }
        }}>
          <Share2 className="h-4 w-4" /> Partager
        </Button>
      </div>

      {/* Scoreboard */}
      {isCompleted && (
        <div className="mb-6 overflow-hidden rounded-xl border bg-gradient-to-r from-slate-50 to-slate-100 sm:mb-8 sm:rounded-2xl">
          <div className="grid grid-cols-3 gap-0">
            <div className={`p-3 text-center sm:p-6 ${winnerTeam === "A" ? "bg-green-50" : ""}`}>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">Team A</p>
              {teamA.map((mp) => {
                const p = players[mp.player_id]
                return p ? (
                  <Link key={mp.id} href={`/player/${p.id}`}>
                    <p className="text-xs font-semibold hover:text-primary sm:text-sm">{p.full_name}</p>
                    <p className="hidden text-xs text-muted-foreground sm:block">{mp.position}</p>
                  </Link>
                ) : null
              })}
              {winnerTeam === "A" && <p className="mt-1 text-[10px] font-bold text-green-600 sm:mt-2 sm:text-xs">VICTOIRE</p>}
            </div>
            <div className="flex flex-col items-center justify-center border-x p-3 sm:p-6">
              <p className="text-xl font-black tracking-wider sm:text-3xl">{match.score_team_a}</p>
              <div className="my-1 h-px w-8 bg-border sm:my-2 sm:w-12" />
              <p className="text-xl font-black tracking-wider sm:text-3xl">{match.score_team_b}</p>
            </div>
            <div className={`p-3 text-center sm:p-6 ${winnerTeam === "B" ? "bg-green-50" : ""}`}>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">Team B</p>
              {teamB.map((mp) => {
                const p = players[mp.player_id]
                return p ? (
                  <Link key={mp.id} href={`/player/${p.id}`}>
                    <p className="text-xs font-semibold hover:text-primary sm:text-sm">{p.full_name}</p>
                    <p className="hidden text-xs text-muted-foreground sm:block">{mp.position}</p>
                  </Link>
                ) : null
              })}
              {winnerTeam === "B" && <p className="mt-1 text-[10px] font-bold text-green-600 sm:mt-2 sm:text-xs">VICTOIRE</p>}
            </div>
          </div>
        </div>
      )}

      {/* Non-completed match info */}
      {!isCompleted && (
        <div className="mb-6 rounded-lg border p-4 text-center sm:mb-8 sm:p-6">
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
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Film className="h-5 w-5" /> Vidéo du match
          </h2>
          <div className="flex flex-wrap gap-2">
            {videoStatus?.has_video && (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-xs sm:gap-2 sm:text-sm"
                onClick={handleAnalyzeVideo}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" /> : <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                {analyzing ? "Analyse..." : "Analyser (IA)"}
              </Button>
            )}
            {videoStatus?.has_video && highlights.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
                onClick={handleGenerateClips}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" /> : <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                {generating ? "Génération..." : "Générer les clips"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" /> : <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              {uploading ? "Upload..." : "Uploader"}
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
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:p-12"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mb-2 h-6 w-6 sm:h-8 sm:w-8" />
            <p className="text-sm font-medium">Cliquez pour uploader la vidéo du match</p>
            <p className="text-xs">MP4, MOV, AVI — max 2 Go</p>
          </div>
        )}

        {videoStatus && videoStatus.clips_generated > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {videoStatus.clips_generated} / {videoStatus.total_highlights} clips générés
            {videoStatus.auto_highlights > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                <Sparkles className="h-3 w-3" /> {videoStatus.auto_highlights} auto IA
              </span>
            )}
          </p>
        )}
        {analysisResult && (
          <p className="mt-2 flex items-center gap-1 text-sm font-medium text-purple-600">
            <Sparkles className="h-4 w-4" /> {analysisResult}
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
                  <div key={h.id} className="rounded-lg border p-2.5 sm:p-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`mt-0.5 rounded-md p-1 sm:p-1.5 ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="text-xs font-semibold sm:text-sm">{h.type.charAt(0).toUpperCase() + h.type.slice(1)}</span>
                          {playerName && (
                            <span className="truncate text-[11px] text-muted-foreground sm:text-xs">— {playerName}</span>
                          )}
                          {h.source === "auto" && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                              <Sparkles className="h-2.5 w-2.5" /> IA
                              {h.confidence != null && <span className="ml-0.5">{h.confidence}%</span>}
                            </span>
                          )}
                        </div>
                        {h.description && <p className="text-xs text-muted-foreground sm:text-sm">{h.description}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                        {h.timestamp_sec != null && (
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:px-2 sm:text-xs">
                            {formatTime(h.timestamp_sec)}
                          </span>
                        )}
                        <button
                          onClick={async () => {
                            const url = getHighlightShareUrl(h.id)
                            const typeLabel = h.type.charAt(0).toUpperCase() + h.type.slice(1)
                            const result = await shareContent({
                              title: `${typeLabel} - Padel Vision`,
                              text: h.description || `${typeLabel} dans un match de padel`,
                              url,
                            })
                            trackShare("highlight", h.id, result === "shared" ? "webshare" : "clipboard")
                            if (result === "copied") {
                              setShareToast("Lien copié !")
                              setTimeout(() => setShareToast(null), 2000)
                            } else if (result === "shared") {
                              setShareToast("Partagé !")
                              setTimeout(() => setShareToast(null), 2000)
                            }
                          }}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Partager ce highlight"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {h.clip_path && (
                      <div className="mt-2 overflow-hidden rounded-md bg-black">
                        <video
                          controls
                          className="max-h-48 w-full"
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

      {/* Share toast notification */}
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
