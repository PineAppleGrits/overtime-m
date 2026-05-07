import {
  CheckoutResponse,
  CheckoutType,
  CreateCheckoutDto,
  CreatePaymentDto,
  MarkAsPaidDto,
  PaymentMethod,
  PaymentStatus,
} from '@overtime-mono/shared'
import { client } from '../common/client/baseClient'
import { PaginatedResponse, PaginationParams } from '../common/dto'
import { Service } from '../common/services/Service'

export type { CheckoutType, PaymentMethod, PaymentStatus }

export interface MarkAsFailedPayload {
  reason: string
}

export interface PaymentResponseDto {
  id: string
  debtId: string | null
  registrationId: string | null
  matchId: string | null
  profileId: string
  amount: number
  currency: string
  method: string
  status: string
  providerPaymentId: string | null
  providerResponse: unknown
  processedAt: string | null
  createdAt: string
  updatedAt: string
  profile?: { id: string; name: string; email: string | null }
  registration?: {
    id: string
    status: string
    team: { id: string; name: string }
    tournament: { id: string; name: string }
    category: { id: string; name: string } | null
  } | null
  match?: {
    id: string
    matchDate: string | null
    homeTeam: { id: string; name: string } | null
    awayTeam: { id: string; name: string } | null
  } | null
  debt?: {
    id: string
    type: string
    status: string
    concept: string
    currentBalance: string
    originAmount: string
    currency: string
    teamId: string | null
    profileId: string | null
    friendlyId: string | null
    registrationId: string | null
    matchId: string | null
  } | null
}

export interface PaymentStatusResponseDto {
  id: string
  status: string
  statusInfo: unknown
  amount: number
  currency: string
  method: string
  processedAt: string | null
  createdAt: string
  registration: PaymentResponseDto['registration']
  match: PaymentResponseDto['match']
  debt: PaymentResponseDto['debt']
  providerDetails: { statusDescription?: string } | null
}

export interface PaymentListFilters {
  status?: string
  method?: string
  registrationId?: string
  matchId?: string
  debtId?: string
}

export interface PaymentSummaryParams {
  startDate?: string
  endDate?: string
}

export interface UploadProofResponse {
  assetId: string
  paymentId: string
  contentType: string
  originalFilename: string | null
  sizeBytes: number
  uploadedAt: string
}

class PaymentsService extends Service {
  // ── Checkout (Mercado Pago / debt-first) ──────────────────────────────

  async createCheckout(dto: CreateCheckoutDto) {
    const { data } = await this.client.post<CheckoutResponse>(
      '/payments/checkout',
      dto,
    )
    return data
  }

  async getStatus(id: string) {
    const { data } = await this.client.get<PaymentStatusResponseDto>(
      `/payments/${id}/status`,
    )
    return data
  }

  // ── CRUD básico ───────────────────────────────────────────────────────

  async create(dto: CreatePaymentDto) {
    const { data } = await this.client.post<PaymentResponseDto>(
      '/payments',
      dto,
    )
    return data
  }

  async list(params?: PaginationParams & PaymentListFilters) {
    const { data } = await this.client.get<
      PaginatedResponse<PaymentResponseDto>
    >('/payments', { params })
    return data
  }

  async findMine(params?: PaginationParams) {
    const { data } = await this.client.get<
      PaginatedResponse<PaymentResponseDto>
    >('/payments/me', { params })
    return data
  }

  async getSummary(params?: PaymentSummaryParams) {
    const { data } = await this.client.get('/payments/summary', { params })
    return data
  }

  async findOne(id: string) {
    const { data } = await this.client.get<PaymentResponseDto>(
      `/payments/${id}`,
    )
    return data
  }

  // ── Manual mark (admin) ───────────────────────────────────────────────

  async markAsPaid(id: string, dto?: MarkAsPaidDto) {
    const { data } = await this.client.post<PaymentResponseDto>(
      `/payments/${id}/mark-paid`,
      dto ?? {},
    )
    return data
  }

  async markAsFailed(id: string, dto: MarkAsFailedPayload) {
    const { data } = await this.client.post<PaymentResponseDto>(
      `/payments/${id}/mark-failed`,
      dto,
    )
    return data
  }

  // ── Comprobante de transferencia (RN-014) ─────────────────────────────

  async uploadProof(id: string, file: File | Blob) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await this.client.post<UploadProofResponse>(
      `/payments/${id}/proof`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  }

  // ── Mercado Pago ──────────────────────────────────────────────────────

  async createMercadoPagoPreference(id: string) {
    const { data } = await this.client.post(
      `/payments/${id}/mercadopago/preference`,
    )
    return data
  }

  async getMercadoPagoStatus() {
    const { data } = await this.client.get<{ enabled: boolean }>(
      '/payments/mercadopago/status',
    )
    return data
  }

  // ── Estado de pago de inscripción (RN-015 / RN-016) ───────────────────

  /** Devuelve entry fee + insurances + status agregado de la registration. */
  async getRegistrationPaymentStatus(registrationId: string) {
    const { data } = await this.client.get(
      `/registrations/${registrationId}/payment-status`,
    )
    return data
  }
}

const paymentsService = new PaymentsService(client)
export default paymentsService
