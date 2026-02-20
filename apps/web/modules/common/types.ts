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
    slug: string;
    zones: Zone[]
    hidden: boolean
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