import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/utils/cn";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { getProfile } from "@/lib/auth/session";
import "./globals.css";
import { getUser } from "@/lib/supabase/getSessionSsr";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Overtime",
  description: "Mejor organizador de torneos privados de básquet en Argentina",
};

/**
 * Root Layout - Server Component
 * Obtiene la sesión y profile server-side y los pasa al AuthProvider
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obtener usuario y profile server-side
  const user = await getUser();
  const profile = user ? await getProfile() : null;

  return (
    <html lang="es" className="dark">
      <body className={cn(geistSans.variable, geistMono.variable, "antialiased")}>
        <QueryProvider>
          <AuthProvider serverUser={user} serverProfile={profile}>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
