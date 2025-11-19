import { GoogleGenAI, Chat } from "@google/genai";
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

  // Inject user preferences into the system instruction dynamically
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
      temperature: 0.7, // Balance creativity and accuracy
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

export const updateSessionContext = (prefs: UserPreferences) => {
  // Since the API is stateless regarding system prompt updates in a live chat (usually),
  // we just restart the session or send a stealth system message.
  // For this demo, we will restart the session to ensure clean context switching.
  return startChatSession(prefs);
};
