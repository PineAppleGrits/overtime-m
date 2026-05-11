'use client'

import { DollarSign, Users, UserPlus } from 'lucide-react'

// TODO: conectar con API
const mockBalance = {
  inscriptionFee: 12000,
  insuranceFeePerPlayer: 1000,
  playerCount: 8,
  totalInsurance: 8000,
  total: 20000,
  paid: false,
}

const mockPlayers = [
  { id: 'p1', name: 'Martín López', gamesPlayed: 8, points: 142, assists: 38, rebounds: 52, steals: 12 },
  { id: 'p2', name: 'Lucas García', gamesPlayed: 8, points: 118, assists: 45, rebounds: 34, steals: 18 },
  { id: 'p3', name: 'Tomás Fernández', gamesPlayed: 7, points: 95, assists: 22, rebounds: 61, steals: 8 },
  { id: 'p4', name: 'Nicolás Rodríguez', gamesPlayed: 8, points: 88, assists: 31, rebounds: 28, steals: 15 },
  { id: 'p5', name: 'Santiago Martínez', gamesPlayed: 6, points: 72, assists: 18, rebounds: 44, steals: 10 },
  { id: 'p6', name: 'Facundo Pérez', gamesPlayed: 7, points: 65, assists: 26, rebounds: 38, steals: 7 },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function MyTeamTab({
  teamId: _teamId,
  categoryId: _categoryId,
  canManage = false,
}: {
  teamId: string
  categoryId: string
  canManage?: boolean
}) {
  // TODO: conectar con API para obtener datos reales del equipo

  return (
    <div className="space-y-6">
      {/* Balance / Deudas */}
      <section className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5">
        <h3 className="flex items-center gap-2 font-din-display text-lg font-semibold text-white mb-4">
          <DollarSign className="size-5 text-ot-orange" />
          Balance del equipo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs text-white/40 mb-0.5">Arancel</p>
            <p className="text-white font-semibold">
              {formatCurrency(mockBalance.inscriptionFee)}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs text-white/40 mb-0.5">Seguro x jugador</p>
            <p className="text-white font-semibold">
              {formatCurrency(mockBalance.insuranceFeePerPlayer)} x{' '}
              {mockBalance.playerCount} ={' '}
              {formatCurrency(mockBalance.totalInsurance)}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xs text-white/40 mb-0.5">Total</p>
            <p className="text-white font-bold text-lg">
              {formatCurrency(mockBalance.total)}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            mockBalance.paid
              ? 'bg-green-500/15 text-green-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {mockBalance.paid ? 'Pagado' : 'Pendiente de pago'}
        </span>
      </section>

      {/* Plantel */}
      <section className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5">
        <h3 className="flex items-center gap-2 font-din-display text-lg font-semibold text-white mb-4">
          <Users className="size-5 text-ot-orange" />
          Plantel
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ot-light-blue/30">
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                  Jugador
                </th>
                <th className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                  PJ
                </th>
                <th className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                  PTS
                </th>
                <th className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                  ASI
                </th>
                <th className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                  REB
                </th>
                <th className="px-3 py-2 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
                  ROB
                </th>
              </tr>
            </thead>
            <tbody>
              {mockPlayers.map((player) => (
                <tr
                  key={player.id}
                  className="border-t border-ot-light-blue/20 hover:bg-ot-dark-blue/40 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ot-orange/20 text-xs font-bold text-ot-orange">
                        {player.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-white whitespace-nowrap">
                        {player.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-white/70">
                    {player.gamesPlayed}
                  </td>
                  <td className="px-3 py-2.5 text-center text-ot-orange font-bold">
                    {player.points}
                  </td>
                  <td className="px-3 py-2.5 text-center text-white/70">
                    {player.assists}
                  </td>
                  <td className="px-3 py-2.5 text-center text-white/70">
                    {player.rebounds}
                  </td>
                  <td className="px-3 py-2.5 text-center text-white/70">
                    {player.steals}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Acciones de gestión del equipo */}
      {canManage && (
        <div className="flex flex-wrap gap-3">
          {/* TODO: implementar búsqueda y agregado de jugadores */}
          <button className="inline-flex items-center gap-2 rounded-lg border border-ot-orange/40 px-4 py-2.5 text-sm font-semibold text-ot-orange hover:bg-ot-orange/10 transition-colors cursor-pointer">
            <UserPlus className="size-4" />
            Agregar jugador
          </button>
        </div>
      )}
    </div>
  )
}
