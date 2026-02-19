import Link from "next/link"
import TournamentService from "../TournamentService"

const getTorneos = async ()=> {
    try {
        const data = await TournamentService.getTournaments()
        
        return data
    } catch (error) {
        console.error(error)
        return {
            data: [],
            meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
            }
        }
    }
}

export async function ListOfTournaments() {
    const {data: tournaments }	 = await getTorneos()
    const filteredTournaments = tournaments.filter((tournament) => !tournament.hidden)

    
    return (
        <ul>
            {filteredTournaments.map((tournament) => (
                <li key={tournament.id}>
                    <Link href={`/torneos/${tournament.slug}`} className="text-ot-orange">{tournament.name}</Link>
                </li>
            ))}
        </ul>
    )
}
