
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("CONFIG_ERROR");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateAcademicSummary = async (question: string, data: Array<{ name: string; value: number; percentage: string }>) => {
  const dataString = data.map(d => `${d.name}: ${d.value} responses (${d.percentage}%)`).join(', ');
  
  const prompt = `
    Analyze the following categorical distribution from a university student survey question:
    Question: "${question}"
    Data: ${dataString}

    Provide a concise, neutral, and descriptive summary of the patterns visible in the data.
    
    Rules:
    - 2-3 sentences max.
    - Use neutral, descriptive academic language.
    - Reference concentrations and trends.
    - DO NOT give advice, recommendations, or value judgments.
    - DO NOT use second-person language.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.1,
      }
    });

    return response.text || "Summary not available for this data segment.";
  } catch (error: any) {
    console.error("Gemini Internal Error:", error);
    return "Summary analysis not available for this session.";
  }
};
