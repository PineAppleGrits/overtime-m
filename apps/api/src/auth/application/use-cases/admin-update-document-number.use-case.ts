import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AdminUpdateDocumentNumberUseCase {
  constructor(private readonly auth: AuthService) {}

  async execute(profileId: string, documentNumber: string) {
    return this.auth.adminUpdateDocumentNumber(profileId, documentNumber);
  }
}
