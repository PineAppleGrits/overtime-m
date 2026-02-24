import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MercadoPagoService, WebhookPayload } from './services/mercadopago.service';
import { EmailService } from '../notifications/services/email.service';
import {
  CreatePaymentDto,
  MarkAsPaidDto,
  PaymentMethod,
  PaymentStatus,
} from '@overtime-mono/shared';
import { CreateCheckoutDto, CheckoutType, CheckoutResponse } from '@overtime-mono/shared';
import { PaginationDto } from '@overtime-mono/shared';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Crear checkout y obtener link de MercadoPago en un solo paso
   * Este es el endpoint principal que debe usar el frontend
   */
  async createCheckout(
    dto: CreateCheckoutDto,
    profileId: string,
  ): Promise<CheckoutResponse> {
    // Validar que MercadoPago esté habilitado
    if (!this.mercadoPagoService.isEnabled()) {
      throw new BadRequestException('MercadoPago is not enabled');
    }

    // Validar parámetros
    if (dto.type === CheckoutType.REGISTRATION && !dto.registrationId) {
      throw new BadRequestException('registrationId is required for registration payments');
    }
    if (dto.type === CheckoutType.MATCH && !dto.matchId) {
      throw new BadRequestException('matchId is required for match payments');
    }

    let amount: number;
    let title: string;
    let description: string;

    // Obtener información según el tipo
    if (dto.type === CheckoutType.REGISTRATION) {
      const registration = await this.prisma.registration.findUnique({
        where: { id: dto.registrationId },
        include: {
          team: { select: { name: true } },
          tournament: { select: { name: true } },
          category: { select: { name: true } },
        },
      });

      if (!registration) {
        throw new NotFoundException('Registration not found');
      }

      if (registration.status === 'pagada') {
        throw new ConflictException('Registration is already paid');
      }

      // TODO: Obtener monto de configuración del torneo/categoría
      // Por ahora usamos un monto fijo o del torneo
      amount = 5000; // Monto de ejemplo - debe venir de configuración
      title = `Inscripción: ${registration.team.name}`;
      description = `Inscripción al torneo ${registration.tournament.name} - Categoría ${registration.category.name}`;
    } else {
      const match = await this.prisma.match.findUnique({
        where: { id: dto.matchId },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      amount = match.costPerTeam || 0;
      if (amount <= 0) {
        throw new BadRequestException('Match has no cost configured');
      }

      title = `Partido: ${match.homeTeam?.name || 'TBD'} vs ${match.awayTeam?.name || 'TBD'}`;
      description = `Pago de partido`;
    }

    // Obtener email del usuario
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, name: true, email: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Verificar si ya existe un pago pendiente para este recurso
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        registrationId: dto.registrationId || undefined,
        matchId: dto.matchId || undefined,
        status: { in: [PaymentStatus.PENDING, 'procesando'] },
      },
    });

    if (existingPayment) {
      // Si ya existe, intentar obtener el preference existente o crear uno nuevo
      if (existingPayment.providerPaymentId) {
        // Verificar si el preference aún es válido (menos de 24h)
        const createdAt = new Date(existingPayment.createdAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 23) {
          // Preference aún válido, devolver el existente
          // Pero necesitamos recrear los URLs porque no los guardamos
          this.logger.log(`Returning existing payment ${existingPayment.id}`);
        }
      }
    }

    // Crear el pago en nuestra BD
    const payment = await this.prisma.payment.create({
      data: {
        registrationId: dto.registrationId,
        matchId: dto.matchId,
        profileId,
        amount,
        currency: 'ARS',
        method: PaymentMethod.MERCADOPAGO,
        status: PaymentStatus.PENDING,
      },
    });

    // Crear preference en MercadoPago
    const preferenceResult = await this.mercadoPagoService.createPreference({
      paymentId: payment.id,
      title,
      description,
      amount,
      payerEmail: profile.email ?? '',
      payerName: profile.name,
      externalReference: payment.id,
      metadata: {
        type: dto.type,
        registrationId: dto.registrationId,
        matchId: dto.matchId,
        profileId,
      },
    });

    if (!preferenceResult.success) {
      // Marcar pago como fallido
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      throw new BadRequestException(`Error creating checkout: ${preferenceResult.error}`);
    }

    // Actualizar pago con preferenceId
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: preferenceResult.preferenceId,
      },
    });

    this.logger.log(
      `Checkout created: payment=${payment.id}, preference=${preferenceResult.preferenceId}`,
    );

    // Calcular expiración (24 horas)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      paymentId: payment.id,
      checkoutUrl: preferenceResult.initPoint!,
      sandboxUrl: preferenceResult.sandboxInitPoint,
      preferenceId: preferenceResult.preferenceId!,
      amount,
      currency: 'ARS',
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Obtener estado de un pago (para polling desde frontend)
   */
  async getPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        method: true,
        processedAt: true,
        createdAt: true,
        providerResponse: true,
        registration: {
          select: {
            id: true,
            status: true,
            team: { select: { id: true, name: true } },
            tournament: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
          },
        },
        match: {
          select: {
            id: true,
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
            matchDate: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Mapear estado a algo más amigable para el frontend
    const statusInfo = this.getPaymentStatusInfo(payment.status);

    return {
      id: payment.id,
      status: payment.status,
      statusInfo,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
      registration: payment.registration,
      match: payment.match,
      // Detalles adicionales del proveedor si están disponibles
      providerDetails: payment.providerResponse
        ? {
            statusDescription: (payment.providerResponse as any)?.statusDescription,
          }
        : null,
    };
  }

  /**
   * Obtener información amigable del estado
   */
  private getPaymentStatusInfo(status: string): {
    code: string;
    label: string;
    description: string;
    isTerminal: boolean;
    isSuccess: boolean;
  } {
    const statusMap: Record<string, any> = {
      pendiente: {
        code: 'pending',
        label: 'Pendiente',
        description: 'El pago está pendiente de procesamiento',
        isTerminal: false,
        isSuccess: false,
      },
      procesando: {
        code: 'processing',
        label: 'Procesando',
        description: 'El pago se está procesando',
        isTerminal: false,
        isSuccess: false,
      },
      procesado: {
        code: 'completed',
        label: 'Completado',
        description: 'El pago fue procesado exitosamente',
        isTerminal: true,
        isSuccess: true,
      },
      fallido: {
        code: 'failed',
        label: 'Fallido',
        description: 'El pago no pudo ser procesado',
        isTerminal: true,
        isSuccess: false,
      },
      reembolsado: {
        code: 'refunded',
        label: 'Reembolsado',
        description: 'El pago fue reembolsado',
        isTerminal: true,
        isSuccess: false,
      },
    };

    return statusMap[status] || statusMap['pendiente'];
  }

  /**
   * Crear un pago
   */
  async create(createPaymentDto: CreatePaymentDto, profileId: string) {
    // Validar que se proporciona registrationId o matchId
    if (!createPaymentDto.registrationId && !createPaymentDto.matchId) {
      throw new BadRequestException(
        'Either registrationId or matchId must be provided',
      );
    }

    if (createPaymentDto.registrationId && createPaymentDto.matchId) {
      throw new BadRequestException(
        'Cannot provide both registrationId and matchId',
      );
    }

    // Verificar que existe el recurso asociado
    if (createPaymentDto.registrationId) {
      const registration = await this.prisma.registration.findUnique({
        where: { id: createPaymentDto.registrationId },
      });

      if (!registration) {
        throw new NotFoundException('Registration not found');
      }
    }

    if (createPaymentDto.matchId) {
      const match = await this.prisma.match.findUnique({
        where: { id: createPaymentDto.matchId },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        profileId,
        currency: createPaymentDto.currency || 'ARS',
        status: PaymentStatus.PENDING,
      },
      include: {
        profile: {
          select: { id: true, name: true, email: true },
        },
        registration: {
          include: {
            team: { select: { id: true, name: true } },
            tournament: { select: { id: true, name: true } },
          },
        },
        match: {
          include: {
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
          },
        },
      },
    });

    this.logger.log(
      `Payment created: ${payment.id} - ${payment.amount} ${payment.currency}`,
    );

    return payment;
  }

  /**
   * Listar pagos con filtros
   */
  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      registrationId?: string;
      matchId?: string;
      profileId?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    if (filters?.registrationId) {
      where.registrationId = filters.registrationId;
    }

    if (filters?.matchId) {
      where.matchId = filters.matchId;
    }

    if (filters?.profileId) {
      where.profileId = filters.profileId;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          profile: {
            select: { id: true, name: true, email: true },
          },
          registration: {
            include: {
              team: { select: { id: true, name: true } },
              tournament: { select: { id: true, name: true } },
            },
          },
          match: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener detalle de un pago
   */
  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        profile: {
          select: { id: true, name: true, email: true, phone: true },
        },
        registration: {
          include: {
            team: true,
            tournament: true,
            category: true,
          },
        },
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            venue: true,
            category: {
              include: {
                tournament: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Marcar pago como completado (para pagos en efectivo o transferencia)
   */
  async markAsPaid(id: string, markAsPaidDto: MarkAsPaidDto, adminId: string) {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new ConflictException('Payment is already completed');
    }

    if (payment.method === PaymentMethod.MERCADOPAGO) {
      throw new BadRequestException(
        'MercadoPago payments should be processed via webhook',
      );
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.COMPLETED,
        processedAt: new Date(),
        providerResponse: {
          markedBy: adminId,
          markedAt: new Date().toISOString(),
          externalReference: markAsPaidDto.externalReference,
          notes: markAsPaidDto.notes,
        },
      },
      include: {
        profile: {
          select: { id: true, name: true, email: true },
        },
        registration: {
          include: {
            team: { select: { id: true, name: true } },
            tournament: { select: { id: true, name: true } },
          },
        },
        match: {
          include: {
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Si es pago de inscripción, actualizar estado
    if (payment.registrationId) {
      await this.prisma.registration.update({
        where: { id: payment.registrationId },
        data: { status: 'pagada' },
      });
    }

    this.logger.log(`Payment marked as paid: ${id} by admin ${adminId}`);

    return updatedPayment;
  }

  /**
   * Marcar pago como fallido
   */
  async markAsFailed(id: string, reason: string) {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new ConflictException('Cannot mark a completed payment as failed');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.FAILED,
        providerResponse: {
          ...(payment.providerResponse as object || {}),
          failedAt: new Date().toISOString(),
          failureReason: reason,
        },
      },
    });

    this.logger.log(`Payment marked as failed: ${id} - ${reason}`);

    return updatedPayment;
  }

  /**
   * Obtener pagos de un usuario
   */
  async findByProfile(profileId: string, paginationDto: PaginationDto) {
    return this.findAll(paginationDto, { profileId });
  }

  /**
   * Obtener resumen de pagos (para admin dashboard)
   */
  async getSummary(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalPayments, statusCounts, methodCounts, totalAmount] =
      await Promise.all([
        this.prisma.payment.count({ where }),
        this.prisma.payment.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        this.prisma.payment.groupBy({
          by: ['method'],
          where,
          _count: true,
        }),
        this.prisma.payment.aggregate({
          where: { ...where, status: PaymentStatus.COMPLETED },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalPayments,
      statusBreakdown: statusCounts.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count }),
        {},
      ),
      methodBreakdown: methodCounts.reduce(
        (acc, item) => ({ ...acc, [item.method]: item._count }),
        {},
      ),
      totalCompletedAmount: totalAmount._sum.amount || 0,
    };
  }

  // ============================================
  // MERCADOPAGO INTEGRATION
  // ============================================

  /**
   * Crear preferencia de pago en MercadoPago
   */
  async createMercadoPagoPreference(paymentId: string) {
    const payment = await this.findOne(paymentId);

    if (payment.method !== PaymentMethod.MERCADOPAGO) {
      throw new BadRequestException('Payment method is not MercadoPago');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new ConflictException('Payment is already completed');
    }

    // Build payment description
    let title = 'Pago Overtime';
    let description = '';

    if (payment.registration) {
      title = `Inscripción: ${payment.registration.team.name}`;
      description = `Inscripción al torneo ${payment.registration.tournament.name}`;
    } else if (payment.match) {
      title = `Partido: ${payment.match.homeTeam?.name || 'TBD'} vs ${payment.match.awayTeam?.name || 'TBD'}`;
      description = `Pago de partido`;
    }

    const result = await this.mercadoPagoService.createPreference({
      paymentId: payment.id,
      title,
      description,
      amount: payment.amount,
      payerEmail: payment.profile.email ?? '',
      payerName: payment.profile.name,
      externalReference: payment.id,
      metadata: {
        registrationId: payment.registrationId,
        matchId: payment.matchId,
      },
    });

    if (!result.success) {
      throw new BadRequestException(`Failed to create preference: ${result.error}`);
    }

    // Update payment with preference ID
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        providerPaymentId: result.preferenceId,
        status: PaymentStatus.PENDING,
      },
    });

    this.logger.log(`MercadoPago preference created for payment ${paymentId}: ${result.preferenceId}`);

    return {
      paymentId,
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      sandboxInitPoint: result.sandboxInitPoint,
    };
  }

  /**
   * Procesar webhook de MercadoPago
   */
  async processMercadoPagoWebhook(
    payload: WebhookPayload,
    xSignature?: string,
    xRequestId?: string,
  ) {
    this.logger.log(`MercadoPago webhook received: ${JSON.stringify(payload)}`);

    // Validate signature if configured
    if (xSignature && xRequestId) {
      const isValid = this.mercadoPagoService.validateWebhookSignature(
        xSignature,
        xRequestId,
        payload.data.id,
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    // Process the webhook
    const result = await this.mercadoPagoService.processWebhook(payload);

    if (!result.processed || !result.paymentInfo) {
      return { received: true, processed: false };
    }

    const { paymentInfo } = result;

    // Find our payment by external reference
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentInfo.externalReference },
      include: {
        profile: { select: { id: true, name: true, email: true } },
        registration: {
          include: {
            team: { select: { name: true } },
            tournament: { select: { name: true } },
          },
        },
        match: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for external reference: ${paymentInfo.externalReference}`);
      return { received: true, processed: false, error: 'Payment not found' };
    }

    // Map MercadoPago status to our status
    const newStatus = this.mercadoPagoService.mapPaymentStatus(paymentInfo.status);
    const statusDescription = this.mercadoPagoService.getStatusDescription(
      paymentInfo.status,
      paymentInfo.statusDetail,
    );

    // Update payment
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        processedAt: paymentInfo.status === 'approved' ? new Date() : undefined,
        providerPaymentId: String(paymentInfo.id),
        providerResponse: {
          mercadoPagoId: paymentInfo.id,
          status: paymentInfo.status,
          statusDetail: paymentInfo.statusDetail,
          paymentMethod: paymentInfo.paymentMethodId,
          paymentType: paymentInfo.paymentTypeId,
          dateApproved: paymentInfo.dateApproved,
          statusDescription,
        },
      },
    });

    this.logger.log(
      `Payment ${payment.id} updated: ${payment.status} -> ${newStatus} (MP: ${paymentInfo.status})`,
    );

    // If payment is approved, update related resources and send email
    if (paymentInfo.status === 'approved') {
      // Update registration status if applicable
      if (payment.registrationId) {
        await this.prisma.registration.update({
          where: { id: payment.registrationId },
          data: { status: 'pagada' },
        });
        this.logger.log(`Registration ${payment.registrationId} marked as paid`);
      }

      // Send confirmation email
      if (payment.profile?.email) {
        let concept = 'Pago Overtime';
        if (payment.registration) {
          concept = `Inscripción: ${payment.registration.team.name} - ${payment.registration.tournament.name}`;
        } else if (payment.match) {
          concept = `Partido: ${payment.match.homeTeam?.name || 'TBD'} vs ${payment.match.awayTeam?.name || 'TBD'}`;
        }

        await this.emailService.sendPaymentConfirmation(
          payment.profile.email,
          payment.profile.name,
          payment.amount,
          payment.currency,
          concept,
          payment.id,
        );
      }
    }

    return {
      received: true,
      processed: true,
      paymentId: payment.id,
      newStatus,
      mercadoPagoStatus: paymentInfo.status,
    };
  }

  /**
   * Check if MercadoPago is enabled
   */
  isMercadoPagoEnabled(): boolean {
    return this.mercadoPagoService.isEnabled();
  }
}
