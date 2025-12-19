
import { GoogleGenAI, Type } from "@google/genai";
import { RawResponse, SurveyColumn } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates neutral, 1-sentence descriptions for each question based on data distribution.
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
    For each question, provide a EXACTLY ONE neutral, factual sentence describing the most prominent pattern or the overall spread.
    
    RULES:
    - NO ADVICE.
    - NO RECOMMENDATIONS.
    - NO JUDGMENT (e.g., don't say "good" or "bad").
    - Use phrases like "concentrated in", "distributed across", "shows a majority in".
    - 1 sentence maximum per question.
    
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
            acc[col.id] = { type: Type.STRING, description: `Neutral description for ${col.label}` };
            return acc;
          }, {} as any),
          required: columns.map(c => c.id)
        }
      }
    });
    
    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {};
  }
};

/**
 * Handles the Companion AI chat logic. Directs users to Telegram for results.
 */
export const chatWithCompanion = async (
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  dataSummary: string,
  sessionTitle: string
) => {
  const systemInstruction = `
    You are Savvy Companion, a neutral academic research assistant for the dashboard "${sessionTitle}".
    
    CRITICAL RULES:
    1. If the user asks for "results", "admission lists", "who got in", "my result", "pass mark", or "official outcomes", you MUST direct them to the official Telegram channel: https://t.me/Savvy_Society. This is the ONLY place for official results.
    2. Maintain a neutral, academic tone.
    3. Never give advice (e.g., "you should apply to X").
    4. Never predict success or failure for any individual.
    5. Base your answers strictly on the collective data trends provided in this summary: ${dataSummary.substring(0, 5000)}.
    6. Mention that the data is aggregated and anonymous.
    7. Do not use emojis.
    8. Be concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });
    return response.text;
  } catch (error) {
    console.error("Companion AI Chat Error:", error);
    return "I am currently unable to process your request. Please visit https://t.me/Savvy_Society for official updates.";
  }
};
