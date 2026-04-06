import { IsEnum, IsNotEmpty } from "class-validator";
import { TournamentStatus } from "./enums";

export class ChangeStatusDto {
  @IsEnum(TournamentStatus)
  @IsNotEmpty()
  status: TournamentStatus;
}
