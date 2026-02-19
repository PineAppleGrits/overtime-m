import TournamentService from "@/modules/tournament/TournamentService"
import Link from "next/link"

export default async function TournamentPage({ params }: { params: Promise<{ tournamentSlug: string }> }) {
    const { tournamentSlug } = await params
    const tournament = await TournamentService.getTournamentBySlug(tournamentSlug)

    return (
        <div className="text-white">
            <h1 className="text-white text-2xl font-bold">{tournamentSlug}</h1>
            <h2>Categorias</h2>
                <ul className="list-disc list-inside">
                    {tournament.categories.map((category) => (
                        <li key={category.id}>
                            <Link href={`/torneos/${tournamentSlug}/${category.slug}`} className="text-ot-orange">
                                {category.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        )
    }