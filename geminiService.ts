
import { GoogleGenAI, Type } from "@google/genai";
import { RawResponse, SurveyColumn } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates robust, 2-3 sentence neutral descriptions for each question.
 */
export const generateQuestionDescriptions = async (
  responses: RawResponse[], 
  columns: SurveyColumn[]
): Promise<Record<string, string>> => {
  const dataSummaries = columns.map(col => {
    const dist: Record<string, number> = {};
    responses.forEach(r => {
      const val = r[col.id];
      if (val) {
        const sVal = String(val).trim();
        dist[sVal] = (dist[sVal] || 0) + 1;
      }
    });
    return { id: col.id, label: col.label, distribution: dist };
  });

  const prompt = `
    Analyze these survey question distributions. 
    For each question, provide 2-3 neutral, factual sentences describing patterns, concentrations, and the relative spread of responses.
    
    RULES:
    - NO ADVICE, NO RECOMMENDATIONS, NO JUDGMENT.
    - Describe the "shape" of the data (e.g., "skewed towards", "uniformly distributed", "highly concentrated in X").
    - Use sophisticated academic language but stay strictly observational.
    - Mention specific percentages or counts if they highlight a significant majority.
    
    Data: ${JSON.stringify(dataSummaries)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: columns.reduce((acc, col) => {
            acc[col.id] = { type: Type.STRING, description: `Analytical description for ${col.label}` };
            return acc;
          }, {} as any),
          required: columns.map(c => c.id)
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {};
  }
};

/**
 * Handles the Companion AI chat logic with correlation context.
 */
export const chatWithCompanion = async (
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  dataSummary: string,
  correlationData: string,
  sessionTitle: string
) => {
  const systemInstruction = `
    You are Savvy Companion, a structural academic research node for "${sessionTitle}".
    
    CONTEXTUAL DATA:
    Flat Distributions: ${dataSummary.substring(0, 3000)}
    
    CROSS-TABULATION (CORRELATION MAP):
    The map contains counts for specific intersections between questions (e.g., "Major x GPA").
    ${correlationData.substring(0, 6000)}
    
    BEHAVIORAL RULES:
    1. PRECISION: If a user asks "How many people with [Value A] chose [Value B]?", look at the Correlation Map.
       - Example logic: For "GPA x Major", look for the GPA bracket, then the count for that Major.
    2. TRANSPARENCY: If the specific intersection isn't in the provided map, say "The current structural summary doesn't map that specific cross-point, but general trends suggest..."
    3. NO ADVICE: Never suggest actions.
    4. REDIRECT: Official results or admission lists are ONLY at https://t.me/Savvy_Society.
    5. TONE: Neutral, high-fidelity, academic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages,
      config: {
        systemInstruction,
        temperature: 0.1
      }
    });
    return response.text;
  } catch (error) {
    console.error("Companion AI Chat Error:", error);
    return "Protocol connection lost. Visit t.me/Savvy_Society.";
  }
};
