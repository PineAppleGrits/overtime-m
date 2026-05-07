import { BracketViewDto, PlayoffSeriesDto } from '@overtime-mono/shared'
import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

/**
 * Bracket + repechaje (RN-045, RN-047, RN-058, RN-024).
 *
 * Los DTOs de input no están en shared (son locales al módulo BE). Se tipan
 * acá según `apps/api/src/playoffs/presentation/dto/playoffs.dto.ts`.
 */

export interface GenerateBracketPayload {
  /** Fecha base ISO. Si no se pasa, el use case decide. */
  baseDate?: string
}

export interface OverrideSeriesPayload {
  homeTeamId?: string | null
  awayTeamId?: string | null
}

export interface ResolveTiebreakerPayload {
  winnerTeamId: string
}

export interface GeneratePromotionPayload {
  reason?: string
}

class PlayoffsService extends Service {
  /** RN-045/-047 — generar bracket de playoffs en una categoría. */
  async generateBracket(categoryId: string, payload?: GenerateBracketPayload) {
    const { data } = await this.client.post(
      `/categories/${categoryId}/playoffs/generate`,
      payload ?? {},
    )
    return data
  }

  /** Bracket completo (público). */
  async getBracket(categoryId: string) {
    const { data } = await this.client.get<BracketViewDto>(
      `/categories/${categoryId}/playoffs/bracket`,
    )
    return data
  }

  /** Detalle de una serie (público). */
  async getSeries(seriesId: string) {
    const { data } = await this.client.get<PlayoffSeriesDto>(
      `/playoff-series/${seriesId}`,
    )
    return data
  }

  /** Override manual de equipos en una serie (antes de iniciar playoffs). */
  async overrideSeries(
    categoryId: string,
    seriesId: string,
    payload: OverrideSeriesPayload,
  ) {
    const { data } = await this.client.patch(
      `/categories/${categoryId}/playoffs/series/${seriesId}`,
      payload,
    )
    return data
  }

  /** RN-024 — desempate manual administrativo en BO1 0-0. */
  async resolveTiebreaker(seriesId: string, payload: ResolveTiebreakerPayload) {
    const { data } = await this.client.post(
      `/playoff-series/${seriesId}/resolve-tiebreaker`,
      payload,
    )
    return data
  }

  /** RN-058 — repechaje entre último de superior y 2° de inferior. */
  async generatePromotionPlayoff(
    lowerCategoryId: string,
    payload?: GeneratePromotionPayload,
  ) {
    const { data } = await this.client.post(
      `/categories/${lowerCategoryId}/promotion-playoff/generate`,
      payload ?? {},
    )
    return data
  }
}

const playoffsService = new PlayoffsService(client)
export default playoffsService
