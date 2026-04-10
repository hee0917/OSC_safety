import { GoogleGenAI, Type } from "@google/genai";

// 1. 친구 방식대로 apiKey 설정
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

    // 2. ai.models.generateContent 형식을 유지하면서 SchemaType 대신 'Type' 사용
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT, // SchemaType -> Type 으로 수정
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

    if (!response.text) {
      throw new Error("AI 응답을 생성하지 못했습니다.");
    }

    return JSON.parse(response.text) as SafetyAnalysis;
  } catch (error) {
    console.error("OSC 분석 중 오류 발생:", error);
    throw error;
  }
}