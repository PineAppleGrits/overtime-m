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
            <Suspense fallback={<SkeletonListOfTournaments />}>
                <ListOfTournaments />
            </Suspense>
        </div>
    )
}