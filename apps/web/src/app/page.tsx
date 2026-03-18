import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Every match tells a <span className="text-primary">story</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Transformez chaque match de padel en highlights, stats et contenu partageable.
          Automatiquement.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/login">
          <Button size="lg">Commencer</Button>
        </Link>
        <Link href="/dashboard/club">
          <Button variant="outline" size="lg">Dashboard Club</Button>
        </Link>
      </div>
      <div className="mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
        {[
          { title: "Auto-highlights", desc: "Vos meilleurs points, montés automatiquement" },
          { title: "Match Card", desc: "Votre carte de stats, partageable en un tap" },
          { title: "Classement amis", desc: "Comparez-vous avec vos potes, pas le monde entier" },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border p-6 text-left">
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
