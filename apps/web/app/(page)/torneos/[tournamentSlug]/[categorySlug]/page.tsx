import TournamentService from "@/modules/tournament/TournamentService"

export default async function CategoryPage({ params }: { params: Promise<{ tournamentSlug: string, categorySlug: string }> }) {
    const { tournamentSlug, categorySlug } = await params
    const category = await TournamentService.getCategoryBySlug(tournamentSlug, categorySlug)

    return (
        <div className="text-white">
            <h1 className="text-white text-2xl font-bold">{categorySlug}</h1>
            <ul>
                {category.zones.map((zone) => (
                    <li key={zone.id}>{zone.name}</li>
                ))}
            </ul>
        </div>
    )
}