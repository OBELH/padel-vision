import { Metadata } from "next"
import MatchClient from "./match-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

interface MatchMeta {
  id: string
  scheduled_at: string
  status: string
  score_team_a: string | null
  score_team_b: string | null
  match_players: { player_id: string; team: string }[]
}

interface PlayerMeta {
  id: string
  full_name: string
}

async function fetchMatchMeta(id: string): Promise<{ match: MatchMeta | null; players: PlayerMeta[] }> {
  try {
    const res = await fetch(`${API_URL}/api/matches/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return { match: null, players: [] }
    const match: MatchMeta = await res.json()

    // Fetch player names
    const players: PlayerMeta[] = []
    await Promise.all(
      match.match_players.map(async (mp) => {
        try {
          const pRes = await fetch(`${API_URL}/api/players/${mp.player_id}`, { next: { revalidate: 300 } })
          if (pRes.ok) {
            const p: PlayerMeta = await pRes.json()
            players.push(p)
          }
        } catch {}
      })
    )
    return { match, players }
  } catch {
    return { match: null, players: [] }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { match, players } = await fetchMatchMeta(id)

  if (!match) {
    return {
      title: "Match - Padel Vision",
      description: "Détails du match de padel",
    }
  }

  const playerNames = players.map((p) => p.full_name)
  const teamANames = match.match_players
    .filter((mp) => mp.team === "A")
    .map((mp) => players.find((p) => p.id === mp.player_id)?.full_name)
    .filter(Boolean)
    .join(" & ")
  const teamBNames = match.match_players
    .filter((mp) => mp.team === "B")
    .map((mp) => players.find((p) => p.id === mp.player_id)?.full_name)
    .filter(Boolean)
    .join(" & ")

  const title = teamANames && teamBNames
    ? `${teamANames} vs ${teamBNames} - Padel Vision`
    : "Match de padel - Padel Vision"

  const scoreText = match.score_team_a && match.score_team_b
    ? `Score: ${match.score_team_a} - ${match.score_team_b}`
    : ""

  const date = new Date(match.scheduled_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const description = [
    scoreText,
    `Match du ${date}`,
    playerNames.length > 0 ? `Joueurs: ${playerNames.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ")

  const url = `${SITE_URL}/match/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Padel Vision",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default function MatchPage() {
  return <MatchClient />
}
