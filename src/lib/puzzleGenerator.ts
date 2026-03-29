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
      contents: "Hi",
    });
    return 'connected';
  } catch (error) {
    console.error("API Connection Error:", error);
    return 'error';
  }
}

async function fetchDatamuseContext(theme: string, difficulty: string): Promise<string> {
  try {
    let query = theme && theme.trim() !== '' ? theme : 'trivia';
    if (query.includes('Daily Challenge')) {
      query = 'general knowledge';
    } else if (query === 'Random Trivia') {
      const randomTopics = ['science', 'history', 'geography', 'animals', 'space', 'music', 'art'];
      query = randomTopics[Math.floor(Math.random() * randomTopics.length)];
    }

    const response = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(query)}&md=d,s&max=100`);
    if (!response.ok) return "";
    
    const data = await response.json();
    
    const validWords = data.filter((w: any) => 
      w.defs && 
      w.defs.length > 0 && 
      /^[a-zA-Z]+$/.test(w.word) // Only alphabetical words
    );
    
    const selected = validWords.slice(0, 20);
    if (selected.length === 0) return "";
    
    let context = "\nDATAMUSE API WORD SUGGESTIONS (You are highly encouraged to use these words and definitions for the puzzle):\n";
    selected.forEach((w: any) => {
      const def = w.defs[0].split('\t').pop();
      context += `- Word: ${w.word.toUpperCase()} (Syllables: ${w.numSyllables}) | Definition: ${def}\n`;
    });
    return context;
  } catch (e) {
    console.error("Datamuse fetch error:", e);
    return "";
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
  if (difficulty === 'Easy') difficultyPrompt = "Use simpler words. Exactly 4 clues total. Number of syllables per clue random.";
  else if (difficulty === 'Hard') difficultyPrompt = "Use complex words. Exactly 9 clues total. Number of syllables per clue random. Include challenging vocabulary.";
  else difficultyPrompt = "Use standard words. Exactly 6 clues total. Number of syllables per clue random.";

  const datamuseContext = await fetchDatamuseContext(theme, difficulty);

  const prompt = `Create a Syllacrostic puzzle.
  Theme: ${theme}
  ${hiddenMessage ? `Hidden Message: ${hiddenMessage.toUpperCase()}` : `Hidden Message: Choose a random 1-2 word phrase (5-8 letters total).`}
  Difficulty: ${difficulty} - ${difficultyPrompt}
  ${instructions ? `Additional Instructions:\n${instructions}` : ''}
  ${datamuseContext}

  CRITICAL RULES FOR CLUES AND ANSWERS:
  1. For each clue, you MUST provide the 'text' (the hint) and the 'answer' (the full word).
  2. The 'answer' MUST perfectly match the 'text' clue. They must be highly relevant to each other.
  3. The 'syllables' array MUST contain the 'answer' split into valid syllables (uppercase). When combined, the syllables must exactly equal the 'answer'.
  4. Ensure syllables are logically split (e.g., WA-TER, COM-PU-TER). If using a word from the Datamuse suggestions, ensure the number of syllables matches the Datamuse count.
  
  RULES FOR THE HIDDEN MESSAGE:
  5. The hidden message is revealed by taking the FIRST LETTER of specific syllables in order.
  6. Assign a \`messageIndex\` (starting from 1) to the syllables whose first letter matches the hidden message characters (ignoring spaces).
  7. Every non-space letter in the hidden message MUST have exactly one corresponding syllable with that \`messageIndex\`.
  8. The total number of \`messageIndex\` properties MUST exactly equal the number of non-space characters in the hidden message.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
                answer: { type: Type.STRING },
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
              required: ["id", "text", "answer", "syllables"]
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
