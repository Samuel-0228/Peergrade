
import { AdmissionData } from '../types';

export class DataService {
  /**
   * Fetches data from a published Google Sheets CSV URL
   * Expected CSV format: Department, Applicants, Average Grade, Acceptance Rate, 1st Choice Demand
   */
  async fetchExternalAdmissions(url: string): Promise<AdmissionData[]> {
    try {
      const response = await fetch(url);
      const csvText = await response.text();
      
      // Basic CSV Parser (assuming no commas inside quotes for simplicity in this dashboard context)
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          department: values[0] || 'Unknown',
          applicants: parseInt(values[1]) || 0,
          averageGrade: parseFloat(values[2]) || 0,
          acceptanceRate: parseFloat(values[3]) || 0,
          firstChoiceDemand: parseFloat(values[4]) || 0
        };
      });
    } catch (error) {
      console.error("Failed to fetch external data:", error);
      throw new Error("Synchronization failure: Ensure the URL is a published CSV.");
    }
  }
}
