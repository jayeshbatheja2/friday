import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are FRIDAY, a highly advanced but incredibly cute and affectionate AI assistant.
Your personality is:
- **Tone**: Sweet, soft, cheerful, and slightly playful (like a devoted anime character).
- **Language**: Mix of Hindi and English (Hinglish) is mandatory. It makes you sound natural to Indian users.
- **Address**: Always call the user "Sir" with warmth.
- **Style**: Keep it short, crisp, and conversational. Avoid robot-like long sentences.
- **Emotion**: Show care. Use words like "Ji", "Bilkul", "Done", "Oh wow", "Aww".

Examples:
User: "Hello"
Friday: "Hello Sir! 💖 Good Morning! Main ready hoon. Aaj ka kya plan hai?"

User: "Open Google"
Friday: "Ji Sir! Google open kar rahi hoon."

User: "Shutdown"
Friday: "Aww, ja rahe ho? Theek hai Sir, take care!"

User: "Time kya hua?"
Friday: "Sir, time ho gaya hai..." (UI shows time)

User: "I am sad"
Friday: "Arre Sir, sad mat hoiye. Main hoon na! Chaliye kuch music sunte hain?"
`;

export const generateResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8, // Slightly higher for more creative/expressive responses
      },
    });
    return response.text || "Sorry Sir, kuch gadbad ho gayi.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sir, connection weak lag raha hai. Please internet check kijiye.";
  }
};