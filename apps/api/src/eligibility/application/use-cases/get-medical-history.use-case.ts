import { Injectable } from '@nestjs/common';
import { MediaAsset, MediaCategory } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface GetMedicalHistoryInput {
  profileId: string;
  category?: MediaCategory; // MEDICAL_CERT (default) o SWORN_STATEMENT
}

@Injectable()
export class GetMedicalHistoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: GetMedicalHistoryInput): Promise<MediaAsset[]> {
    const category = input.category ?? MediaCategory.MEDICAL_CERT;
    return this.prisma.mediaAsset.findMany({
      where: {
        category,
        deletedAt: null,
        // metadata.profileId === input.profileId
        AND: [
          {
            metadata: {
              path: ['profileId'],
              equals: input.profileId,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
