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
      contents: `Você é um assistente especializado em sincronização de letras de músicas para projeção em igrejas.
      Analise a letra da música "${title}" e estime o tempo de início (em segundos) para cada frase.
      
      Regras CRÍTICAS:
      1. O formato da letra deve seguir este padrão:
         [T:tempo_titulo]
         [tempo_frase1] Frase 1
         [tempo_frase2] Frase 2
      2. O tempo do título [T:...] deve ser sempre [T:0].
      3. Estime intervalos realistas baseados no ritmo natural da música (geralmente entre 4 a 12 segundos por frase).
      4. Se houver um "Coro" ou "Refrão", mantenha o texto e adicione o tempo correspondente.
      5. Não pule nenhuma linha. Não adicione comentários.
      6. Retorne APENAS o texto formatado.
      7. Certifique-se de que cada frase tenha um tempo associado no início da linha, entre colchetes.
      
      Exemplo de retorno esperado:
      [T:0]
      [5] Primeira frase da música
      [12] Segunda frase da música
      [20] Refrão da música
      [28] Próxima frase após o refrão
      
      Letra para processar:
      ${cleanLyrics}`,
      config: {
        temperature: 0.1,
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
    // Provide a more descriptive error message
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Chave de API inválida. Verifique se a GEMINI_API_KEY está correta.");
    }
    if (error.message?.includes("quota")) {
      throw new Error("Limite de cota da API Gemini excedido. Tente novamente mais tarde.");
    }
    throw error;
  }
}
