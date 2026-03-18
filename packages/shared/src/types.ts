export interface Club {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  courts_count: number
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  email: string
  full_name: string
  nickname: string | null
  phone: string | null
  level: string | null
  club_id: string | null
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  club_id: string
  court_number: number | null
  scheduled_at: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  score_team_a: string | null
  score_team_b: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface MatchPlayer {
  id: string
  match_id: string
  player_id: string
  team: "A" | "B"
  position: string | null
}

export interface Highlight {
  id: string
  match_id: string
  player_id: string | null
  timestamp_sec: number | null
  type: "point" | "smash" | "lob" | "ace" | "other"
  description: string | null
  video_url: string | null
  created_at: string
}
