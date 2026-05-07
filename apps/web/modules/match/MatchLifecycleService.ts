import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

/**
 * Servicios de lifecycle de partidos (W3.1).
 * Conviven con `MatchService` (CRUD básico) — son endpoints adicionales.
 *
 * Los DTOs todavía no viven en `@overtime-mono/shared`; se tipan localmente
 * mientras tanto para mantener paridad con `apps/api/src/matches/presentation/dto/lifecycle.dto.ts`.
 */

export interface FinishMatchPayload {
  homeScore: number
  awayScore: number
}

export interface CancelMatchByTeamPayload {
  cancellingTeamId: string
  reason?: string
}

export interface RivalDecisionPayload {
  decision: 'request_points' | 'reschedule'
  rivalTeamId: string
  newDate?: string
}

export interface RescheduleMatchPayload {
  newDate: string
  reason?: string
  forceWithoutThreshold?: boolean
}

export interface MatchScorePayload {
  home: number
  away: number
}

export interface SuspendMatchPayload {
  reason: string
  currentScore?: MatchScorePayload
  resolution: 'reanudar' | 'fin_sin_continuidad' | 'pendiente'
  winningTeamId?: string
}

export interface ResolveSuspendedPayload {
  resolution: 'reanudar' | 'fin_sin_continuidad'
  currentScore?: MatchScorePayload
  winningTeamId?: string
}

export interface MutualCancelPayload {
  reason?: string
}

class MatchLifecycleService extends Service {
  /** RN-049 + RN-053 — valida staff + deudas y arranca el partido. */
  async start(matchId: string) {
    const { data } = await this.client.post(`/matches/${matchId}/start`)
    return data
  }

  /** Finaliza el partido y emite match.finished. Valida marcador. */
  async finish(matchId: string, payload: FinishMatchPayload) {
    const { data } = await this.client.post(
      `/matches/${matchId}/finish`,
      payload,
    )
    return data
  }

  /** Cancelación por un equipo (RN-032). */
  async cancelByTeam(matchId: string, payload: CancelMatchByTeamPayload) {
    const { data } = await this.client.post(
      `/matches/${matchId}/cancel-by-team`,
      payload,
    )
    return data
  }

  /** Resolución del rival ante cancelación (RN-032). */
  async rivalDecision(matchId: string, payload: RivalDecisionPayload) {
    const { data } = await this.client.patch(
      `/matches/${matchId}/rival-decision`,
      payload,
    )
    return data
  }

  /** Reprogramación administrativa (RN-052). */
  async reschedule(matchId: string, payload: RescheduleMatchPayload) {
    const { data } = await this.client.post(
      `/matches/${matchId}/reschedule`,
      payload,
    )
    return data
  }

  /** Suspensión durante el encuentro (RN-054, RN-055). */
  async suspend(matchId: string, payload: SuspendMatchPayload) {
    const { data } = await this.client.post(
      `/matches/${matchId}/suspend`,
      payload,
    )
    return data
  }

  /** Resolver partido suspendido_pendiente (RN-055). */
  async resolveSuspended(matchId: string, payload: ResolveSuspendedPayload) {
    const { data } = await this.client.post(
      `/matches/${matchId}/resolve-suspended`,
      payload,
    )
    return data
  }

  /** Cancelación mutua (RN-056) — 0-0 administrativo. */
  async mutualCancel(matchId: string, payload?: MutualCancelPayload) {
    const { data } = await this.client.post(
      `/matches/${matchId}/mutual-cancel`,
      payload ?? {},
    )
    return data
  }
}

const matchLifecycleService = new MatchLifecycleService(client)
export default matchLifecycleService
