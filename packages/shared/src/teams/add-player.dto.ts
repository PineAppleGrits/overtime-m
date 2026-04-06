import { IsUUID } from 'class-validator';

/**
 * @deprecated Use `addPlayerSchema` from `packages/shared` instead.
 */
export class AddPlayerDto {
  @IsUUID()
  profileId: string;
}
