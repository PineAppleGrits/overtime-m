import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth.service';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly legacy: AuthService) {}

  async execute(supabaseUserId: string) {
    return this.legacy.getProfile(supabaseUserId);
  }
}
