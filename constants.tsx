
import { AdmissionData } from './types';

export const MOCK_ADMISSIONS: AdmissionData[] = [
  { department: 'Quantum Engineering', applicants: 1250, averageGrade: 94.5, acceptanceRate: 12, firstChoiceDemand: 88 },
  { department: 'Neural Architecture', applicants: 2100, averageGrade: 92.1, acceptanceRate: 18, firstChoiceDemand: 74 },
  { department: 'Computational Ethics', applicants: 850, averageGrade: 88.4, acceptanceRate: 25, firstChoiceDemand: 62 },
  { department: 'Astrophysics', applicants: 1400, averageGrade: 95.2, acceptanceRate: 10, firstChoiceDemand: 91 },
  { department: 'Bio-Synthetic Design', applicants: 1800, averageGrade: 90.8, acceptanceRate: 22, firstChoiceDemand: 68 },
  { department: 'Macro-Economics', applicants: 3200, averageGrade: 85.5, acceptanceRate: 30, firstChoiceDemand: 55 }
];

export const SYSTEM_INSTRUCTION = `You are an Academic Research Analyst. 
Your tone is neutral, observational, and data-driven. 
NEVER provide advice, instructions, or value judgments. 
DO NOT tell users what to do. 
ONLY describe patterns, distributions, and trends visible in the data. 
Use phrases like "may indicate", "appears to suggest", "is associated with". 
Be concise (2-4 sentences max).`;
