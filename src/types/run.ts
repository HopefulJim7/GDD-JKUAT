export type RunType = 'Tempo' | 'Recovery' | 'Long Run' | 'Trail' | 'Track';
export type TerrainType = 'Paved' | 'Trail' | 'Track' | 'Mixed';
export type RouteDifficulty = 'Easy' | 'Moderate' | 'Challenging' | 'Hard';

export interface PublicParticipant {
  id: number;
  displayName: string;
  preferredPace: string | null;
}

export interface SavedRoute {
  id: number;
  title: string;
  distanceKm: number;
  difficulty: RouteDifficulty;
  startLocation: string;
  terrain: TerrainType;
  notes: string | null;
  createdAt: string;
  createdBy: {
    id: number;
    displayName: string;
  };
  isOwner: boolean;
}

export interface RouteFormValues {
  title: string;
  distanceKm: number;
  difficulty: RouteDifficulty;
  startLocation: string;
  terrain: TerrainType;
  notes: string;
}

export interface RunSummary {
  id: number;
  routeId: number | null;
  routeTitle: string | null;
  title: string;
  description: string;
  runDate: string;
  startTime: string;
  meetingPoint: string;
  distanceKm: number;
  paceLabel: string;
  runType: RunType;
  terrain: TerrainType;
  elevationGainM: number;
  maxParticipants: number;
  routeNotes: string | null;
  createdAt: string;
  organizer: {
    id: number;
    displayName: string;
    preferredPace: string | null;
  };
  participantCount: number;
  participants: PublicParticipant[];
  isJoined: boolean;
  isOrganizer: boolean;
}

export interface MemberProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferredPace: string | null;
}

export interface RunFormValues {
  routeId?: number | null;
  title: string;
  description: string;
  runDate: string;
  startTime: string;
  meetingPoint: string;
  distanceKm: number;
  paceLabel: string;
  runType: RunType;
  terrain: TerrainType;
  elevationGainM: number;
  maxParticipants: number;
  routeNotes: string;
}
