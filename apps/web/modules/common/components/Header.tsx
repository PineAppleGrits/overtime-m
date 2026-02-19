import TournamentService from "@/modules/tournament/TournamentService";
import { NavItem, Tournament } from "../types";
import { RecursiveNavItem } from "./RecursiveNavItem";
import Image from "next/image";
import { UserMenu } from "@/components/UserMenu";

const navItem: NavItem[] = [
    { id: "inicio", name: "inicio", href: "/" },
    { id: "torneos", name: "torneos", href: "/#" },
    { id: "amistosos", name: "amistosos", href: "/amistosos" },
    { id: "contacto", name: "contacto", href: "/contacto" },
    { id: "inscripciones", name: "inscripciones", href: "/inscripciones" }
]

const tournamentsToNavItems = (tournaments: Tournament[]): NavItem[] => {
    return tournaments.filter((tournament) => !tournament.hidden).map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        href: `/torneos/${tournament.slug}`,
        subMenu: tournament.categories.filter((category) => !category.hidden).map((category) => ({
            id: category.id,
            name: category.name,
            href: `/torneos/${tournament.slug}/${category.slug}`
        }))
    }))
}

const getTorneos = async (): Promise<NavItem[]> => {
    try {
        const { data: tournaments } = await TournamentService.getTournaments()
        return tournamentsToNavItems(tournaments)
    } catch (error) {
        console.error(error)
        return [{
            id: "error",
            name: "Hubo un error al cargar los torneos",
            href: "#"
        }]
    }
}

export const Header = async () => {
    const torneos = await getTorneos()

    navItem.find((item) => item.id === "torneos")!.subMenu = torneos

    return (
        <header className="text-white bg-ot-dark-blue">
            <nav className="flex justify-between items-center ot-container">
                <div className="py-1">
                    <Image src="/overtime_logo.png" alt="Overtime Logo" width={58} height={31} />
                </div>
                <nav>
                    <ul className="flex space-x-4">
                        {navItem.map((item) => (
                            <RecursiveNavItem key={item.id} item={item} />
                        ))}
                    </ul>
                </nav>
                <UserMenu />
            </nav>
        </header>
    )
}