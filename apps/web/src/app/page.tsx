import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4 text-center sm:min-h-[calc(100vh-4rem)] sm:gap-8">
      <div className="space-y-3 sm:space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Every match tells a <span className="text-primary">story</span>
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
          Transformez chaque match de padel en highlights, stats et contenu partageable.
          Automatiquement.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Link href="/login">
          <Button size="lg" className="w-full sm:w-auto">Commencer</Button>
        </Link>
        <Link href="/dashboard/club">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">Dashboard Club</Button>
        </Link>
      </div>
      <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:mt-16 sm:gap-8 md:grid-cols-3">
        {[
          { title: "Auto-highlights", desc: "Vos meilleurs points, montés automatiquement" },
          { title: "Match Card", desc: "Votre carte de stats, partageable en un tap" },
          { title: "Classement amis", desc: "Comparez-vous avec vos potes, pas le monde entier" },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border p-5 text-left sm:p-6">
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
