import { Footer } from "@/modules/common/components/Footer";
import { Header } from "@/modules/common/components/Header";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <main className="grid grid-rows-[auto_1fr_auto] min-h-screen">
            <Header />
            {children}
            <Footer />
        </main>
    )
}