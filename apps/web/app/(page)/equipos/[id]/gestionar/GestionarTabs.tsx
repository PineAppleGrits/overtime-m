'use client'

import { Settings, Wallet, AlertCircle, ShieldCheck, Upload } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsForm } from './SettingsForm'
import type {
  TeamBalance,
  RegistrationBalance,
  Suspension,
} from '@/modules/team/TeamBalanceService'

interface Props {
  teamId: string
  teamName: string
  sportName: string
  franchise: { id: string; name: string; logoUrl?: string | null } | null
  balance: TeamBalance
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

function StatusBadge({ status }: { status: RegistrationBalance['status'] }) {
  const config = {
    pending_payment: { label: 'Pago pendiente', classes: 'bg-amber-500/20 text-amber-400' },
    voucher_sent: { label: 'En revisión', classes: 'bg-blue-500/20 text-blue-400' },
    paid: { label: 'Pagado', classes: 'bg-emerald-500/20 text-emerald-400' },
  }
  const { label, classes } = config[status]
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${classes}`}>
      {label}
    </span>
  )
}

function RegistrationCard({ registration }: { registration: RegistrationBalance }) {
  return (
    <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 space-y-3">
      <div>
        <p className="font-semibold text-white">{registration.tournamentName}</p>
        <p className="text-xs text-white/50">{registration.categoryName}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-white/40 text-xs">Inscripción</p>
          <p className="text-white">{formatCurrency(registration.inscriptionAmount)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Seguro ({registration.playersCount} jug.)</p>
          <p className="text-white">{formatCurrency(registration.insuranceAmount)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Total</p>
          <p className="text-white font-semibold">{formatCurrency(registration.totalAmount)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Abonado</p>
          <p className="text-emerald-400">{formatCurrency(registration.paidAmount)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={registration.status} />
        {registration.voucherUrl === null && registration.status === 'pending_payment' && (
          <button className="flex items-center gap-1.5 rounded-lg border border-ot-orange/40 px-3 py-1.5 text-xs text-ot-orange hover:bg-ot-orange/10 transition-colors cursor-pointer">
            <Upload className="size-3" />
            Subir comprobante
          </button>
        )}
      </div>
    </div>
  )
}

function SuspensionCard({ suspension }: { suspension: Suspension }) {
  return (
    <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white text-sm">{suspension.playerName}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            suspension.isActive ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'
          }`}
        >
          {suspension.isActive ? 'Activo' : 'Cumplido'}
        </span>
      </div>
      <p className="text-xs text-white/50">Razón: {suspension.reason}</p>
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span>
          {suspension.remainingGames} de {suspension.totalGames}{' '}
          {suspension.totalGames === 1 ? 'partido' : 'partidos'} restante
          {suspension.remainingGames !== 1 ? 's' : ''}
        </span>
        <span>Hasta: {new Date(suspension.endDate).toLocaleDateString('es-AR')}</span>
      </div>
    </div>
  )
}

export function GestionarTabs({ teamId, teamName, sportName, franchise, balance }: Props) {
  return (
    <Tabs defaultValue="configuracion">
      <TabsList className="w-full bg-ot-dark-blue/50 border border-ot-light-blue/30 h-10 p-1 mb-6">
        <TabsTrigger
          value="configuracion"
          className="flex-1 gap-1.5 text-white/50 data-[state=active]:bg-ot-orange data-[state=active]:text-white data-[state=active]:shadow-none hover:text-white/80 transition-colors"
        >
          <Settings className="size-3.5" />
          Configuración
        </TabsTrigger>
        <TabsTrigger
          value="balance"
          className="flex-1 gap-1.5 text-white/50 data-[state=active]:bg-ot-orange data-[state=active]:text-white data-[state=active]:shadow-none hover:text-white/80 transition-colors"
        >
          <Wallet className="size-3.5" />
          Balance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="configuracion">
        <SettingsForm
          teamId={teamId}
          teamName={teamName}
          sportName={sportName}
          franchiseName={franchise?.name ?? null}
        />
      </TabsContent>

      <TabsContent value="balance" className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 text-center">
            <p className="text-xs text-white/50 mb-1">Adeudado</p>
            <p
              className={`text-2xl font-bold font-din-display ${
                balance.totalDebt > 0 ? 'text-red-400' : 'text-white/30'
              }`}
            >
              {formatCurrency(balance.totalDebt)}
            </p>
          </div>
          <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 text-center">
            <p className="text-xs text-white/50 mb-1">Abonado</p>
            <p className="text-2xl font-bold font-din-display text-emerald-400">
              {formatCurrency(balance.totalPaid)}
            </p>
          </div>
          <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 text-center">
            <p className="text-xs text-white/50 mb-1">Pend. confirm.</p>
            <p className="text-2xl font-bold font-din-display text-amber-400">
              {formatCurrency(balance.pendingConfirmation)}
            </p>
          </div>
        </div>

        {/* Inscripciones */}
        <section className="space-y-3">
          <h2 className="text-ot-orange text-sm font-semibold uppercase tracking-wider font-din-display">
            Inscripciones
          </h2>
          {balance.registrations.length === 0 ? (
            <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 py-10 text-center">
              <AlertCircle className="size-6 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50">Sin inscripciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {balance.registrations.map((reg) => (
                <RegistrationCard key={reg.id} registration={reg} />
              ))}
            </div>
          )}
        </section>

        {/* Suspensiones */}
        <section className="space-y-3">
          <h2 className="text-ot-orange text-sm font-semibold uppercase tracking-wider font-din-display">
            Jugadores suspendidos
          </h2>
          {balance.suspensions.length === 0 ? (
            <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 py-10 text-center">
              <ShieldCheck className="size-6 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50">Sin suspensiones activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {balance.suspensions.map((sus) => (
                <SuspensionCard key={sus.profileId} suspension={sus} />
              ))}
            </div>
          )}
        </section>
      </TabsContent>
    </Tabs>
  )
}
