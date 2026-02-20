import Link from "next/link";
import { NavItem } from "../types";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";

interface RecursiveNavItemProps {
    item: NavItem;
    depth?: number;
}

export const RecursiveNavItem = ({ item, depth = 0 }: RecursiveNavItemProps) => {
    const arrowClass = cn("icon w-4 h-4 transition-transform ml-2 text-xs", depth === 0 ? "text-white" : "text-ot-orange");

    return (
        <li className={cn("relative text-sm py-2 cursor-pointer group hover:[&>a>div>svg]:text-ot-orange hover:[&>ul]:block hover:[&>a>div>span.icon]:rotate-90 uppercase font-semibold",
            (depth > 1 || (item.subMenu && item.subMenu.length > 0)) && "hover:bg-ot-light-blue")}>
            <Link href={item.href} className="block w-full h-full px-4 py-2 text-gray-400" prefetch>
                <div className="flex justify-between items-center">
                    <span className={`group-hover:text-ot-orange ${depth === 0 ? "text-white" : "text-ot-orange"}`}>{item.name}</span>
                    {item.subMenu && item.subMenu.length > 0 && (
                        <ChevronDown className={arrowClass} />
                    )}
                </div>
            </Link>
            {item.subMenu && item.subMenu.length > 0 && (
                <ul
                    className={cn("absolute hidden text-ot-orange! shadow-lg w-64 z-50 bg-ot-dark-blue",
                        depth === 0 ? "top-full left-0" : "top-0 left-full",
                    )}
                >
                    {item.subMenu.map((subItem) => (
                        <RecursiveNavItem key={subItem.id} item={subItem} depth={depth + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
};
