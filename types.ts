
export interface DataPoint {
  label: string;
  count: number;
  percentage: number;
  // Added index signature to allow charting libraries like Recharts to access properties dynamically
  [key: string]: string | number;
}

export interface QuestionAnalysis {
  id: string;
  questionText: string;
  chartType: 'pie' | 'bar';
  data: DataPoint[];
  summary: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  responseCount: number;
  analyses: QuestionAnalysis[];
  isPublic: boolean;
  csvContent?: string;
}

export interface AuthState {
  user: string | null;
  isAdmin: boolean;
}