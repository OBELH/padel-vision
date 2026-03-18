import Link from "next/link"
import { LayoutDashboard, Users, Trophy, Settings } from "lucide-react"

const links = [
  { href: "/dashboard/club", label: "Club", icon: LayoutDashboard },
  { href: "/dashboard/club", label: "Players", icon: Users },
  { href: "/dashboard/club", label: "Matches", icon: Trophy },
  { href: "/dashboard/club", label: "Settings", icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="w-60 border-r bg-muted/40 p-4">
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
  )
}
