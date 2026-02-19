import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StandingsService } from './generators/standings.service';
import { PlayoffGenerator } from './generators/playoff.generator';
import {
  GeneratePlayoffsDto,
  UpdatePlayoffConfigDto,
} from './dto/generate-playoffs.dto';
import { CategoryStandings, PlayoffSeed } from './dto/standings.dto';

@Injectable()
export class FixturesService {
  private readonly logger = new Logger(FixturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly standingsService: StandingsService,
    private readonly playoffGenerator: PlayoffGenerator,
  ) {}

  /**
   * Get standings for a category
   */
  async getStandings(categoryId: string): Promise<CategoryStandings> {
    const category = await this.validateCategory(categoryId);
    return this.standingsService.getCategoryStandings(categoryId);
  }

  /**
   * Get playoff seeds preview (without generating brackets)
   */
  async getPlayoffSeedsPreview(
    categoryId: string,
    teamsPerZone?: number,
    seedingMethod?: string,
  ): Promise<PlayoffSeed[]> {
    await this.validateCategory(categoryId);

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    const effectiveTeamsPerZone =
      teamsPerZone || category?.teamsQualifyPerZone || 2;
    const effectiveSeedingMethod =
      seedingMethod || category?.playoffSeedingMethod || 'zone_position';

    return this.standingsService.generatePlayoffSeeds(
      categoryId,
      effectiveTeamsPerZone,
      effectiveSeedingMethod,
    );
  }

  /**
   * Generate playoffs for a category
   */
  async generatePlayoffs(dto: GeneratePlayoffsDto) {
    await this.validateCategory(dto.categoryId);

    const result = await this.playoffGenerator.generatePlayoffs(dto);

    this.logger.log(
      `Generated playoffs for category ${dto.categoryId}: ${result.matches.length} matches`,
    );

    return result;
  }

