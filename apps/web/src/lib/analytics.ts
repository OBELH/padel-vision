const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Track a page view event. Fire-and-forget (no await needed).
 */
export function trackView(entityType: string, entityId: string) {
  fetch(`${API_URL}/api/analytics/track-view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    }),
  }).catch(() => {}) // Fire and forget
}

/**
 * Track a share event. Fire-and-forget.
 */
export function trackShare(
  entityType: string,
  entityId: string,
  method: "webshare" | "clipboard",
) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640
  fetch(`${API_URL}/api/analytics/track-share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
      method,
      platform: isMobile ? "mobile" : "desktop",
    }),
  }).catch(() => {}) // Fire and forget
}
