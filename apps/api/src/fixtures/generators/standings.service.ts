import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  TeamStanding,
  ZoneStandings,
  CategoryStandings,
  PlayoffSeed,
} from '../dto/standings.dto';

@Injectable()
export class StandingsService {
  private readonly logger = new Logger(StandingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate standings for a category
   */
  async getCategoryStandings(categoryId: string): Promise<CategoryStandings> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
      include: {
        tournament: true,
        zones: {
          where: { deletedAt: null },
          include: {
            teamZones: {
              include: {
                team: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Get all regular phase matches for this category
    const matches = await this.prisma.match.findMany({
      where: {
        categoryId,
        matchType: 'regular',
        deletedAt: null,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        zone: true,
      },
    });

    const completedMatches = matches.filter((m) => m.status === 'finalizado');
    const totalMatches = matches.length;

    // Calculate standings for each zone
    const zoneStandings: ZoneStandings[] = [];

    for (const zone of category.zones) {
      const zoneMatches = completedMatches.filter((m) => m.zoneId === zone.id);
      const teams = zone.teamZones.map((tz) => tz.team);

      const teamStandings = this.calculateTeamStandings(
        teams,
        zoneMatches,
        zone.id,
        zone.name,
      );

      // Sort and assign positions
      teamStandings.sort((a, b) => {
        // Primary: Win percentage
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        // Secondary: Point differential
        if (b.pointsDiff !== a.pointsDiff) {
          return b.pointsDiff - a.pointsDiff;
        }
        // Tertiary: Points for
        return b.pointsFor - a.pointsFor;
      });

      teamStandings.forEach((team, index) => {
        team.position = index + 1;
      });

      zoneStandings.push({
        zoneId: zone.id,
        zoneName: zone.name,
        teams: teamStandings,
      });
    }

    // Calculate overall standings (all teams across zones)
    const allTeamStandings = zoneStandings.flatMap((z) => z.teams);
    allTeamStandings.sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      if (b.pointsDiff !== a.pointsDiff) {
        return b.pointsDiff - a.pointsDiff;
      }
      return b.pointsFor - a.pointsFor;
    });

    allTeamStandings.forEach((team, index) => {
      team.overallPosition = index + 1;
    });

    // Check if regular phase is completed
    const regularPhaseCompleted =
      totalMatches > 0 && completedMatches.length === totalMatches;

    return {
      categoryId: category.id,
      categoryName: category.name,
      tournamentId: category.tournament.id,
      tournamentName: category.tournament.name,
      zones: zoneStandings,
      overallStandings: allTeamStandings,
      regularPhaseCompleted,
      totalMatches,
      completedMatches: completedMatches.length,
    };
  }

  /**
   * Calculate standings for teams based on matches
   */
  private calculateTeamStandings(
    teams: { id: string; name: string; logoUrl: string | null }[],
    matches: {
      homeTeamId: string | null;
      awayTeamId: string | null;
      homeScore: number;
      awayScore: number;
    }[],
    zoneId: string,
    zoneName: string,
  ): TeamStanding[] {
    const standings: TeamStanding[] = teams.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      teamLogo: team.logoUrl || undefined,
      zoneId,
      zoneName,
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsDiff: 0,
      winPercentage: 0,
      position: 0,
    }));

    const standingsMap = new Map(standings.map((s) => [s.teamId, s]));

    for (const match of matches) {
      if (!match.homeTeamId || !match.awayTeamId) continue;

      const homeStanding = standingsMap.get(match.homeTeamId);
      const awayStanding = standingsMap.get(match.awayTeamId);

      if (homeStanding) {
        homeStanding.played++;
        homeStanding.pointsFor += match.homeScore;
        homeStanding.pointsAgainst += match.awayScore;

        if (match.homeScore > match.awayScore) {
          homeStanding.wins++;
        } else if (match.homeScore < match.awayScore) {
          homeStanding.losses++;
        } else {
          homeStanding.ties++;
        }
      }

      if (awayStanding) {
        awayStanding.played++;
        awayStanding.pointsFor += match.awayScore;
        awayStanding.pointsAgainst += match.homeScore;

        if (match.awayScore > match.homeScore) {
          awayStanding.wins++;
        } else if (match.awayScore < match.homeScore) {
          awayStanding.losses++;
        } else {
          awayStanding.ties++;
        }
      }
    }

    // Calculate derived values
    for (const standing of standings) {
      standing.pointsDiff = standing.pointsFor - standing.pointsAgainst;
      standing.winPercentage =
        standing.played > 0 ? standing.wins / standing.played : 0;
    }

    return standings;
  }

  /**
   * Generate playoff seeds based on standings and configuration
   */
  async generatePlayoffSeeds(
    categoryId: string,
    teamsPerZone: number = 2,
    seedingMethod: string = 'zone_position',
  ): Promise<PlayoffSeed[]> {
    const standings = await this.getCategoryStandings(categoryId);

    let qualifyingTeams: TeamStanding[] = [];

    if (seedingMethod === 'zone_position') {
      // Take top N teams from each zone, interleaved for seeding
      for (const zone of standings.zones) {
        const qualifiers = zone.teams.slice(0, teamsPerZone);
        qualifyingTeams.push(...qualifiers);
      }

      // Sort by zone position first, then by overall record within same position
      qualifyingTeams.sort((a, b) => {
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        // Same zone position - sort by overall record
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        return b.pointsDiff - a.pointsDiff;
      });
    } else if (seedingMethod === 'overall_record') {
      // Take best overall records regardless of zone
      const totalTeams = teamsPerZone * standings.zones.length;
      qualifyingTeams = standings.overallStandings.slice(0, totalTeams);
    } else if (seedingMethod === 'points') {
      // Sort by points scored
      qualifyingTeams = [...standings.overallStandings];
      qualifyingTeams.sort((a, b) => b.pointsFor - a.pointsFor);
      const totalTeams = teamsPerZone * standings.zones.length;
      qualifyingTeams = qualifyingTeams.slice(0, totalTeams);
    }

    // Create seeds
    const seeds: PlayoffSeed[] = qualifyingTeams.map((team, index) => ({
      seed: index + 1,
      teamId: team.teamId,
      teamName: team.teamName,
      zoneId: team.zoneId,
      zoneName: team.zoneName,
      zonePosition: team.position,
      record: `${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ''}`,
      pointsDiff: team.pointsDiff,
    }));

    this.logger.log(
      `Generated ${seeds.length} playoff seeds for category ${categoryId}`,
    );

    return seeds;
  }

  /**
   * Check if regular phase is complete for a category
   */
  async isRegularPhaseComplete(categoryId: string): Promise<boolean> {
    const standings = await this.getCategoryStandings(categoryId);
    return standings.regularPhaseCompleted;
  }
}
