import Link from "next/link";
import {
  Trophy,
  Users,
  Calendar,
  Zap,
  ChevronRight,
  CheckCircle2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-ot-background text-white overflow-hidden">
      {/* Hero */}
      <section className="relative ot-container pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="absolute inset-0 bg-linear-to-b from-ot-dark-blue/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-ot-orange/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-ot-light-blue/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-ot-light-blue/50 bg-ot-dark-blue/50 px-4 py-1.5 text-sm text-white/90 mb-6">
            <Award className="h-4 w-4 text-ot-orange" />
            <span>Básquet en Argentina</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Jugá. Competí.{" "}
            <span className="text-ot-orange">Ganá.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl">
            Unite a los mejores torneos privados de básquet. Inscripción simple,
            fixtures al día y toda la emoción en la cancha.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild className={cn(
              "bg-ot-orange! hover:bg-ot-orange/90! text-white! border-0!",
              "h-12 px-8 text-base font-semibold rounded-lg shadow-lg shadow-ot-orange/25"
            )}>
              <Link href="/torneos" className="inline-flex items-center justify-center gap-2">
                Ver torneos abiertos
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={cn(
                "border-white/30! bg-transparent! text-white! hover:bg-white/10! hover:text-white!",
                "h-12 px-8 text-base font-semibold rounded-lg"
              )}
            >
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative ot-container py-20 md:py-28 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ¿Por qué sumarte?
          </h2>
          <p className="mt-4 text-white/70 text-lg">
            Todo lo que necesitás para competir en torneos serios, sin vueltas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            {
              icon: Trophy,
              title: "Torneos organizados",
              description:
                "Fixture, resultados y posiciones en un solo lugar. Sin planillas ni WhatsApp.",
            },
            {
              icon: Calendar,
              title: "Fechas claras",
              description:
                "Sabé cuándo y dónde jugás. Recordatorios y cambios al instante.",
            },
            {
              icon: Users,
              title: "Equipos y categorías",
              description:
                "Inscribí tu equipo o sumate a uno. Categorías por nivel para jugar parejo.",
            },
            {
              icon: Zap,
              title: "Inscripción rápida",
              description:
                "Menos trámites, más cancha. Pagás y quedás inscripto.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className={cn(
                "rounded-2xl border border-white/10 bg-ot-dark-blue/30 p-6",
                "hover:border-ot-orange/30 hover:bg-ot-dark-blue/50 transition-all duration-300"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ot-orange/20 text-ot-orange mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/70">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative ot-container py-20 md:py-28 bg-ot-dark-blue/20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Cómo participar
          </h2>
          <p className="mt-4 text-white/70 text-lg">
            Tres pasos y estás adentro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {[
            {
              step: "1",
              title: "Elegí un torneo",
              description: "Entrá a torneos, mirá categorías y fechas. Elegí el que te cierre.",
            },
            {
              step: "2",
              title: "Inscribite",
              description: "Completá los datos de tu equipo o unite a uno existente. Pagá y listo.",
            },
            {
              step: "3",
              title: "Jugá",
              description: "Consultá fixture y resultados desde la app. Solo queda ganar.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center relative">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ot-orange text-white font-bold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-white/70">{item.description}</p>
              {item.step !== "3" && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-linear-to-r from-ot-orange/50 to-transparent" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button asChild className={cn(
            "bg-ot-orange! hover:bg-ot-orange/90! text-white! border-0!",
            "h-12 px-8 text-base font-semibold rounded-lg"
          )}>
            <Link href="/torneos" className="inline-flex items-center justify-center gap-2">
              Ver torneos disponibles
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Social proof / trust */}
      <section className="relative ot-container py-20 md:py-28 border-t border-white/5">
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-ot-dark-blue/50 to-ot-light-blue/20 p-8 md:p-12 text-center">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-8">
            {[
              { value: "Torneos", label: "organizados" },
              { value: "Equipos", label: "inscriptos" },
              { value: "Partidos", label: "por temporada" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-ot-orange">
                  {stat.value}
                </div>
                <div className="text-white/70 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-white/80 text-sm md:text-base">
            {[
              "Inscripción online",
              "Pagos seguros",
              "Fixture y resultados en tiempo real",
              "Soporte para organizadores",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-ot-orange shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative ot-container py-20 md:py-28 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            No te quedes afuera
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Las inscripciones son limitadas. Encontrá tu torneo y asegurá tu lugar.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild className={cn(
              "bg-ot-orange! hover:bg-ot-orange/90! text-white! border-0!",
              "h-12 px-8 text-base font-semibold rounded-lg shadow-lg shadow-ot-orange/25"
            )}>
              <Link href="/torneos" className="inline-flex items-center justify-center gap-2">
                Ver torneos
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={cn(
                "border-white/30! bg-transparent! text-white! hover:bg-white/10! hover:text-white! h-12 px-8 text-base rounded-lg"
              )}
            >
              <Link href="/auth/login">Entrar a mi cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="ot-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white/50 text-sm">Overtime · Torneos de básquet</span>
          <div className="flex gap-6 text-sm">
            <Link href="/torneos" className="text-white/70 hover:text-ot-orange transition-colors">
              Torneos
            </Link>
            <Link href="/auth/login" className="text-white/70 hover:text-ot-orange transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
