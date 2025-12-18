
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  RESEARCH_ASSISTANT = 'RESEARCH_ASSISTANT',
  VISUALIZATION_GEN = 'VISUALIZATION_GEN',
  ADMIN = 'ADMIN'
}

export interface AdmissionData {
  department: string;
  applicants: number;
  averageGrade: number;
  acceptanceRate: number;
  firstChoiceDemand: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface ImageGenParams {
  prompt: string;
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize: '1K' | '2K' | '4K';
}
