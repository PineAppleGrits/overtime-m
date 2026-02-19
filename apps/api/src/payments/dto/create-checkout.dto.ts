import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CheckoutType {
  REGISTRATION = 'registration',
  MATCH = 'match',
}

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Tipo de pago', enum: CheckoutType })
  @IsEnum(CheckoutType)
  type: CheckoutType;

  @ApiPropertyOptional({ description: 'ID de la inscripción (si type=registration)' })
  @IsOptional()
  @IsUUID()
  registrationId?: string;

  @ApiPropertyOptional({ description: 'ID del partido (si type=match)' })
  @IsOptional()
  @IsUUID()
  matchId?: string;
}

export class CheckoutResponse {
  paymentId: string;
  checkoutUrl: string;
  sandboxUrl?: string;
  preferenceId: string;
  amount: number;
  currency: string;
  expiresAt: string;
}
