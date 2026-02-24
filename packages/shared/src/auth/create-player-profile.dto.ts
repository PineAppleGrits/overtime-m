import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePlayerProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
