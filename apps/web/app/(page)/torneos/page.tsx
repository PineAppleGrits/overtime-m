import { ListOfTournaments } from "@/modules/tournament/components/ListOfTournaments"
import { SkeletonListOfTournaments } from "@/modules/tournament/components/SkeletonListOfTournaments"
import { Suspense } from "react"


export default function TournamentsPage() {
    return (
        <div className=" text-white max-w-8xl mx-auto">
            <Suspense fallback={<SkeletonListOfTournaments />}>
                <ListOfTournaments />
            </Suspense>
        </div>
    )
}