
import { ChartType, QuestionAnalysis } from '../types';
import { generateAcademicSummary } from './geminiService';

export const parseCSVData = async (csvContent: string): Promise<{ responseCount: number; analyses: QuestionAnalysis[] }> => {
  const lines = csvContent.trim().split('\n').map(line => line.split(','));
  if (lines.length < 2) return { responseCount: 0, analyses: [] };

  const headers = lines[0].map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1);

  // Identify timestamp column (usually first one or contains "Timestamp")
  const timestampIdx = headers.findIndex(h => h.toLowerCase().includes('timestamp'));
  
  const analysisPromises = headers.map(async (header, colIdx) => {
    if (colIdx === timestampIdx) return null;

    const counts: Record<string, number> = {};
    rows.forEach(row => {
      const val = (row[colIdx] || '').trim().replace(/^"|"$/g, '') || 'No Response';
      counts[val] = (counts[val] || 0) + 1;
    });

    const total = rows.length;
    const sortedData = Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: ((value / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value);

    const summary = await generateAcademicSummary(header, sortedData);

    return {
      question: header,
      chartType: sortedData.length > 5 ? ChartType.BAR : ChartType.PIE,
      data: sortedData,
      summary
    } as QuestionAnalysis;
  });

  const analyses = (await Promise.all(analysisPromises)).filter((a): a is QuestionAnalysis => a !== null);

  return {
    responseCount: rows.length,
    analyses
  };
};
