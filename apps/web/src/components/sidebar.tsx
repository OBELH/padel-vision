"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutDashboard, Users, Trophy, BarChart3, Settings, ChevronDown } from "lucide-react"

const links = [
  { href: "/dashboard/club", label: "Club", icon: LayoutDashboard },
  { href: "/dashboard/club", label: "Players", icon: Users },
  { href: "/dashboard/club", label: "Matches", icon: Trophy },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/club", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile: horizontal collapsible bar */}
      <div className="border-b bg-muted/40 md:hidden">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setOpen(!open)}
        >
          <span>Navigation</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <nav className="flex flex-wrap gap-1 px-4 pb-3">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden w-60 border-r bg-muted/40 p-4 md:block">
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
