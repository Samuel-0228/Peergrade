
export enum SessionStatus {
  LIVE = 'Live',
  PAUSED = 'Paused',
  ARCHIVED = 'Archived'
}

export interface SurveyColumn {
  id: string;
  label: string;
  type: 'categorical' | 'numerical';
  isVisualizable: boolean;
}

export interface RawResponse {
  [key: string]: string | number;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  sheetUrl?: string;
  sourceName?: string;
  participationCount: number;
  lastUpdated: string;
  status: SessionStatus;
  isPublic: boolean;
  aiInsights?: string;
  columnDescriptions?: Record<string, string>;
  columns: SurveyColumn[];
  responses: RawResponse[];
  showCharts: boolean;
  showAiInsights: boolean;
  enableCsvDownload: boolean;
}

export enum UserRole {
  PUBLIC = 'Public',
  ADMIN = 'Admin',
  OWNER = 'Owner'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}
