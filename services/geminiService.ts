
// Use correct import according to Google GenAI SDK guidelines
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  // GoogleGenAI instances are created inside methods to ensure they use the 
  // most up-to-date API key from the selection dialog if applicable,
  // following the rule: "Create a new GoogleGenAI instance right before making an API call."

  // Generates descriptive analysis from admission data context
  async generateAnalysis(query: string, history: { role: 'user' | 'model', text: string }[] = []) {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: query }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });
      // Directly access the .text property as per guidelines (it's not a function)
      return response.text || "No analysis available.";
    } catch (error) {
      console.error("Analysis Error:", error);
      return "An error occurred during data synthesis.";
    }
  }

  // Generates high-fidelity research visualizations
  async generateVisualization(prompt: string, aspectRatio: string, imageSize: string) {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `High-fidelity academic research visualization: ${prompt}. Minimalist, dark theme, crisp data points, no people, professional white lines on dark background.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any
          }
        }
      });

      // Find the image part in the response candidates as per guidelines
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            // Correct way to extract base64 image data from inlineData
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Image Gen Error:", error);
      throw error;
    }
  }
}
