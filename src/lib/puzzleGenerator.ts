import { GoogleGenAI, Type } from '@google/genai';
import { PuzzleDef } from '../data';

export async function checkApiConnection(): Promise<'connected' | 'error' | 'missing_key'> {
  if (!process.env.GEMINI_API_KEY) {
    return 'missing_key';
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // A very lightweight call to verify the key is valid and network is up
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
      config: { maxOutputTokens: 1 }
    });
    return 'connected';
  } catch (error) {
    console.error("API Connection Error:", error);
    return 'error';
  }
}

export async function generatePuzzle(
  theme: string, 
  hiddenMessage: string, 
  instructions: string, 
  difficulty: string
): Promise<PuzzleDef> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  let difficultyPrompt = "";
  if (difficulty === 'Easy') difficultyPrompt = "Use simpler, shorter words (1-3 syllables). 4-5 clues total.";
  else if (difficulty === 'Hard') difficultyPrompt = "Use complex, longer words (3-5 syllables). 7-9 clues total. Include challenging vocabulary.";
  else difficultyPrompt = "Use standard words (2-4 syllables). 5-7 clues total.";

  const prompt = `Create a Syllacrostic puzzle.
  Theme: ${theme}
  ${hiddenMessage ? `Hidden Message: ${hiddenMessage.toUpperCase()}` : `Hidden Message: Choose a random inspirational 2-3 word phrase (10-15 letters total).`}
  Difficulty: ${difficulty} - ${difficultyPrompt}
  ${instructions ? `Additional Instructions:\n${instructions}` : ''}

  Rules:
  1. The answers MUST be split into valid syllables (uppercase).
  2. The hidden message is revealed by taking the FIRST LETTER of specific syllables in order.
  3. Assign a \`messageIndex\` (starting from 1) to the syllables whose first letter matches the hidden message characters (ignoring spaces).
  4. Every non-space letter in the hidden message MUST have exactly one corresponding syllable with that \`messageIndex\`.
  5. The total number of \`messageIndex\` properties MUST exactly equal the number of non-space characters in the hidden message.
  6. Ensure syllables are logically split (e.g., WA-TER, COM-PU-TER).`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          theme: { type: Type.STRING },
          hiddenMessage: { type: Type.STRING },
          clues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                text: { type: Type.STRING },
                syllables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      messageIndex: { type: Type.NUMBER }
                    },
                    required: ["id", "text"]
                  }
                }
              },
              required: ["id", "text", "syllables"]
            }
          }
        },
        required: ["id", "theme", "hiddenMessage", "clues"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as PuzzleDef;
}
