import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (aiInstance) return aiInstance;
  
  let apiKey: string | undefined;
  
  // Try to get from process.env (Vite define or Node environment)
  try {
    apiKey = (process.env as any).GEMINI_API_KEY;
  } catch (e) {}

  if (!apiKey) {
    apiKey = (import.meta as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  }
  
  if (!apiKey) {
    // Fallback for some environments
    apiKey = (globalThis as any).GEMINI_API_KEY;
  }
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in any environment source.");
    throw new Error("Chave de API GEMINI_API_KEY não encontrada. Verifique as configurações do ambiente.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

export function isAIConfigured(): boolean {
  try {
    let apiKey: string | undefined;
    try {
      apiKey = (process.env as any).GEMINI_API_KEY;
    } catch (e) {}
    if (!apiKey) {
      apiKey = (import.meta as any).env?.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    }
    if (!apiKey) {
      apiKey = (globalThis as any).GEMINI_API_KEY;
    }
    return !!apiKey && apiKey !== "";
  } catch {
    return false;
  }
}

export async function generateLyricsTimings(title: string, lyrics: string): Promise<string> {
  try {
    const ai = getAI();
    
    // Clean lyrics for processing
    const cleanLyrics = lyrics
      .replace(/\[T:\d+(?:[.,]\d+)?\]\n?/, '')
      .replace(/\[\d+(?:[.,]\d+)?\]\s*/g, '')
      .trim();

    if (!cleanLyrics) {
      throw new Error("A letra da música está vazia ou contém apenas tempos.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um assistente especializado em sincronização de letras para projeção de hinos e louvores.
      Sua tarefa é analisar a letra da música "${title}" e definir a DURAÇÃO (em segundos) que cada slide deve permanecer na tela.
      
      Regras CRÍTICAS de Sincronização:
      1. O formato deve ser:
         [T:tempo_introducao] Título
         [duracao_slide1] Texto do Slide 1
         [duracao_slide2] Texto do Slide 2
      2. O valor entre colchetes é a DURAÇÃO (quanto tempo o slide fica visível), NÃO o tempo de início.
      3. Estime a introdução instrumental [T:...] (geralmente entre 5 a 15 segundos).
      4. Estime durações realistas para cada frase (geralmente entre 4 a 8 segundos).
      5. Adicione 1 ou 2 segundos extras na última linha de cada estrofe para a transição musical.
      6. Retorne APENAS o texto formatado, sem comentários ou explicações.
      7. Use PONTO como separador decimal (ex: 5.5).
      
      Exemplo de retorno esperado:
      [T:8] Título do Hino
      [5.5] Primeira frase da música
      [6.0] Segunda frase da música
      [7.5] Última frase da estrofe (com pausa)
      
      Letra para processar:
      ${cleanLyrics}`,
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      console.warn("AI returned empty text, falling back to original lyrics.");
      return lyrics;
    }

    return resultText;
  } catch (error: any) {
    console.error("Erro ao gerar tempos com IA:", error);
    
    // Extract the most meaningful error message
    let message = "Erro desconhecido na API Gemini";
    
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else if (error && typeof error === 'object') {
      message = error.message || JSON.stringify(error);
    }

    if (message.includes("API_KEY_INVALID")) {
      throw new Error("Chave de API inválida. Verifique se a GEMINI_API_KEY está correta.");
    }
    if (message.toLowerCase().includes("quota")) {
      throw new Error("Limite de cota da API Gemini excedido. Tente novamente mais tarde.");
    }
    if (message.toLowerCase().includes("max tokens") || message.toLowerCase().includes("finish_reason: length")) {
      throw new Error("A letra da música é muito longa para ser processada pela IA de uma só vez. Tente dividir a música ou simplificar a letra.");
    }
    
    throw new Error(message);
  }
}
