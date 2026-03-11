import { ListOfTournaments } from "@/modules/tournament/components/ListOfTournaments"
import { SkeletonListOfTournaments } from "@/modules/tournament/components/SkeletonListOfTournaments"
import { Suspense } from "react"


export default function TournamentsPage() {
    return (
        <div className="ot-container py-10 md:py-14 text-white">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                    Torneos
                </h1>
                <p className="mt-2 text-white/60">
                    Explorá los torneos disponibles e inscribí tu equipo.
                </p>
            </header>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                {/* Tournament list — 3/4 */}
                <main className="w-full lg:w-3/4">
                    <Suspense fallback={<SkeletonListOfTournaments />}>
                        <ListOfTournaments />
                    </Suspense>
                </main>

                {/* Ad sidebar — 1/4 */}
                <aside
                    className="w-full lg:w-1/4 lg:sticky lg:top-6"
                    aria-label="Publicidad"
                >
                    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ot-dark-blue/20 p-6 text-center">
                        <p className="text-sm text-white/30">Espacio publicitario</p>
                    </div>
                </aside>
            </div>
        </div>
    )
}
