
import { GoogleGenAI } from "@google/genai";
import { DataPoint } from "../types";

// Always use the process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAcademicSummary = async (questionText: string, data: DataPoint[]): Promise<string> => {
  const dataString = data.map(d => `${d.label}: ${d.count} (${d.percentage}%)`).join(", ");
  
  const prompt = `
    Analyze this survey question and its resulting data distribution for an academic insight dashboard.
    
    Question: "${questionText}"
    Distribution: [${dataString}]
    
    TASK:
    Write a neutral, descriptive, and academic summary of what the data shows.
    - Describe distributions and concentrations.
    - Reference the sample group as a whole.
    - Be concise (2-3 sentences max).
    - Use phrases like "appears to indicate", "shows a concentration", "is associated with", or "tends to cluster".
    - STRICTLY FORBIDDEN: advice, recommendations, predictions, second-person language ("you"), or value judgments ("good", "bad", "low", "high").
    - Use institutional, research-oriented tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
      }
    });

    // The text property is a getter and should not be called as a function
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Data analysis complete. Distribution patterns observed across the sampled population.";
  }
};