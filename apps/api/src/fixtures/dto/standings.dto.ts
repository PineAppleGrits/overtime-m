export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  zoneId: string;
  zoneName: string;
  
  // Record
  played: number;
  wins: number;
  losses: number;
  ties: number;
  
  // Points
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  
  // Ranking
  winPercentage: number;
  position: number; // Position within zone
  overallPosition?: number; // Position across all zones
  
  // Tiebreakers
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
  overallStandings: TeamStanding[]; // All teams ranked
  regularPhaseCompleted: boolean;
  totalMatches: number;
  completedMatches: number;
}

export interface PlayoffSeed {
  seed: number;
  teamId: string;
  teamName: string;
  zoneId: string;
  zoneName: string;
  zonePosition: number;
  record: string; // e.g., "8-2"
  pointsDiff: number;
}
