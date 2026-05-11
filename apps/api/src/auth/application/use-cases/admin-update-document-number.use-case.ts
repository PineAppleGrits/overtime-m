import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth.service';

@Injectable()
export class AdminUpdateDocumentNumberUseCase {
  constructor(private readonly legacy: AuthService) {}

  async execute(profileId: string, documentNumber: string) {
    return this.legacy.adminUpdateDocumentNumber(profileId, documentNumber);
  }
}
