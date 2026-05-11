import TournamentService from "@/modules/tournament/TournamentService";
import { NavItem, Tournament } from "../types";
import { RecursiveNavItem } from "./RecursiveNavItem";
import Image from "next/image";
import { UserMenu } from "@/modules/common/components/UserMenu";
import { MobileNav } from "@/modules/common/components/MobileNav";
import { HeaderClientWrapper } from "./HeaderClientWrapper";
import { NotificationBell } from "@/modules/notifications/NotificationBell";
import { isPubliclyVisibleTournament } from "@/modules/tournament/constants";

const navItem: NavItem[] = [
    { id: "inicio", name: "inicio", href: "/" },
    { id: "torneos", name: "torneos", href: "/#" },
    { id: "amistosos", name: "amistosos", href: "/amistosos" },
    { id: "contacto", name: "contacto", href: "/contacto" }
]

const tournamentsToNavItems = (tournaments: Tournament[]): NavItem[] => {
    return tournaments.filter(isPubliclyVisibleTournament).map((tournament) => ({
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
        return []
    }
}

const TODOS_LOS_TORNEOS: NavItem = {
    id: "todos-los-torneos",
    name: "Todos los torneos",
    href: "/torneos",
}

export const Header = async () => {
    const torneos = await getTorneos()

    const torneosSubMenu: NavItem[] = [TODOS_LOS_TORNEOS, ...torneos]

    const navItems = navItem.map((item) =>
        item.id === "torneos" ? { ...item, subMenu: torneosSubMenu } : item
    );

    return (
        <HeaderClientWrapper>
            <nav className="flex justify-between items-center ot-container">
                <div className="py-1">
                    <Image src="/overtime_logo.png" alt="Overtime Logo" width={58} height={31} />
                </div>

                {/* Desktop nav */}
                <nav className="hidden lg:block">
                    <ul className="flex space-x-4">
                        {navItems.map((item) => (
                            <RecursiveNavItem key={item.id} item={item} />
                        ))}
                    </ul>
                </nav>

                {/* Desktop: bell + user menu */}
                <div className="hidden lg:flex items-center gap-1">
                    <NotificationBell variant="light" />
                    <UserMenu />
                </div>

                {/* Mobile: avatar + hamburger */}
                <MobileNav navItems={navItems} />
            </nav>
        </HeaderClientWrapper>
    )
} 
