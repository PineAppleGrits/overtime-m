import { IsUUID, IsNotEmpty } from "class-validator";

export class AssignTeamDto {
  @IsUUID()
  @IsNotEmpty()
  teamId: string;
}
