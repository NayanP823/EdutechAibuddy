
import { GoogleGenAI, Chat, Modality } from "@google/genai";
import { GOOGLE_AI_STUDIO_PROMPT } from "../constants";
import { UserPreferences } from "../types";

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

export const initializeGemini = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing in environment variables.");
    return;
  }
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const startChatSession = (prefs: UserPreferences) => {
  if (!ai) initializeGemini();
  if (!ai) throw new Error("Failed to initialize AI");

  const personalizedSystemPrompt = `
${GOOGLE_AI_STUDIO_PROMPT}

CURRENT STUDENT PROFILE:
- Age Group: ${prefs.ageGroup}
- Language: ${prefs.language}
- Interest: ${prefs.subjectInterest || 'General'}

Adjust all responses to match this profile specifically.
`;

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: personalizedSystemPrompt,
      temperature: 0.7,
    },
  });

  return chatSession;
};

export const sendMessageStream = async function* (message: string) {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const result = await chatSession.sendMessageStream({ message });
    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error sending message:", error);
    yield "Sorry, I'm having trouble connecting right now. Please try again.";
  }
};

export const generateSpeech = async (text: string, audioCtx: AudioContext): Promise<AudioBuffer | null> => {
  const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await localAi.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this clearly for a student: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioData = decodeBase64(base64Audio);
    return await decodeAudioData(audioData, audioCtx, 24000, 1);
  } catch (error) {
    console.error("Speech generation error:", error);
    return null;
  }
};

// Audio Helpers
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
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

export const updateSessionContext = (prefs: UserPreferences) => {
  return startChatSession(prefs);
};
