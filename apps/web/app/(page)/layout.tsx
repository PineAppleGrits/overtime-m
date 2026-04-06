import { Footer } from "@/modules/common/components/Footer";
import { Header } from "@/modules/common/components/Header";
import { DniVerificationBanner } from "@/modules/common/components/DniVerificationBanner";
import { getProfile } from "@/lib/auth/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const profile = await getProfile()

    return (
        <main className="grid grid-rows-[auto_auto_1fr_auto] min-h-screen">
            <Header />
            <DniVerificationBanner show={!!profile && !profile.documentNumber} />
            {children}
            <Footer />
        </main>
    )
}
