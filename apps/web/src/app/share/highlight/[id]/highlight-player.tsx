"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Share2, Play, Zap, Target, Wind, Trophy, Shield, Sparkles, Copy, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { shareContent } from "@/lib/share"
import { trackView, trackShare } from "@/lib/analytics"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

interface ShareData {
  highlight_id: string
  type: string
  description: string | null
  timestamp_sec: number | null
  confidence: number | null
  source: string | null
  player_name: string | null
  match_id: string
  match_date: string | null
  score_team_a: string | null
  score_team_b: string | null
  team_a_players: string[]
  team_b_players: string[]
  clip_url: string | null
  thumbnail_url: string | null
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  smash: { icon: Zap, color: "text-yellow-400", gradient: "from-yellow-900/50 to-black" },
  ace: { icon: Target, color: "text-red-400", gradient: "from-red-900/50 to-black" },
  lob: { icon: Wind, color: "text-blue-400", gradient: "from-blue-900/50 to-black" },
  point_gagnant: { icon: Trophy, color: "text-green-400", gradient: "from-green-900/50 to-black" },
  point: { icon: Trophy, color: "text-green-400", gradient: "from-green-900/50 to-black" },
  defense: { icon: Shield, color: "text-purple-400", gradient: "from-purple-900/50 to-black" },
}

const typeLabels: Record<string, string> = {
  smash: "Smash",
  ace: "Ace",
  lob: "Lob",
  point_gagnant: "Point gagnant",
  point: "Point",
  defense: "Défense",
}

export default function HighlightPlayer({ data }: { data: ShareData }) {
  const [copied, setCopied] = useState(false)

  // Track highlight view on mount
  useEffect(() => {
    trackView("highlight", data.highlight_id)
  }, [data.highlight_id])

  const cfg = typeConfig[data.type] || typeConfig.point
  const Icon = cfg.icon
  const label = typeLabels[data.type] || data.type

  const teamA = data.team_a_players.join(" & ")
  const teamB = data.team_b_players.join(" & ")
  const matchDate = data.match_date
    ? new Date(data.match_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null

  const handleShare = async () => {
    const result = await shareContent({
      title: data.player_name ? `${label} de ${data.player_name}` : `${label} - Padel Vision`,
      text: data.description || "",
      url: `${SITE_URL}/share/highlight/${data.highlight_id}`,
    })
    trackShare("highlight", data.highlight_id, result === "shared" ? "webshare" : "clipboard")
    if (result === "copied") {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${cfg.gradient}`}>
      {/* Video Player */}
      <div className="relative">
        {data.clip_url ? (
          <video
            controls
            autoPlay
            playsInline
            className="w-full aspect-video bg-black"
            poster={data.thumbnail_url || undefined}
            src={data.clip_url}
          />
        ) : data.thumbnail_url ? (
          <div className="relative w-full aspect-video bg-black">
            <img src={data.thumbnail_url} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-black flex items-center justify-center">
            <p className="text-white/50">Vidéo non disponible</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-4 sm:py-6">
        {/* Type Badge + Player */}
        <div className="mb-4 flex items-center gap-3">
          <div className={`rounded-lg bg-white/10 p-2 backdrop-blur-sm ${cfg.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{label}</h1>
              {data.source === "auto" && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                  <Sparkles className="h-3 w-3" /> IA
                </span>
              )}
            </div>
            {data.player_name && (
              <p className="text-sm text-white/70">{data.player_name}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="mb-4 text-white/80">{data.description}</p>
        )}

        {/* Match Context */}
        <div className="mb-6 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-white/50 uppercase">Team A</p>
              <p className="text-sm font-medium text-white">{teamA || "—"}</p>
            </div>
            <div>
              {data.score_team_a ? (
                <>
                  <p className="text-lg font-black text-white">{data.score_team_a}</p>
                  <p className="text-lg font-black text-white/50">{data.score_team_b}</p>
                </>
              ) : (
                <p className="text-sm text-white/50">vs</p>
              )}
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase">Team B</p>
              <p className="text-sm font-medium text-white">{teamB || "—"}</p>
            </div>
          </div>
          {matchDate && (
            <p className="mt-2 text-center text-xs text-white/40">{matchDate}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            onClick={handleShare}
            className="flex-1 gap-2 bg-white text-black hover:bg-white/90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Lien copié !" : "Partager"}
          </Button>
          <Link href={`/match/${data.match_id}`} className="flex-1">
            <Button variant="outline" className="w-full gap-2 border-white/20 text-white hover:bg-white/10">
              <ArrowRight className="h-4 w-4" /> Voir le match
            </Button>
          </Link>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-semibold text-green-400 hover:text-green-300">
            Padel Vision
          </Link>
          <p className="mt-1 text-xs text-white/30">Every match tells a story</p>
        </div>
      </div>
    </div>
  )
}
