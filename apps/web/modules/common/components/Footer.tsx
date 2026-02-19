import Image from "next/image"
import Link from "next/link"

const socialLinks = [
    {
        href: "https://tiktok.com",
        src: "/social/tiktok.png",
        alt: "tiktok"
    },
    {
        href: "https://www.youtube.com/@mediaovertime",
        src: "/social/youtube.png",
        alt: "youtube"
    },
    {
        href: "https://www.instagram.com/overtime.basquet/?hl=es",
        src: "/social/instagram.png",
        alt: "instagram"
    }
]

export const Footer = () => {
    return (
        <footer className="bg-newbox py-8 bg-ot-dark-blue text-white">
            <div className="ot-container  flex items-center justify-between">
                <Link
                    href="#"
                    target="_blank"
                >
                    <p>Web by Someone</p>
                </Link>
                <div className="flex justify-center items-center h-full w-1/3 cursor-default">
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <Image
                            src="/overtime_logo.png"
                            className="h-8"
                            alt="logo"
                            width={41}
                            height={31}
                        />
                        <p className="font-din-display font-bold uppercase text-blanco text-center text-xs sm:text-sm">
                            Overtime 2023 - {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-evenly gap-3">
                        {socialLinks.map((link) => (
                            <Link href={link.href} target="_blank" key={link.alt}>
                                <Image
                                    src={link.src}
                                    alt={link.alt}
                                    width={27}
                                    height={27}
                                />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}