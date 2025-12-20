
export enum ChartType {
  PIE = 'PIE',
  BAR = 'BAR'
}

export interface QuestionAnalysis {
  question: string;
  chartType: ChartType;
  data: Array<{ name: string; value: number; percentage: string }>;
  summary: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  responseCount: number;
  isPublic: boolean;
  analyses: QuestionAnalysis[];
}

export interface AuthState {
  isAdmin: boolean;
  email: string | null;
}
