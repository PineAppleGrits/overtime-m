export type Tournament = {
    id: string;
    name: string;
    slug: string;
    categories: Category[]
    hidden: boolean
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