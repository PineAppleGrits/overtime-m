import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a player profile after registration
 * Used when a logged-in user wants to create their player profile
 */
export class CreatePlayerProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
