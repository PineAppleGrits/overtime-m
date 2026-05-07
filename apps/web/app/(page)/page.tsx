'use client'

import Link from "next/link"
import { useEffect, useRef } from "react"
import {
  Trophy,
  Users,
  Calendar,
  Zap,
  ArrowRight,
  BarChart3,
  Target,
} from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const targets = root.querySelectorAll("[data-animate], [data-animate-left], [data-animate-stagger]")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return ref
}

/* ─── Skewed CTA Button ─── */
function SkewedButton({
  href,
  children,
  variant = "primary",
}: {
  href: string
  children: React.ReactNode
  variant?: "primary" | "ghost"
}) {
  if (variant === "ghost") {
    return (
      <Link
        href={href}
        className="group relative inline-flex items-center gap-2 h-12 md:h-14 px-8 md:px-10 font-bold text-sm md:text-base uppercase tracking-wider text-white/60 hover:text-white transition-colors duration-300"
      >
        {/* Skewed border */}
        <span
          className="absolute inset-0 border border-white/15 group-hover:border-white/30 transition-colors duration-300"
          style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
        />
        <span className="relative z-10">{children}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2 h-12 md:h-14 px-8 md:px-10 font-bold text-sm md:text-base uppercase tracking-wider text-white"
      style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
    >
      {/* Skewed bg */}
      <span className="absolute inset-0 bg-ot-orange" />
      {/* Hover sweep — clipped by parent */}
      <span className="absolute inset-0 bg-white/15 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

export default function Home() {
  const scrollRef = useScrollReveal()
  const { user } = useAuth()
  const isLoggedIn = !!user

  return (
    <div ref={scrollRef} className="min-h-screen bg-ot-background text-white overflow-hidden">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="min-h-screen relative w-full">
        <video autoPlay loop muted playsInline className="w-full h-full absolute inset-0 object-cover pointer-events-none top-0">
          <source src="/hero.webm" type="video/webm" />
        </video>

        {/* Overlays */}
        <div className="absolute inset-0 bg-linear-to-b from-ot-background/30 via-ot-background/60 to-ot-background pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-r from-ot-background/95 via-ot-background/50 to-transparent pointer-events-none" />

        {/* Giant watermark number */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 font-946-latin text-[20rem] md:text-[32rem] font-bold text-white/[0.02] leading-none select-none pointer-events-none"
          aria-hidden
        >
          OT
        </div>

        {/* Vertical accent line */}
        <div
          className="absolute left-6 md:left-10 top-[20%] w-px h-[35%] pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent, #ff3b2f, transparent)",
            animation: "fadeInUp 1.5s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        />

        <div className="ot-container relative pt-16 pb-24 md:pt-24 md:pb-32 flex flex-col justify-center min-h-screen">
          <div className="relative max-w-5xl pl-4 md:pl-8">
            {/* Overline */}
            <div
              className="flex items-center gap-3 mb-8"
              style={{ animation: "fadeInUp 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <span className="w-8 h-px bg-ot-orange" />
              <span className="text-ot-orange text-xs font-bold tracking-[0.3em] uppercase">
                Temporada 2026
              </span>
            </div>

            {/* Title — editorial stacked */}
            <div style={{ animation: "fadeInUp 0.8s 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
              <h1 className="font-din-display font-bold text-white uppercase leading-[0.88] tracking-tight">
                <span className="block text-5xl md:text-7xl lg:text-[6.5rem]">
                  Jugá.
                </span>
                <span className="block text-5xl md:text-7xl lg:text-[6.5rem] ml-2 md:ml-6">
                  Competí.
                </span>
                <span className="block text-6xl md:text-8xl lg:text-[8rem] text-ot-orange ml-4 md:ml-12">
                  Ganá.
                </span>
              </h1>
            </div>

            <p
              className="mt-8 md:mt-10 text-base md:text-lg text-white/50 max-w-md leading-relaxed"
              style={{ animation: "fadeInUp 0.8s 0.7s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              Los mejores torneos privados de básquet.
              Inscripción simple. Fixtures al día. La cancha te espera.
            </p>

            <div
              className="mt-8 md:mt-10 flex flex-wrap items-center gap-3 md:gap-4"
              style={{ animation: "fadeInUp 0.8s 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <SkewedButton href="/torneos">Ver torneos</SkewedButton>
              {isLoggedIn ? (
                <SkewedButton href="/profile/equipos" variant="ghost">Ver mis equipos</SkewedButton>
              ) : (
                <SkewedButton href="/auth/login" variant="ghost">Iniciar sesión</SkewedButton>
              )}
            </div>
          </div>
        </div>

        {/* Diagonal bottom cut */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 md:h-32 pointer-events-none"
          style={{
            background: "var(--color-ot-background)",
            clipPath: "polygon(0 60%, 100% 0, 100% 100%, 0 100%)",
          }}
        />
      </section>

      {/* ═══════════════ FEATURES — Stacked horizontal strips ═══════════════ */}
      <section className="relative py-16 md:py-28">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ot-violeta/15 rounded-full blur-[180px] pointer-events-none" />

        <div className="ot-container">
          {/* Section header — left aligned, with big decorative number */}
          <div data-animate className="relative mb-16 md:mb-24">
            <span className="absolute -left-2 md:-left-4 -top-8 md:-top-12 font-946-latin text-7xl md:text-9xl font-bold text-white/[0.03] select-none pointer-events-none">
              01
            </span>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-ot-orange" />
              <span className="text-ot-orange text-xs font-bold tracking-[0.3em] uppercase">
                Plataforma
              </span>
            </div>
            <h2 className="font-din-display text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">
              La experiencia
            </h2>
          </div>

          {/* Feature strips — asymmetric */}
          <div data-animate-stagger className="space-y-4 md:space-y-5">
            {/* Strip 1 — full width, left-heavy */}
            <div className="group flex flex-col md:flex-row md:items-stretch gap-4 md:gap-5">
              {/* Main content */}
              <div
                className="relative flex-1 p-6 md:p-10 overflow-hidden transition-all duration-500"
                style={{
                  background: "linear-gradient(135deg, rgba(41,37,72,0.5) 0%, rgba(16,15,20,0.95) 70%)",
                  clipPath: "polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)",
                  border: "1px solid rgba(58,53,99,0.3)",
                }}
              >
                {/* Court half-circle decoration */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 border border-white/[0.03] rounded-full pointer-events-none" />
                <div className="absolute right-20 top-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 border border-white/[0.03] rounded-full pointer-events-none" />

                <div className="relative z-10 max-w-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-ot-orange/15 border border-ot-orange/20"
                      style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
                    >
                      <BarChart3 className="w-5 h-5 text-ot-orange" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-ot-orange/60 tracking-[0.2em] uppercase">
                      Tiempo real
                    </span>
                  </div>
                  <h3 className="font-din-display text-xl md:text-3xl font-bold text-white mb-2">
                    Estadísticas al instante
                  </h3>
                  <p className="text-white/40 text-sm md:text-base leading-relaxed">
                    Fixture, resultados y posiciones actualizados en vivo. Sin planillas ni WhatsApp.
                  </p>
                </div>
              </div>

              {/* Side accent box */}
              <div
                className="w-full md:w-44 lg:w-56 p-6 flex flex-col items-center justify-center text-center transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(255,59,47,0.08)]"
                style={{
                  background: "linear-gradient(180deg, rgba(43,22,31,0.8) 0%, rgba(16,15,20,0.95) 100%)",
                  clipPath: "polygon(16px 0, 100% 0, 100% 100%, 0 100%)",
                  border: "1px solid rgba(255,59,47,0.12)",
                }}
              >
                <span className="font-946-latin text-4xl md:text-5xl font-bold text-ot-orange">
                  24/7
                </span>
                <span className="text-white/30 text-[10px] md:text-xs mt-1 uppercase tracking-wider">
                  Online
                </span>
              </div>
            </div>

            {/* Strip 2 — reversed */}
            <div className="group flex flex-col md:flex-row-reverse md:items-stretch gap-4 md:gap-5">
              <div
                className="relative flex-1 p-6 md:p-10 overflow-hidden transition-all duration-500"
                style={{
                  background: "linear-gradient(225deg, rgba(43,22,31,0.5) 0%, rgba(16,15,20,0.95) 70%)",
                  clipPath: "polygon(16px 0, 100% 0, 100% 100%, 0 100%)",
                  border: "1px solid rgba(255,59,47,0.1)",
                }}
              >
                <div className="relative z-10 max-w-xl md:ml-auto md:text-right">
                  <div className="flex items-center gap-3 mb-4 md:justify-end">
                    <span className="text-[10px] md:text-xs font-bold text-ot-orange/60 tracking-[0.2em] uppercase hidden md:block">
                      Competencia
                    </span>
                    <div className="w-10 h-10 flex items-center justify-center bg-ot-orange/15 border border-ot-orange/20"
                      style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
                    >
                      <Trophy className="w-5 h-5 text-ot-orange" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-ot-orange/60 tracking-[0.2em] uppercase md:hidden">
                      Competencia
                    </span>
                  </div>
                  <h3 className="font-din-display text-xl md:text-3xl font-bold text-white mb-2">
                    Categorías por nivel
                  </h3>
                  <p className="text-white/40 text-sm md:text-base leading-relaxed">
                    Todos juegan parejo. Categorías y divisiones para que la competencia sea real.
                  </p>
                </div>
              </div>

              <div
                className="w-full md:w-44 lg:w-56 p-6 flex flex-col items-center justify-center text-center transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(59,51,106,0.15)]"
                style={{
                  background: "linear-gradient(180deg, rgba(59,51,106,0.5) 0%, rgba(16,15,20,0.95) 100%)",
                  clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 100%, 0 100%)",
                  border: "1px solid rgba(78,69,133,0.2)",
                }}
              >
                <span className="font-946-latin text-4xl md:text-5xl font-bold text-ot-newvioleta-claro">
                  A–D
                </span>
                <span className="text-white/30 text-[10px] md:text-xs mt-1 uppercase tracking-wider">
                  Categorías
                </span>
              </div>
            </div>

            {/* Strip 3 — two equal columns */}
            <div className="group grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div
                className="relative p-6 md:p-8 overflow-hidden transition-all duration-500"
                style={{
                  background: "linear-gradient(180deg, rgba(59,51,106,0.3) 0%, rgba(16,15,20,0.95) 100%)",
                  clipPath: "polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)",
                  border: "1px solid rgba(78,69,133,0.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-ot-violeta/30 border border-ot-light-blue/20"
                    style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
                  >
                    <Calendar className="w-5 h-5 text-ot-newvioleta-claro" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-ot-newvioleta-claro/60 tracking-[0.2em] uppercase">
                    Calendario
                  </span>
                </div>
                <h3 className="font-din-display text-xl md:text-2xl font-bold text-white mb-2">
                  Fechas claras
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Sabé cuándo y dónde jugás. Cambios y novedades al instante.
                </p>
              </div>

              <div
                className="relative p-6 md:p-8 overflow-hidden transition-all duration-500"
                style={{
                  background: "linear-gradient(180deg, rgba(41,37,72,0.3) 0%, rgba(16,15,20,0.95) 100%)",
                  clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)",
                  border: "1px solid rgba(58,53,99,0.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-ot-orange/15 border border-ot-orange/20"
                    style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
                  >
                    <Zap className="w-5 h-5 text-ot-orange" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-ot-orange/60 tracking-[0.2em] uppercase">
                    Rápido
                  </span>
                </div>
                <h3 className="font-din-display text-xl md:text-2xl font-bold text-white mb-2">
                  Inscripción express
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Menos trámites, más cancha. Armá tu equipo y empezá a competir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS — Bleeding numbers ═══════════════ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Diagonal background strip */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(160deg, transparent 30%, rgba(255,59,47,0.03) 50%, transparent 70%)",
          }}
        />

        <div className="ot-container relative">
          <div data-animate className="mb-16 md:mb-24">
            <span className="absolute -left-2 md:-left-4 -top-8 md:-top-10 font-946-latin text-7xl md:text-9xl font-bold text-white/[0.03] select-none pointer-events-none">
              02
            </span>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-ot-orange" />
              <span className="text-ot-orange text-xs font-bold tracking-[0.3em] uppercase">
                Trayectoria
              </span>
            </div>
            <h2 className="font-din-display text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">
              Los números hablan
            </h2>
          </div>

          {/* Stats as horizontal rows with bleeding numbers */}
          <div data-animate-stagger className="space-y-0">
            {[
              { value: "10+", label: "Años organizando torneos de alto nivel", accent: true },
              { value: "5K+", label: "Jugadores compitieron en nuestra plataforma", accent: false },
              { value: "50+", label: "Torneos organizados con éxito", accent: true },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="group flex items-center gap-6 md:gap-10 py-6 md:py-8 border-b border-white/[0.04] last:border-0"
              >
                {/* Number — bleeds left on desktop */}
                <div
                  className={`font-946-latin text-5xl md:text-7xl lg:text-8xl font-bold shrink-0 w-28 md:w-44 lg:w-56 transition-colors duration-500 ${
                    stat.accent
                      ? "text-ot-orange/80 group-hover:text-ot-orange"
                      : "text-white/20 group-hover:text-white/40"
                  }`}
                >
                  {stat.value}
                </div>

                {/* Divider */}
                <div
                  className="hidden md:block w-px h-12 shrink-0 transition-all duration-500 group-hover:h-16"
                  style={{
                    background: stat.accent
                      ? "linear-gradient(180deg, transparent, #ff3b2f, transparent)"
                      : "linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)",
                  }}
                />

                {/* Label */}
                <p className="text-white/40 text-sm md:text-lg group-hover:text-white/60 transition-colors duration-500">
                  {stat.label}
                </p>

                {/* Index */}
                <span className="ml-auto text-white/10 font-946-latin text-lg md:text-xl hidden md:block">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS — Overlapping depth stack ═══════════════ */}
      <section className="relative py-20 md:py-32">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ot-violeta/10 rounded-full blur-[180px] pointer-events-none" />

        <div className="ot-container">
          <div data-animate className="relative mb-16 md:mb-24">
            <span className="absolute -left-2 md:-left-4 -top-8 md:-top-10 font-946-latin text-7xl md:text-9xl font-bold text-white/[0.03] select-none pointer-events-none">
              03
            </span>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-ot-orange" />
              <span className="text-ot-orange text-xs font-bold tracking-[0.3em] uppercase">
                Comunidad
              </span>
            </div>
            <h2 className="font-din-display text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">
              Desde la cancha
            </h2>
          </div>

          {/* Stacked overlapping cards */}
          <div data-animate-stagger className="relative max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-0 md:items-start">
              {/* Card 1 — featured, larger */}
              <div
                className="md:col-span-6 relative z-30 p-7 md:p-10 transition-all duration-500 hover:shadow-[0_8px_50px_rgba(255,59,47,0.08)]"
                style={{
                  background: "linear-gradient(160deg, rgba(43,22,31,0.7) 0%, rgba(16,15,20,0.97) 100%)",
                  clipPath: "polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
                  border: "1px solid rgba(255,59,47,0.1)",
                }}
              >
                <div className="text-ot-orange/25 font-din-display text-5xl md:text-6xl leading-none mb-4 select-none">
                  &ldquo;
                </div>
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8">
                  La organización es impecable. Los fixtures se actualizan al instante
                  y la inscripción fue re fácil. No vuelvo a anotar un equipo por WhatsApp.
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 flex items-center justify-center font-bold text-white text-sm"
                    style={{
                      background: "linear-gradient(135deg, #ff3b2f, #992318)",
                      clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
                    }}
                  >
                    M
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Martín R.</div>
                    <div className="text-white/30 text-xs">Capitán — Liga Apertura 2025</div>
                  </div>
                </div>
              </div>

              {/* Card 2 — offset down */}
              <div
                className="md:col-span-6 md:col-start-6 md:mt-12 relative z-20 p-7 md:p-10 transition-all duration-500 hover:shadow-[0_8px_50px_rgba(59,51,106,0.12)]"
                style={{
                  background: "linear-gradient(160deg, rgba(59,51,106,0.5) 0%, rgba(16,15,20,0.97) 100%)",
                  clipPath: "polygon(20px 0, 100% 0, 100% 100%, 0 100%)",
                  border: "1px solid rgba(78,69,133,0.2)",
                }}
              >
                <div className="text-ot-newvioleta-claro/25 font-din-display text-5xl md:text-6xl leading-none mb-4 select-none">
                  &ldquo;
                </div>
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8">
                  Por fin una plataforma que entiende cómo se manejan los torneos de barrio.
                  Profesional de verdad.
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 flex items-center justify-center font-bold text-white text-sm"
                    style={{
                      background: "linear-gradient(135deg, #4e4585, #292548)",
                      clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
                    }}
                  >
                    L
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Lucas G.</div>
                    <div className="text-white/30 text-xs">Organizador — Copa Norte</div>
                  </div>
                </div>
              </div>

              {/* Card 3 — offset more */}
              <div
                className="md:col-span-7 md:col-start-3 md:-mt-6 relative z-10 p-7 md:p-10 transition-all duration-500 hover:shadow-[0_8px_50px_rgba(255,59,47,0.06)]"
                style={{
                  background: "linear-gradient(160deg, rgba(41,37,72,0.3) 0%, rgba(16,15,20,0.97) 100%)",
                  clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
                  border: "1px solid rgba(58,53,99,0.15)",
                }}
              >
                <div className="text-white/10 font-din-display text-5xl md:text-6xl leading-none mb-4 select-none">
                  &ldquo;
                </div>
                <p className="text-white/60 text-base md:text-lg leading-relaxed mb-8">
                  Nos inscribimos en 5 minutos y ya teníamos el fixture.
                  Así de simple debería ser siempre.
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 flex items-center justify-center font-bold text-white text-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,59,47,0.6), rgba(59,51,106,0.8))",
                      clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
                    }}
                  >
                    F
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Federico A.</div>
                    <div className="text-white/30 text-xs">Jugador — Categoría A</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA — Diagonal section ═══════════════ */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Angled top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-20 md:h-28 bg-ot-background pointer-events-none"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 100%)" }}
        />

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(160deg, rgba(43,22,31,0.4) 0%, rgba(16,15,20,1) 40%, rgba(59,51,106,0.15) 100%)",
            }}
          />
          {/* Animated glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,59,47,0.12) 0%, transparent 70%)",
              animation: "pulseGlow 4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Court lines decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] pointer-events-none opacity-[0.03]">
          <svg viewBox="0 0 500 500" fill="none" className="w-full h-full">
            <circle cx="250" cy="250" r="200" stroke="white" strokeWidth="1" />
            <circle cx="250" cy="250" r="80" stroke="white" strokeWidth="1" />
            <line x1="250" y1="50" x2="250" y2="450" stroke="white" strokeWidth="1" />
            <line x1="50" y1="250" x2="450" y2="250" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        <div className="ot-container relative">
          <div data-animate className="max-w-3xl">
            <h2 className="font-din-display text-4xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-tight leading-[0.9]">
              No te quedes
              <br />
              <span className="text-ot-orange">afuera</span>
              <span className="text-ot-orange">.</span>
            </h2>
            <p className="mt-6 md:mt-8 text-base md:text-lg text-white/40 max-w-md leading-relaxed">
              Las inscripciones son limitadas. Encontrá tu torneo y asegurá tu lugar
              antes de que se llene.
            </p>

            <div className="mt-8 md:mt-12 flex flex-wrap items-center gap-3 md:gap-4">
              <SkewedButton href="/torneos">Inscribite ahora</SkewedButton>
              {isLoggedIn ? (
                <SkewedButton href="/profile/equipos" variant="ghost">Ver mis equipos</SkewedButton>
              ) : (
                <SkewedButton href="/auth/login" variant="ghost">Mi cuenta</SkewedButton>
              )}
            </div>

            {/* Trust signals — inline, minimal */}
            <div className="mt-12 md:mt-16 flex flex-wrap gap-x-6 md:gap-x-10 gap-y-3">
              {[
                { icon: Target, text: "Inscripción online" },
                { icon: Users, text: "100+ equipos activos" },
                { icon: Trophy, text: "Torneos verificados" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-white/25 text-xs md:text-sm">
                  <item.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-ot-orange/40" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
