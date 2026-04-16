import { ListOfTournaments } from "@/modules/tournament/components/ListOfTournaments"
import { SkeletonListOfTournaments } from "@/modules/tournament/components/SkeletonListOfTournaments"
import { Suspense } from "react"


export default function TournamentsPage() {
    return (
        <div className="min-h-screen bg-ot-background text-white">
            {/* Hero header */}
            <div className="relative bg-[#181525] overflow-hidden">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 50% at 50% 120%, rgba(59, 51, 106, 0.8) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background:
                            'radial-gradient(ellipse 40% 60% at 80% 0%, rgba(255, 59, 47, 0.4) 0%, transparent 60%)',
                    }}
                />

                <div className="relative ot-container py-12 md:py-16">
                    <h1 className="text-4xl md:text-5xl font-bold uppercase font-din-display text-ot-orange tracking-tight">
                        Torneos
                    </h1>
                    <p className="mt-3 max-w-lg text-[#a9a5bb] text-base md:text-lg">
                        Explorá los torneos disponibles e inscribí tu equipo.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="ot-container py-10 md:py-14">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
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
                        <div className="flex min-h-64 items-center justify-center rounded-sm border border-dashed border-[#3b336a]/50 bg-[#181525]/60 p-6 text-center">
                            <p className="text-sm text-[#a9a5bb]/50 font-din-display uppercase tracking-wide">Espacio publicitario</p>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
