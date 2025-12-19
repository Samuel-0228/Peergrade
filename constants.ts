
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

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'sav-1',
    title: 'University Entrance Cohort Analysis Q4',
    description: 'A neutral, descriptive study of incoming cohort academic profiles and departmental interests.',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1X-SAVVY-1',
    participationCount: 1240,
    lastUpdated: new Date().toISOString(),
    status: SessionStatus.LIVE,
    isPublic: true,
    showCharts: true,
    showAiInsights: true,
    enableCsvDownload: true,
    aiInsights: 'Respondents reporting entrance scores in the 530+ category appear most frequently associated with interests in Mathematics and Computer Science.',
    columns: MOCK_SURVEY_COLUMNS,
    responses: generateResponses(1240),
    columnDescriptions: {
      q1: "Computer Science and Mathematics are the most frequently selected fields of interest in this cohort.",
      q2: "GPA reports are concentrated heavily in the 3.5–3.75 range, showing a high academic performance trend.",
      q3: "A significant portion of respondents achieved scores above 530, while 15% opted not to report their entrance score."
    }
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'savvysocietyteam@gmail.com', role: UserRole.OWNER },
  { id: 'u2', email: 'admin@savvy.edu', role: UserRole.ADMIN }
];
