import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { PuzzleDef } from '../data';

const getWordInfoDeclaration: FunctionDeclaration = {
  name: "getWordInfo",
  description: "Get the official syllables and definition of a word from WordsAPI.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING, description: "The word to look up" }
    },
    required: ["word"]
  }
};

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

export async function generatePuzzle(
  theme: string, 
  hiddenMessage: string, 
  instructions: string, 
  difficulty: string
): Promise<PuzzleDef> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  let difficultyPrompt = "";
  if (difficulty === 'Easy') difficultyPrompt = "Use simpler, shorter words (1-3 syllables). 5-6 clues total.";
  else if (difficulty === 'Hard') difficultyPrompt = "Use complex, longer words (3-5 syllables). 7-9 clues total. Include challenging vocabulary.";
  else difficultyPrompt = "Use standard words (2-4 syllables). 6-8 clues total.";

  const prompt = `Create a Syllacrostic puzzle.
  Theme: ${theme}
  ${hiddenMessage ? `Hidden Message: ${hiddenMessage.toUpperCase()}` : `Hidden Message: Choose a random 1-2 word phrase (5-8 letters total).`}
  Difficulty: ${difficulty} - ${difficultyPrompt}
  ${instructions ? `Additional Instructions:\n${instructions}` : ''}

  CRITICAL INSTRUCTION:
  You MUST use the \`getWordInfo\` tool to look up EVERY word you intend to use in the puzzle BEFORE returning the final JSON. 
  You must use the exact syllables and definition returned by the tool. 
  If the tool returns an error or "Definition not found", you must choose a different word and look it up.
  Do NOT return the final puzzle JSON until you have successfully looked up all words using the tool.

  CRITICAL RULES FOR CLUES AND ANSWERS:
  1. For each clue, you MUST provide the 'text' (the hint) and the 'answer' (the full word).
  2. The 'text' MUST be the definition returned by the \`getWordInfo\` tool.
  3. The 'syllables' array MUST contain the syllables exactly as returned by the \`getWordInfo\` tool (converted to uppercase).
  
  RULES FOR THE HIDDEN MESSAGE:
  4. The hidden message is revealed by taking the FIRST LETTER of specific syllables in order.
  5. Assign a \`messageIndex\` (starting from 1) to the syllables whose first letter matches the hidden message characters (ignoring spaces).
  6. Every non-space letter in the hidden message MUST have exactly one corresponding syllable with that \`messageIndex\`.
  7. The total number of \`messageIndex\` properties MUST exactly equal the number of non-space characters in the hidden message.`;

  const config = {
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
    },
    tools: [{ functionDeclarations: [getWordInfoDeclaration] }]
  };

  let contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];

  let response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: config
  });

  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops

  while (response.functionCalls && response.functionCalls.length > 0 && iterations < maxIterations) {
    iterations++;
    contents.push(response.candidates?.[0]?.content);
    
    const functionResponses: any[] = [];
    
    for (const call of response.functionCalls) {
      if (call.name === "getWordInfo") {
        const word = (call.args as any).word;
        try {
          const res = await fetch(`/api/words/${word}`);
          if (res.ok) {
            const data = await res.json();
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: {
                syllables: data.syllables?.list || [word],
                definition: data.results?.[0]?.definition || "Definition not found"
              }
            });
          } else {
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { error: "Word not found in API" }
            });
          }
        } catch (e) {
          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { error: "API connection error" }
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: functionResponses.map(fr => ({
        functionResponse: {
          id: fr.id,
          name: fr.name,
          response: fr.response
        }
      }))
    });

    response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: config
    });
  }

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as PuzzleDef;
}
