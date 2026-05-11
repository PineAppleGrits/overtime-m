import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class SetDocumentNumberUseCase {
  constructor(private readonly auth: AuthService) {}

  async execute(supabaseUserId: string, documentNumber: string) {
    return this.auth.setDocumentNumber(supabaseUserId, documentNumber);
  }
}
