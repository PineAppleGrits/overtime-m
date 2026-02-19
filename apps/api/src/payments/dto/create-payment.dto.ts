import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  MERCADOPAGO = 'mercadopago',
  CASH = 'cash',
  TRANSFER = 'transfer',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pendiente',
  PROCESSING = 'procesando',
  COMPLETED = 'procesado',
  FAILED = 'fallido',
  REFUNDED = 'reembolsado',
}

export enum PaymentType {
  REGISTRATION = 'registration',
  MATCH = 'match',
}

export class CreatePaymentDto {
  @ApiPropertyOptional({ description: 'ID de la inscripción (si es pago de inscripción)' })
  @IsOptional()
  @IsUUID()
  registrationId?: string;

  @ApiPropertyOptional({ description: 'ID del partido (si es pago de partido)' })
  @IsOptional()
  @IsUUID()
  matchId?: string;

  @ApiProperty({ description: 'Monto del pago', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Moneda', default: 'ARS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Método de pago', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class MarkAsPaidDto {
  @ApiPropertyOptional({ description: 'Referencia externa del pago' })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
