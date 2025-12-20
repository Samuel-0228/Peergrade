
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAcademicSummary = async (question: string, data: Array<{ name: string; value: number; percentage: string }>) => {
  const ai = getAI();
  const dataString = data.map(d => `${d.name}: ${d.value} responses (${d.percentage}%)`).join(', ');
  
  const prompt = `
    Analyze the following categorical distribution from a university student survey question:
    Question: "${question}"
    Data: ${dataString}

    Provide a concise, neutral, and descriptive summary of the patterns visible in the data.
    
    Rules (Non-negotiable):
    - 2-3 sentences max.
    - Use neutral, descriptive academic language.
    - Reference concentrations and trends.
    - DO NOT give advice, recommendations, or value judgments.
    - DO NOT use second-person language (no "you").
    - DO NOT predict outcomes.
    
    Allowed phrasing: "appears to indicate", "shows a concentration", "is associated with", "tends to cluster".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.1, // Low temperature for consistent academic tone
      }
    });

    // Use .text property to access the response string
    return response.text || "No summary available.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Summary analysis could not be generated at this time.";
  }
};
