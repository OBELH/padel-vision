"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { NotificationBell } from "@/components/notification-bell"

export function Nav() {
  const [open, setOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    setOpen(false)
    router.push("/")
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
        <Link href="/" className="text-lg font-bold text-primary sm:text-xl">
          Padel Vision
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/dashboard/club" className="text-sm font-medium hover:text-primary">
            Dashboard
          </Link>
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {user.full_name}
                </span>
                <Button size="sm" variant="outline" onClick={handleLogout} className="gap-1.5">
                  <LogOut className="h-3.5 w-3.5" /> Déconnexion
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            )
          )}
        </nav>

        {/* Mobile: notification bell + hamburger */}
        <div className="flex items-center gap-1 sm:hidden">
          {user && <NotificationBell />}
          <button
            className="rounded-md p-2 hover:bg-accent"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="border-t px-4 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/dashboard/club"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            {!loading && (
              user ? (
                <>
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleLogout} className="mt-1 w-full gap-1.5">
                    <LogOut className="h-3.5 w-3.5" /> Déconnexion
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button size="sm" className="mt-2 w-full">Login</Button>
                </Link>
              )
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
