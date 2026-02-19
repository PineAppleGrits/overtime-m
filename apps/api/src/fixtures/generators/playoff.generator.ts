import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StandingsService } from './standings.service';
import { PlayoffSeed } from '../dto/standings.dto';
import {
  GeneratePlayoffsDto,
  PlayoffFormat,
  SeedingMethod,
} from '../dto/generate-playoffs.dto';

export interface BracketMatch {
  round: number; // 1 = Final, 2 = Semifinal, etc.
  position: number; // Position within round
  bracketPosition: string; // e.g., "QF1", "SF1", "F"
  matchType: string;
  homeSeed?: number;
  awaySeed?: number;
  homeTeamId?: string;
  awayTeamId?: string;
  homeFromMatchId?: string;
  awayFromMatchId?: string;
  homeFromPosition?: 'winner' | 'loser';
  awayFromPosition?: 'winner' | 'loser';
}

@Injectable()
export class PlayoffGenerator {
  private readonly logger = new Logger(PlayoffGenerator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly standingsService: StandingsService,
  ) {}

  /**
   * Generate playoff bracket for a category
   */
  async generatePlayoffs(dto: GeneratePlayoffsDto): Promise<{
    matches: any[];
    seeds: PlayoffSeed[];
    bracket: BracketMatch[];
  }> {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId, deletedAt: null },
      include: {
        zones: { where: { deletedAt: null } },
      },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    if (category.playoffsGenerated) {
      throw new BadRequestException(
        'Playoffs have already been generated for this category. Delete existing playoff matches first.',
      );
    }

    // Check if regular phase is complete
    const isComplete = await this.standingsService.isRegularPhaseComplete(
      dto.categoryId,
    );

    if (!isComplete) {
      throw new BadRequestException(
        'Regular phase is not complete. All regular matches must be finished before generating playoffs.',
      );
    }

    // Get configuration
    const teamsPerZone = dto.teamsPerZone || category.teamsQualifyPerZone || 2;
    const seedingMethod =
      dto.seedingMethod ||
      (category.playoffSeedingMethod as SeedingMethod) ||
      SeedingMethod.ZONE_POSITION;
    const format =
      dto.format ||
      (category.playoffFormat as PlayoffFormat) ||
      PlayoffFormat.SINGLE_ELIMINATION;
    const includeThirdPlace = dto.includeThirdPlace ?? true;

    // Generate seeds
    const seeds = await this.standingsService.generatePlayoffSeeds(
      dto.categoryId,
      teamsPerZone,
      seedingMethod,
    );

    // Calculate total teams (must be power of 2, or we'll use byes)
    let totalTeams = dto.teamsTotal || seeds.length;
    const bracketSize = this.getNextPowerOfTwo(totalTeams);

    if (seeds.length < 2) {
      throw new BadRequestException(
        'At least 2 teams are required to generate playoffs',
      );
    }

    this.logger.log(
      `Generating ${format} playoffs with ${seeds.length} teams (bracket size: ${bracketSize})`,
    );

    // Generate bracket structure
    let bracket: BracketMatch[];
    if (format === PlayoffFormat.SINGLE_ELIMINATION) {
      bracket = this.generateSingleEliminationBracket(
        bracketSize,
        seeds,
        includeThirdPlace,
      );
    } else {
      // Double elimination would go here
      throw new BadRequestException(
        'Double elimination is not yet implemented',
      );
    }

    // Create matches in database
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : this.getDefaultStartDate();
    const daysBetweenRounds = dto.daysBetweenRounds || 7;

    const createdMatches = await this.createPlayoffMatches(
      bracket,
      dto.categoryId,
      startDate,
      daysBetweenRounds,
      dto.venueId,
    );

    // Mark category as having playoffs generated
    await this.prisma.category.update({
      where: { id: dto.categoryId },
      data: {
        playoffsGenerated: true,
        regularPhaseCompleted: true,
      },
    });

