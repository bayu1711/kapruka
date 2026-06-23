import { GoogleGenAI, Type } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export interface AgentResult {
  searchQuery: string;
  suggestedCategories: string[];
  aiStatusMessage: string;
}

export async function parseUserQuery(userMessage: string): Promise<AgentResult> {
  if (!ai) {
    console.warn('Gemini API key not found. Falling back to dumb search.');
    return {
      searchQuery: userMessage,
      suggestedCategories: [],
      aiStatusMessage: 'Searching Kapruka...',
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: `You are the Kapruka AI Shopping Assistant. The user wants to find products on Kapruka (Sri Lanka's largest e-commerce platform). 
Extract the best search query to find the actual item they want to buy. 
Also suggest 4 to 6 relevant Kapruka categories (e.g., Cakes, Flowers, GreetingCards, Bicycle, Electronics, Clothing, Giftset, Sweets, etc.) that match their occasion or context.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            searchQuery: { 
              type: Type.STRING, 
              description: 'The core product keyword to search for (e.g. "bicycle", "chocolate cake", "roses")' 
            },
            suggestedCategories: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: '4 to 6 relevant category names for the tree UI' 
            },
            aiStatusMessage: { 
              type: Type.STRING, 
              description: 'A short friendly status message for the UI (max 1 sentence), e.g. "Looking for bicycles and birthday gifts..."' 
            }
          },
          required: ['searchQuery', 'suggestedCategories', 'aiStatusMessage']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');
    return JSON.parse(text) as AgentResult;
  } catch (err) {
    console.error('Gemini processing failed:', err);
    // Fallback if AI fails
    return {
      searchQuery: userMessage,
      suggestedCategories: [],
      aiStatusMessage: 'Searching Kapruka...',
    };
  }
}
