export type Tournament = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    registrationStartDate?: string | null;
    registrationEndDate?: string | null;
    categories: Category[];
    hidden: boolean;
}

export type Category = {
    id: string;
    name: string;
    slug?: string;
    zones: Zone[];
    hidden?: boolean;
    teamsPerZone?: number | null;
    tournament?: { id: string; name: string; slug: string; status?: string; sportId?: string };
    registrations?: { team?: { id: string; name: string; logoUrl?: string }; status?: string; requester?: { id: string } }[];
    _count?: { zones: number; registrations: number; matches: number };
}

export type Zone = {
    id: string;
    name: string;
    slug: string;
    teams: Team[]
    hidden: boolean
}

export type Team = {
    id: string;
    name: string;
    slug: string;
}

export type NavItem = {
    id: string;
    name: string;
    href: string;
    subMenu?: NavItem[];
}