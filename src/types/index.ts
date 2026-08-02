export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Session {
  id: string;
  title: string;
  sessionDate: string;
  location?: string;
  moodTag?: string;
  spotifyLink?: string;
  description?: string;
  coverPhotoUrl?: string;
  isPublic: boolean;
  videoUrl?: string;
  videoThumbnailUrl?: string;
  createdByName: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoveNote {
  id: string;
  content: string;
  writtenByName: string;
  createdAt: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
}

export interface Photo {
  id: string;
  sessionId: string;
  originalUrl: string;
  thumbnailUrl: string;
  caption?: string;
  sortOrder: number;
  isPublic: boolean;
  uploadedByName: string;
  loveNotes: LoveNote[];
  reactions: ReactionSummary[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  description?: string;
  daysUntil: number;
  createdAt: string;
}

export interface CoupleConfig {
  configKey: string;
  configValue: string;
}

export interface Countdown {
  daysTogether: number;
  anniversaryDate: string;
  coupleName: string;
  nextMilestone: Milestone | null;
}

export interface Stats {
  totalSessions: number;
  totalPhotos: number;
  topLocations: { location: string; count: number }[];
  sessionsByMonth: { month: number; count: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp: string;
}
