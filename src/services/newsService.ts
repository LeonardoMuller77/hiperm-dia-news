import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing. News fetching will fail. Please ensure the API key is set in your environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  imageUrl: string;
  source: string;
  fullContent?: string;
  bullets?: string[];
}

export async function fetchNews(category: string = "General"): Promise<NewsItem[]> {
  if (!apiKey) {
    console.error("Cannot fetch news: GEMINI_API_KEY is not defined.");
    return [];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 recent news items for the category: ${category}. 
      Return them as a JSON array of objects with the following structure:
      {
        "id": "unique-id",
        "title": "Short catchy title",
        "summary": "A 2-sentence summary",
        "category": "${category}",
        "timestamp": "2 hours ago",
        "imageUrl": "https://picsum.photos/seed/[id]/800/400",
        "source": "News Source Name",
        "fullContent": "A longer description of the news",
        "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              source: { type: Type.STRING },
              fullContent: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["id", "title", "summary", "category", "timestamp", "imageUrl", "source", "fullContent", "bullets"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.error("Empty response from Gemini API");
      return [];
    }
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error fetching news from Gemini:", error);
    if (error.message?.includes("API key not valid")) {
      console.error("The provided Gemini API key is invalid.");
    }
    return [];
  }
}
