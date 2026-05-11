import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CategorySubstatus, CategoryStandings } from '@overtime-mono/shared';
import { PrismaService } from '../../../database/prisma.service';
import { StandingsService } from '../../generators/standings.service';

@Injectable()
export class FixturesService {
  private readonly logger = new Logger(FixturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly standingsService: StandingsService,
  ) {}

  async getStandings(categoryId: string): Promise<CategoryStandings> {
    await this.validateCategory(categoryId);
    return this.standingsService.getCategoryStandings(categoryId);
  }

  async completeRegularPhase(categoryId: string) {
    await this.validateCategory(categoryId);

    const pendingMatches = await this.prisma.match.count({
      where: {
        categoryId,
        matchType: 'regular',
        status: { not: 'finalizado' },
        deletedAt: null,
      },
    });

    if (pendingMatches > 0) {
      throw new BadRequestException(
        `Cannot complete regular phase: ${pendingMatches} matches are not finished`,
      );
    }

    await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        substatus: CategorySubstatus.PLAYOFFS_FASE,
      },
    });

    const standings = await this.standingsService.getCategoryStandings(
      categoryId,
    );

    this.logger.log(`Regular phase completed for category ${categoryId}`);

    return {
      message: 'Regular phase completed successfully',
      standings,
    };
  }

  private async validateCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return category;
  }
}
