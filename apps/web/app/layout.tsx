import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/utils/cn";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { headers } from "next/headers";
import "./globals.css";

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

async function getAuthDataFromProxy() {
  const headersList = await headers();
  const raw = headersList.get("x-auth-data");

  if (!raw) return { user: null, profile: null };

  try {
    return JSON.parse(raw) as { user: Record<string, unknown> | null; profile: Record<string, unknown> | null };
  } catch {
    return { user: null, profile: null };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await getAuthDataFromProxy();

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