    return {
      matches: createdMatches,
      seeds,
      bracket,
    };
  }

  /**
   * Generate single elimination bracket structure
   */
  private generateSingleEliminationBracket(
    bracketSize: number,
    seeds: PlayoffSeed[],
    includeThirdPlace: boolean,
  ): BracketMatch[] {
    const bracket: BracketMatch[] = [];
    const totalRounds = Math.log2(bracketSize);

    // Map seeds to first round matchups using standard bracket seeding
    const firstRoundMatchups = this.generateBracketMatchups(bracketSize);

    // Generate first round matches
    const firstRoundMatches: BracketMatch[] = [];
    for (let i = 0; i < firstRoundMatchups.length; i++) {
      const [homeSeedNum, awaySeedNum] = firstRoundMatchups[i];
      const homeSeed = seeds.find((s) => s.seed === homeSeedNum);
      const awaySeed = seeds.find((s) => s.seed === awaySeedNum);

      // Handle byes (when team doesn't exist)
      const isByeMatch = !homeSeed || !awaySeed;

      const match: BracketMatch = {
        round: totalRounds,
        position: i + 1,
        bracketPosition: this.getBracketPosition(totalRounds, i + 1),
        matchType: this.getMatchType(totalRounds),
        homeSeed: homeSeedNum,
        awaySeed: awaySeedNum,
        homeTeamId: homeSeed?.teamId,
        awayTeamId: awaySeed?.teamId,
      };

      firstRoundMatches.push(match);
    }

    bracket.push(...firstRoundMatches);

    // Generate subsequent rounds
    let previousRoundMatches = firstRoundMatches;
    for (let round = totalRounds - 1; round >= 1; round--) {
      const matchesInRound = Math.pow(2, round - 1);
      const roundMatches: BracketMatch[] = [];

      for (let i = 0; i < matchesInRound; i++) {
        const sourceMatch1Index = i * 2;
        const sourceMatch2Index = i * 2 + 1;

        const match: BracketMatch = {
          round,
          position: i + 1,
          bracketPosition: this.getBracketPosition(round, i + 1),
          matchType: this.getMatchType(round),
          homeFromPosition: 'winner',
          awayFromPosition: 'winner',
          // Source matches will be linked after creation
        };

        roundMatches.push(match);
      }

      bracket.push(...roundMatches);
      previousRoundMatches = roundMatches;
    }

    // Add third place match if requested and we have semifinals
    if (includeThirdPlace && totalRounds >= 2) {
      bracket.push({
        round: 1, // Same round as final
        position: 2, // Second match in final round
        bracketPosition: '3RD',
        matchType: 'third_place',
        homeFromPosition: 'loser',
        awayFromPosition: 'loser',
      });
    }

    return bracket;
  }

  /**
   * Generate standard bracket matchups for first round
   * Uses the standard tournament seeding pattern (1v16, 8v9, 5v12, 4v13, etc.)
   */
  private generateBracketMatchups(bracketSize: number): [number, number][] {
    if (bracketSize === 2) {
      return [[1, 2]];
    }

    const matchups: [number, number][] = [];

    // Standard bracket seeding algorithm
    const generateSeeding = (
      size: number,
      seeds: number[] = [1],
    ): number[] => {
      if (seeds.length === size) return seeds;

      const newSeeds: number[] = [];
      const nextSize = seeds.length * 2;

      for (const seed of seeds) {
        newSeeds.push(seed);
        newSeeds.push(nextSize + 1 - seed);
      }

      return generateSeeding(size, newSeeds);
    };

    const seeding = generateSeeding(bracketSize);

    for (let i = 0; i < seeding.length; i += 2) {
      matchups.push([seeding[i], seeding[i + 1]]);
    }

    return matchups;
  }

  /**
   * Get bracket position string (e.g., "R16-1", "QF1", "SF1", "F")
   */
  private getBracketPosition(round: number, position: number): string {
    const totalMatches = Math.pow(2, round - 1);

    switch (totalMatches) {
      case 1:
        return 'F'; // Final
      case 2:
        return `SF${position}`; // Semifinal
      case 4:
        return `QF${position}`; // Quarterfinal
      case 8:
        return `R16-${position}`; // Round of 16
      case 16:
        return `R32-${position}`; // Round of 32
      default:
        return `R${totalMatches * 2}-${position}`;
    }
  }

  /**
   * Get match type based on round
   */
  private getMatchType(round: number): string {
    const totalMatches = Math.pow(2, round - 1);

    switch (totalMatches) {
      case 1:
        return 'final';
      case 2:
        return 'semifinal';
      default:
        return 'playoff';
    }
  }

  /**
   * Get next power of 2 (for bracket sizing)
   */
  private getNextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  /**
   * Get default start date (next week)
   */
  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(18, 0, 0, 0);
    return date;
  }

  /**
   * Create playoff matches in database
   */
  private async createPlayoffMatches(
    bracket: BracketMatch[],
    categoryId: string,
    startDate: Date,
    daysBetweenRounds: number,
    venueId?: string,
  ): Promise<any[]> {
    // Sort bracket by round (descending) to create earlier rounds first
    const sortedBracket = [...bracket].sort((a, b) => b.round - a.round);

    // Group by round
    const roundGroups = new Map<number, BracketMatch[]>();
    for (const match of sortedBracket) {
      const rounds = roundGroups.get(match.round) || [];
      rounds.push(match);
      roundGroups.set(match.round, rounds);
    }

    // Get max round (first round of tournament)
    const maxRound = Math.max(...roundGroups.keys());

    // Create matches round by round
    const createdMatches: any[] = [];
    const matchIdMap = new Map<string, string>(); // bracketPosition -> matchId

    for (let round = maxRound; round >= 1; round--) {
      const roundMatches = roundGroups.get(round) || [];
      const roundDate = new Date(startDate);
      roundDate.setDate(roundDate.getDate() + (maxRound - round) * daysBetweenRounds);

      for (const bracketMatch of roundMatches) {
        // Resolve source matches for advancement
        let homeFromMatchId: string | undefined;
        let awayFromMatchId: string | undefined;

        if (bracketMatch.homeFromPosition && round < maxRound) {
          // Find source match for home team
          const sourcePosition = bracketMatch.position * 2 - 1;
          const sourceBracketPos = this.getBracketPosition(round + 1, sourcePosition);
          homeFromMatchId = matchIdMap.get(sourceBracketPos);
        }

        if (bracketMatch.awayFromPosition && round < maxRound) {
          // Find source match for away team
          const sourcePosition = bracketMatch.position * 2;
          const sourceBracketPos = this.getBracketPosition(round + 1, sourcePosition);
          awayFromMatchId = matchIdMap.get(sourceBracketPos);
        }

        // Special handling for third place match
        if (bracketMatch.bracketPosition === '3RD') {
          const sf1Id = matchIdMap.get('SF1');
          const sf2Id = matchIdMap.get('SF2');
          homeFromMatchId = sf1Id;
          awayFromMatchId = sf2Id;
        }

        const match = await this.prisma.match.create({
          data: {
            categoryId,
            venueId,
            matchDate: roundDate,
            matchTime: '18:00',
            status: 'programado',
            matchType: bracketMatch.matchType,
            homeTeamId: bracketMatch.homeTeamId,
            awayTeamId: bracketMatch.awayTeamId,
            playoffRound: bracketMatch.round,
            playoffPosition: bracketMatch.position,
            bracketPosition: bracketMatch.bracketPosition,
            homeSeed: bracketMatch.homeSeed,
            awaySeed: bracketMatch.awaySeed,
            homeFromMatchId,
            awayFromMatchId,
            homeFromPosition: bracketMatch.homeFromPosition,
            awayFromPosition: bracketMatch.awayFromPosition,
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
        });

        matchIdMap.set(bracketMatch.bracketPosition, match.id);
        createdMatches.push(match);

        this.logger.log(
          `Created playoff match: ${bracketMatch.bracketPosition}`,
        );
      }
    }

    return createdMatches;
  }

  /**
   * Advance team in bracket after a match is finished
   */
  async advanceWinner(matchId: string): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    if (!match || match.status !== 'finalizado') {
      throw new BadRequestException(
        'Match must be finished to advance winner',
      );
    }

    if (!match.homeTeamId || !match.awayTeamId) {
      throw new BadRequestException('Match must have both teams assigned');
    }

    // Determine winner and loser
    const winnerId =
      match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    const loserId =
      match.homeScore > match.awayScore ? match.awayTeamId : match.homeTeamId;

    // Find matches that depend on this match
    const dependentMatches = await this.prisma.match.findMany({
      where: {
        OR: [{ homeFromMatchId: matchId }, { awayFromMatchId: matchId }],
        deletedAt: null,
      },
    });

    for (const dependentMatch of dependentMatches) {
      const updates: { homeTeamId?: string; awayTeamId?: string } = {};

      if (dependentMatch.homeFromMatchId === matchId) {
        updates.homeTeamId =
          dependentMatch.homeFromPosition === 'winner' ? winnerId : loserId;
      }

      if (dependentMatch.awayFromMatchId === matchId) {
        updates.awayTeamId =
          dependentMatch.awayFromPosition === 'winner' ? winnerId : loserId;
      }

      if (Object.keys(updates).length > 0) {
        await this.prisma.match.update({
          where: { id: dependentMatch.id },
          data: updates,
        });

        this.logger.log(
          `Advanced teams to match ${dependentMatch.bracketPosition}`,
        );
      }
    }
  }

  /**
   * Delete all playoff matches for a category
   */
  async deletePlayoffs(categoryId: string): Promise<void> {
    await this.prisma.match.updateMany({
      where: {
        categoryId,
        matchType: {
          in: ['playoff', 'semifinal', 'final', 'third_place'],
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        playoffsGenerated: false,
      },
    });

    this.logger.log(`Deleted playoffs for category ${categoryId}`);
  }
}
