import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class ComputeAjcDto {
  @ApiProperty({ description: 'Sueldo del árbitro por partido (ARS)', example: 5000 })
  @IsNumber()
  @IsPositive()
  refereeSalary!: number;

  @ApiProperty({ description: 'Cantidad de fechas a liberar', example: 2 })
  @IsInt()
  @Min(1)
  fechasToFree!: number;
}

export class ApplyAjcDto {
  @ApiProperty({ description: 'Profile del jugador suspendido' })
  @IsUUID()
  profileId!: string;

  @ApiProperty({ description: 'Sanción disciplinaria activa del jugador' })
  @IsUUID()
  sanctionId!: string;

  @ApiProperty({ description: 'Sueldo del árbitro por partido (ARS)', example: 5000 })
  @IsNumber()
  @IsPositive()
  refereeSalary!: number;

  @ApiProperty({ description: 'Cantidad de fechas a liberar', example: 2 })
  @IsInt()
  @Min(1)
  fechasToFree!: number;

  @ApiPropertyOptional({
    description: 'Total de fechas de la sanción (opcional, para validar que no se exceda)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  sanctionTotalFechas?: number;
}
