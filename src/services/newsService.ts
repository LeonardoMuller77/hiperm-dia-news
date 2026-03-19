import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  imageUrl: string;
  source: string;
  url: string;
  fullContent?: string;
  bullets?: string[];
}

const FALLBACK_NEWS: Record<string, NewsItem[]> = {
  "Geral": [
    {
      id: "fallback-1",
      title: "Exploração Espacial: Nova Missão Rumo a Marte",
      summary: "Agências espaciais anunciam colaboração sem precedentes para estabelecer base sustentável no planeta vermelho até 2030.",
      category: "Geral",
      timestamp: "Agora",
      imageUrl: "https://picsum.photos/seed/mars/800/400",
      source: "Agência Brasil",
      url: "https://agenciabrasil.ebc.com.br/",
      fullContent: "A exploração de Marte deu um salto gigante hoje com o anúncio de uma coalizão global. O objetivo é enviar a primeira tripulação humana para uma estadia de longa duração, focando em pesquisa geológica e busca por sinais de vida passada.",
      bullets: ["Colaboração internacional", "Lançamento previsto para 2028", "Foco em sustentabilidade"]
    },
    {
      id: "fallback-2",
      title: "Economia Global: Tendências para o Próximo Trimestre",
      summary: "Analistas preveem estabilização dos mercados após período de volatilidade, com foco em energias renováveis.",
      category: "Geral",
      timestamp: "1h atrás",
      imageUrl: "https://picsum.photos/seed/economy/800/400",
      source: "BBC News Brasil",
      url: "https://www.bbc.com/portuguese",
      fullContent: "O cenário econômico mundial mostra sinais de resiliência. Investimentos em infraestrutura verde estão liderando a recuperação, atraindo capital de grandes fundos de pensão e investidores institucionais.",
      bullets: ["Crescimento do PIB estável", "Inflação sob controle", "Aposta em ESG"]
    }
  ],
  "Tecnologia": [
    {
      id: "fallback-tech-1",
      title: "IA Generativa: O Futuro do Trabalho Criativo",
      summary: "Novas ferramentas de inteligência artificial estão transformando como designers e escritores produzem conteúdo de alta qualidade.",
      category: "Tecnologia",
      timestamp: "30 min atrás",
      imageUrl: "https://picsum.photos/seed/tech/800/400",
      source: "G1 Tecnologia",
      url: "https://g1.globo.com/tecnologia/",
      fullContent: "A inteligência artificial não está apenas automatizando tarefas, mas expandindo as fronteiras da criatividade humana. Profissionais que adotam essas ferramentas estão vendo ganhos significativos de produtividade.",
      bullets: ["Aumento de 40% na produtividade", "Novas carreiras surgindo", "Ética na IA em debate"]
    }
  ]
};

const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour
const QUOTA_COOLDOWN = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: NewsItem[];
  timestamp: number;
}

export async function fetchNews(category: string = "Geral"): Promise<NewsItem[]> {
  const cacheKey = `news_cache_${category}`;
  const quotaKey = `gemini_quota_exceeded`;
  
  // 1. Check if we are in a quota cooldown period
  const quotaExceededTime = localStorage.getItem(quotaKey);
  if (quotaExceededTime) {
    const timeSinceExceeded = Date.now() - parseInt(quotaExceededTime);
    if (timeSinceExceeded < QUOTA_COOLDOWN) {
      console.warn("Gemini API in cooldown due to previous quota error. Using cache/fallback.");
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached).data;
      return FALLBACK_NEWS[category] || FALLBACK_NEWS["Geral"];
    } else {
      localStorage.removeItem(quotaKey);
    }
  }

  // 2. Try to get from local storage cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const entry: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - entry.timestamp > CACHE_EXPIRY;
      
      if (!isExpired) {
        return entry.data;
      }
      // If expired, we'll try to fetch new data, but keep the old one as backup
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere 5 notícias recentes para a categoria: ${category}. 
      IMPORTANTE: Utilize apenas fontes de acesso livre e aberto (Open Access), como Agência Brasil, BBC News Brasil, G1, CNN Brasil, ou portais governamentais e de agências de notícias que permitam a livre circulação de informações sem paywalls ou restrições de propriedade estritas.
      
      Retorne as notícias como um array JSON de objetos com a seguinte estrutura:
      {
        "id": "id-unico",
        "title": "Título curto e chamativo",
        "summary": "Um resumo de 2 frases",
        "category": "${category}",
        "timestamp": "há 2 horas",
        "imageUrl": "https://picsum.photos/seed/[id]/800/400",
        "source": "Nome da Fonte de Notícia Livre",
        "url": "https://exemplo.com/artigo-da-noticia",
        "fullContent": "Uma descrição mais longa da notícia",
        "bullets": ["Ponto principal 1", "Ponto principal 2", "Ponto principal 3"]
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
              url: { type: Type.STRING },
              fullContent: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["id", "title", "summary", "category", "timestamp", "imageUrl", "source", "url", "fullContent", "bullets"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const news = JSON.parse(text);
    
    // Cache the successful response with timestamp
    const cacheEntry: CacheEntry = {
      data: news,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    
    return news;
  } catch (error: any) {
    console.error("Error fetching news:", error);
    
    // If it's a quota error (429), set the cooldown flag
    if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      localStorage.setItem(quotaKey, Date.now().toString());
    }

    // Return cached data even if expired if API fails
    if (cached) {
      try {
        return JSON.parse(cached).data;
      } catch (e) {}
    }
    
    // Final fallback to hardcoded data
    return FALLBACK_NEWS[category] || FALLBACK_NEWS["Geral"];
  }
}
