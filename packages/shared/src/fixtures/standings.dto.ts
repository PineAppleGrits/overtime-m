export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  zoneId: string;
  zoneName: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  winPercentage: number;
  position: number;
  overallPosition?: number;
  headToHeadWins?: number;
  homeRecord?: string;
  awayRecord?: string;
}

export interface ZoneStandings {
  zoneId: string;
  zoneName: string;
  teams: TeamStanding[];
}

export interface CategoryStandings {
  categoryId: string;
  categoryName: string;
  tournamentId: string;
  tournamentName: string;
  zones: ZoneStandings[];
  overallStandings: TeamStanding[];
  regularPhaseCompleted: boolean;
  totalMatches: number;
  completedMatches: number;
}
