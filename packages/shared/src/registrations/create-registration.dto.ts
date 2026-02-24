import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateRegistrationDto {
  @IsUUID()
  @IsNotEmpty()
  teamId: string;

  @IsUUID()
  @IsNotEmpty()
  tournamentId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}
