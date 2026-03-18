"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Sparkles, Trophy, UserPlus } from "lucide-react"
import { apiAuthFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

interface NotifCount {
  unread: number
  total: number
}

const typeIcons: Record<string, React.ElementType> = {
  highlights_ready: Sparkles,
  match_completed: Trophy,
  welcome: UserPlus,
}

export function NotificationBell() {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState<NotifCount>({ unread: 0, total: 0 })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch unread count every 30s
  useEffect(() => {
    if (!user) return

    const fetchCount = () => {
      apiAuthFetch<NotifCount>("/api/notifications/count")
        .then(setCount)
        .catch(() => {})
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await apiAuthFetch<Notification[]>("/api/notifications/?limit=10")
      setNotifications(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const toggleOpen = () => {
    if (!open) {
      fetchNotifications()
    }
    setOpen(!open)
  }

  const handleClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.is_read) {
      try {
        await apiAuthFetch(`/api/notifications/${notif.id}/read`, { method: "PATCH" })
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
        setCount((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))
      } catch {
        // ignore
      }
    }
    // Navigate
    if (notif.link) {
      router.push(notif.link)
      setOpen(false)
    }
  }

  const markAllRead = async () => {
    try {
      await apiAuthFetch("/api/notifications/read-all", { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setCount((prev) => ({ ...prev, unread: 0 }))
    } catch {
      // ignore
    }
  }

  if (!user) return null

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "à l'instant"
    if (minutes < 60) return `il y a ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `il y a ${days}j`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        className="relative rounded-md p-2 hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count.unread > 9 ? "9+" : count.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {count.unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3 w-3" /> Tout lire
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                      !notif.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`mt-0.5 rounded-md p-1.5 ${
                      notif.type === "highlights_ready"
                        ? "bg-purple-100 text-purple-600"
                        : notif.type === "welcome"
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!notif.is_read ? "font-semibold" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
