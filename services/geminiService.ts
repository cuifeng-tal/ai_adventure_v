
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to decode Base64
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Audio context and decoding helpers
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateGameContent = async (prompt: string, schema: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  return JSON.parse(response.text);
};

export const generateCartoonImage = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    //model: 'gemini-3-pro-image',
    contents: {
      parts: [{ text: `${prompt}. Cartoon style, bright colors, cute, Pixar-like, high saturation, simple lines, imaginative.` }],
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return "https://picsum.photos/800/450";
};

/**
 * Generates speech with a retry mechanism for 429 errors.
 */
export const generateSpeech = async (text: string, retryCount = 0): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      //model: "gemini-2.5-flash-preview-tts",
      model: "gemini-2.5-pro-tts",
      contents: [{ parts: [{ text: `用亲切活泼的探险家语气朗读以下剧情：${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error: any) {
    // If it's a quota error, wait and retry once
    if (error?.message?.includes('429') && retryCount < 1) {
      console.warn("Speech quota exceeded, retrying in 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateSpeech(text, retryCount + 1);
    }
    console.error("Speech generation failed:", error);
    return undefined;
  }
};

export const level1Schema = {
  type: Type.OBJECT,
  properties: {
    story: { type: Type.STRING, description: "融入用户问题的冒险故事情节" },
    question: { type: Type.STRING, description: "修改后的数学问题描述" },
    answer: { type: Type.STRING, description: "正确答案" }
  },
  required: ["story", "question", "answer"]
};

export const level2Schema = {
  type: Type.OBJECT,
  properties: {
    story: { type: Type.STRING, description: "更紧张的冒险场景" },
    question: { type: Type.STRING, description: "基于第一关知识点和难度的进阶数学题" },
    answer: { type: Type.STRING, description: "正确答案" }
  },
  required: ["story", "question", "answer"]
};

export const certificateSchema = {
  type: Type.OBJECT,
  properties: {
    mastery: { type: Type.NUMBER, description: "知识掌握度 0-100" },
    logic: { type: Type.NUMBER, description: "逻辑推演能力 0-100" },
    advice: { type: Type.STRING, description: "给老师或家长的教育建议" }
  },
  required: ["mastery", "logic", "advice"]
};
