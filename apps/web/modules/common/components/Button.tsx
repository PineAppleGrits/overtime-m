import { cn } from "@/utils/cn";

const baseStyles = "bg-ot-orange text-white px-4 inline py-2 rounded-md hover:bg-ot-orange/80 transition-all duration-300 cursor-pointer";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type Props = ButtonProps | AnchorProps;

function isAnchorProps(props: Props): props is AnchorProps {
    return "href" in props && props.href != null;
}

export function Button(props: Props) {
    const className = cn(baseStyles, props.className);

    if (isAnchorProps(props)) {
        return <a {...props} className={className} />;
    }

    return <button {...props} className={className} />;
}
