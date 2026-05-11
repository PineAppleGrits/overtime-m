import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth.service';

@Injectable()
export class SetDocumentNumberUseCase {
  constructor(private readonly legacy: AuthService) {}

  async execute(supabaseUserId: string, documentNumber: string) {
    return this.legacy.setDocumentNumber(supabaseUserId, documentNumber);
  }
}
