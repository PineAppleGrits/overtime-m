import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly auth: AuthService) {}

  async execute(supabaseUserId: string) {
    return this.auth.getProfile(supabaseUserId);
  }
}
