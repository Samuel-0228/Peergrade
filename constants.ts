
import { Session, SessionStatus, UserRole, User } from './types';

const MOCK_SURVEY_COLUMNS = [
  { id: 'q1', label: 'Primary Field of Academic Interest', type: 'categorical' as const, isVisualizable: true },
  { id: 'q2', label: 'Current GPA Bracket', type: 'categorical' as const, isVisualizable: true },
  { id: 'q3', label: 'Standardized Entrance Score', type: 'categorical' as const, isVisualizable: true },
];

const generateResponses = (count: number) => {
  return Array.from({ length: count }, () => ({
    q1: ['Computer Science', 'Mathematics', 'Physics', 'Digital Design', 'Jurisprudence'][Math.floor(Math.random() * 5)],
    q2: ['Below 2.5', '2.5 – 3.0', '3.0 – 3.5', '3.5 – 3.75', '3.75 – 4.0'][Math.floor(Math.random() * 5)],
    q3: ['< 450', '450 – 500', '500 – 530', '530+', 'Not Reported'][Math.floor(Math.random() * 5)],
  }));
};

const MOCK_RESPONSES = generateResponses(1240);

// Simple pre-calc for mock correlation
const MOCK_CORRELATION = JSON.stringify({
  "Primary Field of Academic Interest x Current GPA Bracket": {
    "Computer Science": { "3.75 – 4.0": 85, "3.5 – 3.75": 120, "3.0 – 3.5": 45 },
    "Mathematics": { "3.75 – 4.0": 92, "3.5 – 3.75": 110, "3.0 – 3.5": 50 },
    "Physics": { "3.75 – 4.0": 78, "3.5 – 3.75": 90, "3.0 – 3.5": 60 }
  }
});

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'sav-1',
    title: 'Academic Profile Cohort Analysis 2024',
    description: 'A comprehensive descriptive analysis of departmental interests and academic benchmarks for the current admission cycle.',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1X-SAVVY-1',
    participationCount: 1240,
    lastUpdated: new Date().toISOString(),
    status: SessionStatus.LIVE,
    isPublic: true,
    showCharts: true,
    showAiInsights: true,
    enableCsvDownload: true,
    aiInsights: 'Deep learning clusters identified significant concentration in Computer Science with a core GPA benchmark of 3.75+.',
    columns: MOCK_SURVEY_COLUMNS,
    responses: MOCK_RESPONSES,
    correlationData: MOCK_CORRELATION,
    columnDescriptions: {
      q1: "Field interest is dominated by Computer Science and Mathematics, accounting for nearly 45% of total interest across all surveyed disciplines.",
      q2: "The GPA distribution reveals a strong clustering in the 3.5 to 3.75 range, indicating a highly competitive academic baseline for the current cohort.",
      q3: "Entrance scores show significant variance, though the 530+ bracket remains the most prominent for respondents reporting departmental preferences."
    }
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'savvysocietyteam@gmail.com', role: UserRole.OWNER },
  { id: 'u2', email: 'admin@savvy.edu', role: UserRole.ADMIN }
];
