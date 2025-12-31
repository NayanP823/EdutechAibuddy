
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

  // Force the persona based on the preference
  const personalizedSystemPrompt = `
${GOOGLE_AI_STUDIO_PROMPT}

ACTIVATE THIS MODE NOW:
- CURRENT STUDENT: ${prefs.ageGroup}
- PREFERRED LANGUAGE: ${prefs.language}

Note: If they are in Elementary mode, be MAXIMUM QUIRKY and CHILDISH. Use sound effects in text like *Bloop!* or *Whoosh!*.
`;

  chatSession = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: personalizedSystemPrompt,
      temperature: 0.9, // Increased for more creative/quirky personality
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
    yield "Oopsie-woopsie! 🙈 My brain had a little hiccup. Can you say that again? 🌈";
  }
};

export const generateSpeech = async (text: string, audioCtx: AudioContext): Promise<AudioBuffer | null> => {
  const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Instruction to TTS to be expressive
    const speechPrompt = `Read this in an extremely fun, animated, and expressive voice for a child, following any sound effects or emotions in the text: ${text}`;
    
    const response = await localAi.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: speechPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is often more energetic/quirky than Kore
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