  /**
   * Get playoff bracket for a category
   */
  async getPlayoffBracket(categoryId: string) {
    await this.validateCategory(categoryId);

    const playoffMatches = await this.prisma.match.findMany({
      where: {
        categoryId,
        matchType: {
          in: ['playoff', 'semifinal', 'final', 'third_place'],
        },
        deletedAt: null,
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, logoUrl: true },
        },
        awayTeam: {
          select: { id: true, name: true, logoUrl: true },
        },
        venue: true,
      },
      orderBy: [{ playoffRound: 'desc' }, { playoffPosition: 'asc' }],
    });

    // Group matches by round
    const bracket: Record<string, any[]> = {};

    for (const match of playoffMatches) {
      const roundKey = match.bracketPosition?.startsWith('3RD')
        ? 'third_place'
        : `round_${match.playoffRound}`;

      if (!bracket[roundKey]) {
        bracket[roundKey] = [];
      }

      bracket[roundKey].push({
        id: match.id,
        bracketPosition: match.bracketPosition,
        round: match.playoffRound,
        position: match.playoffPosition,
        matchType: match.matchType,
        status: match.status,
        matchDate: match.matchDate,
        matchTime: match.matchTime,
        venue: match.venue,
        homeTeam: match.homeTeam
          ? {
              ...match.homeTeam,
              seed: match.homeSeed,
              score: match.homeScore,
            }
          : { name: 'TBD', seed: match.homeSeed },
        awayTeam: match.awayTeam
          ? {
              ...match.awayTeam,
              seed: match.awaySeed,
              score: match.awayScore,
            }
          : { name: 'TBD', seed: match.awaySeed },
        winner:
          match.status === 'finalizado'
            ? match.homeScore > match.awayScore
              ? match.homeTeamId
              : match.awayTeamId
            : null,
      });
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        tournament: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      categoryId,
      categoryName: category?.name,
      tournament: category?.tournament,
      playoffsGenerated: category?.playoffsGenerated || false,
      totalMatches: playoffMatches.length,
      completedMatches: playoffMatches.filter((m) => m.status === 'finalizado')
        .length,
      bracket,
    };
  }

  /**
   * Mark regular phase as complete and prepare for playoffs
   */
  async completeRegularPhase(categoryId: string) {
    const category = await this.validateCategory(categoryId);

    // Check all regular matches are finished
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
        regularPhaseCompleted: true,
      },
    });

    // Return standings
    const standings = await this.standingsService.getCategoryStandings(
      categoryId,
    );

    this.logger.log(`Regular phase completed for category ${categoryId}`);

    return {
      message: 'Regular phase completed successfully',
      standings,
    };
  }

  /**
   * Update playoff configuration for a category
   */
  async updatePlayoffConfig(
    categoryId: string,
    config: UpdatePlayoffConfigDto,
  ) {
    await this.validateCategory(categoryId);

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (category?.playoffsGenerated) {
      throw new BadRequestException(
        'Cannot update playoff configuration after playoffs have been generated',
      );
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        playoffFormat: config.playoffFormat,
        teamsQualifyPerZone: config.teamsQualifyPerZone,
        playoffTeamsTotal: config.playoffTeamsTotal,
        playoffSeedingMethod: config.playoffSeedingMethod,
      },
      include: {
        tournament: {
          select: { id: true, name: true },
        },
        zones: {
          where: { deletedAt: null },
          include: {
            _count: { select: { teamZones: true } },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete playoff matches and reset
   */
  async resetPlayoffs(categoryId: string) {
    await this.validateCategory(categoryId);

    await this.playoffGenerator.deletePlayoffs(categoryId);

    this.logger.log(`Playoffs reset for category ${categoryId}`);

    return {
      message: 'Playoffs have been reset successfully',
    };
  }

  /**
   * Called when a playoff match finishes to advance winners
   */
  async onPlayoffMatchFinished(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || !match.bracketPosition) {
      return; // Not a playoff match
    }

    await this.playoffGenerator.advanceWinner(matchId);

    return {
      message: 'Winner advanced in bracket',
    };
  }

  /**
   * Get playoff status for a category
   */
  async getPlayoffStatus(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      include: {
        zones: {
          where: { deletedAt: null },
          include: {
            _count: { select: { teamZones: true } },
          },
        },
        _count: {
          select: { matches: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const regularMatches = await this.prisma.match.count({
      where: {
        categoryId,
        matchType: 'regular',
        deletedAt: null,
      },
    });

    const completedRegularMatches = await this.prisma.match.count({
      where: {
        categoryId,
        matchType: 'regular',
        status: 'finalizado',
        deletedAt: null,
      },
    });

    const playoffMatches = await this.prisma.match.count({
      where: {
        categoryId,
        matchType: { in: ['playoff', 'semifinal', 'final', 'third_place'] },
        deletedAt: null,
      },
    });

    const completedPlayoffMatches = await this.prisma.match.count({
      where: {
        categoryId,
        matchType: { in: ['playoff', 'semifinal', 'final', 'third_place'] },
        status: 'finalizado',
        deletedAt: null,
      },
    });

    const totalTeams = category.zones.reduce(
      (sum, z) => sum + z._count.teamZones,
      0,
    );

    return {
      categoryId: category.id,
      categoryName: category.name,
      playoffFormat: category.playoffFormat,
      teamsQualifyPerZone: category.teamsQualifyPerZone,
      playoffSeedingMethod: category.playoffSeedingMethod,
      regularPhase: {
        completed: category.regularPhaseCompleted,
        totalMatches: regularMatches,
        completedMatches: completedRegularMatches,
        progress:
          regularMatches > 0
            ? Math.round((completedRegularMatches / regularMatches) * 100)
            : 0,
      },
      playoffs: {
        generated: category.playoffsGenerated,
        totalMatches: playoffMatches,
        completedMatches: completedPlayoffMatches,
        progress:
          playoffMatches > 0
            ? Math.round((completedPlayoffMatches / playoffMatches) * 100)
            : 0,
      },
      zones: category.zones.length,
      totalTeams,
      estimatedPlayoffTeams:
        category.teamsQualifyPerZone !== null
          ? category.zones.length * category.teamsQualifyPerZone
          : totalTeams,
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
