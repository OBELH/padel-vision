import { Metadata } from "next"
import HighlightPlayer from "./highlight-player"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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

const typeLabels: Record<string, string> = {
  smash: "Smash incroyable",
  ace: "Ace de folie",
  lob: "Lob parfait",
  point_gagnant: "Point magnifique",
  defense: "Défense spectaculaire",
  point: "Point magnifique",
}

async function fetchShareData(id: string): Promise<ShareData | null> {
  try {
    const res = await fetch(`${API_URL}/api/highlights/${id}/share`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await fetchShareData(id)
  if (!data) {
    return { title: "Highlight - Padel Vision" }
  }

  const label = typeLabels[data.type] || data.type
  const title = data.player_name
    ? `${label} de ${data.player_name}`
    : `${label} - Padel Vision`

  const teamA = data.team_a_players.join(" & ")
  const teamB = data.team_b_players.join(" & ")
  const scorePart = data.score_team_a ? ` | ${data.score_team_a} - ${data.score_team_b}` : ""
  const description = `${teamA} vs ${teamB}${scorePart}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      siteName: "Padel Vision",
      images: data.thumbnail_url ? [{ url: data.thumbnail_url, width: 640, height: 360, alt: title }] : [],
      videos: data.clip_url ? [{ url: data.clip_url, type: "video/mp4", width: 640, height: 360 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.thumbnail_url ? [data.thumbnail_url] : [],
    },
  }
}

export default async function ShareHighlightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await fetchShareData(id)

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Highlight non trouvé</p>
      </div>
    )
  }

  return <HighlightPlayer data={data} />
}
