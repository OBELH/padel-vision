const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export interface ShareData {
  title: string
  text: string
  url: string
}

export function getHighlightShareUrl(highlightId: string): string {
  return `${SITE_URL}/share/highlight/${highlightId}`
}

export function getMatchShareUrl(matchId: string): string {
  return `${SITE_URL}/match/${matchId}`
}

export function getPlayerShareUrl(playerId: string): string {
  return `${SITE_URL}/player/${playerId}`
}

export async function shareContent(data: ShareData): Promise<"shared" | "copied" | "failed"> {
  // Web Share API (mobile browsers, some desktops)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data)
      return "shared"
    } catch (e) {
      if ((e as Error).name === "AbortError") return "failed"
      // Fall through to clipboard
    }
  }

  // Fallback: copy URL to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data.url)
      return "copied"
    } catch {
      return "failed"
    }
  }

  return "failed"
}
