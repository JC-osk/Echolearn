import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FlashCard } from "../types";
import { INITIAL_PROMPT } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // API Key must be set in the environment
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeAudio(file: File): Promise<AnalysisResult> {
    try {
      // Convert file to base64
      const base64Data = await this.fileToBase64(file);
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data
              }
            },
            {
              text: INITIAL_PROMPT
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              language: { type: Type.STRING },
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    start: { type: Type.NUMBER },
                    end: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    translation: { type: Type.STRING }
                  },
                  required: ["id", "start", "end", "text", "translation"]
                }
              }
            },
            required: ["language", "segments"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      
      const result = JSON.parse(text) as AnalysisResult;

      // Sanitize segments: Ensure timestamps are numbers and IDs are sequential
      const sanitizedSegments = result.segments.map((seg, index) => ({
        ...seg,
        id: index + 1,
        start: this.parseTimestamp(seg.start),
        end: this.parseTimestamp(seg.end)
      }));

      // Ensure they are sorted by time
      sanitizedSegments.sort((a, b) => a.start - b.start);

      return {
        ...result,
        segments: sanitizedSegments
      };

    } catch (error) {
      console.error("Error analyzing audio:", error);
      throw error;
    }
  }

  async getWordDefinition(word: string, context: string): Promise<Pick<FlashCard, 'definition_cn' | 'ipa'>> {
    const prompt = `
      You are a language tutor. 
      Word: "${word}"
      Context sentence: "${context}"
      
      Please provide:
      1. A brief Chinese definition of the word relevant to this specific context.
      2. The IPA phonetic transcription.
      
      Do NOT provide examples, I will use the context sentence as the example.

      Return JSON.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              definition_cn: { type: Type.STRING },
              ipa: { type: Type.STRING }
            },
            required: ["definition_cn", "ipa"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini for definition");
      return JSON.parse(text);
    } catch (error) {
      console.error("Error getting definition:", error);
      throw error;
    }
  }

  private parseTimestamp(val: any): number {
    if (typeof val === 'number') {
      return isFinite(val) ? val : 0;
    }
    if (typeof val === 'string') {
      if (val.includes(':')) {
         const parts = val.split(':').map(p => parseFloat(p));
         if (parts.some(isNaN)) return 0;
         if (parts.length === 2) return parts[0] * 60 + parts[1];
         if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      const parsed = parseFloat(val);
      return isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}

export const geminiService = new GeminiService();
