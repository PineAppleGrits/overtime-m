import Link from "next/link";
import { NavItem } from "../types";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";

interface RecursiveNavItemProps {
    item: NavItem;
    depth?: number;
}

export const RecursiveNavItem = ({ item, depth = 0 }: RecursiveNavItemProps) => {
    const arrowClass = cn("icon size-4 shrink-0 transition-transform duration-200 ml-2 text-xs", 
        depth === 0 ? "text-white" : "text-ot-orange");

    return (
        <li className={cn("relative group text-sm py-2 cursor-pointer hover:[&>a>div>svg]:rotate-180 hover:[&>a>div>svg]:text-ot-orange hover:[&>ul]:block uppercase font-semibold",
            depth > 0 && "",
            (depth > 1 || (item.subMenu && item.subMenu.length > 0)) && "hover:bg-ot-light-blue/90",
            depth > 1 && "bg-linear-to-r from-ot-dark-blue/30 to-ot-light-blue/70 hover:bg-purple-950")}>
            <Link href={item.href} className="block size-full px-4 py-2 text-gray-400" prefetch>
                <div className="flex justify-between items-center">
                    <span className={cn(depth === 0 ? "text-white group-hover:text-ot-orange" : "text-ot-orange ")}>{item.name}</span>
                    {item.subMenu && item.subMenu.length > 0 && (
                        <ChevronDown className={arrowClass} />
                    )}
                </div>
            </Link>
            {item.subMenu && item.subMenu.length > 0 && (
                <ul
                    className={cn("absolute hidden shadow-lg w-64 z-50 bg-ot-light-blue",
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
