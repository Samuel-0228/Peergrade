
import { GoogleGenAI } from "@google/genai";

const getEnv = (key: string): string | undefined => {
  try {
    const viteKey = `VITE_${key}`;
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env;
      if (env[viteKey]) return env[viteKey];
      if (env[key]) return env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[viteKey] || process.env[key];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const getAI = () => {
  const apiKey = getEnv('API_KEY');
  if (!apiKey) {
    throw new Error("CONFIG_ERROR");
  }
  return new GoogleGenAI({ apiKey });
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
    if (error.message === "CONFIG_ERROR") {
      return "Service configuration pending (API_KEY missing from environment).";
    }
    return "Summary analysis not available for this session.";
  }
};
