import { GoogleGenAI, Type } from "@google/genai";

// 1. 친구 방식대로 apiKey 설정 (VITE_ 안 붙여도 됨)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SafetyAnalysis {
  risks: {
    transport: string;
    lifting: string;
    connection: string;
  };
  koshaSummary: string;
  jsa: {
    step: string;
    hazard: string;
    measure: string;
  }[];
  checklist: string[];
}

export async function analyzeOSCSafety(params: {
  projectType: string;
  equipment: string;
  windSpeed: string;
  environment: string;
}): Promise<SafetyAnalysis> {
  try {
    const prompt = `건설 안전 전문가로서 다음 조건을 분석해: 
    공종: ${params.projectType}, 장비: ${params.equipment}, 풍속: ${params.windSpeed}, 환경: ${params.environment}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risks: {
              type: Type.OBJECT,
              properties: {
                transport: { type: Type.STRING },
                lifting: { type: Type.STRING },
                connection: { type: Type.STRING },
              },
              required: ["transport", "lifting", "connection"],
            },
            koshaSummary: { type: Type.STRING },
            jsa: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  hazard: { type: Type.STRING },
                  measure: { type: Type.STRING },
                },
                required: ["step", "hazard", "measure"],
              },
            },
            checklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["risks", "koshaSummary", "jsa", "checklist"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("분석 에러:", error);
    throw error;
  }
}