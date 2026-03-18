import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Nav() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Padel Vision
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/dashboard/club" className="text-sm font-medium hover:text-primary">
            Dashboard
          </Link>
          <Link href="/login">
            <Button size="sm">Login</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
