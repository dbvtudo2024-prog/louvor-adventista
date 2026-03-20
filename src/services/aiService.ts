import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (aiInstance) return aiInstance;
  
  let apiKey: string | undefined;
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = (process.env as any).GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn('Erro ao acessar process.env:', e);
  }
  
  if (!apiKey) {
    apiKey = (import.meta as any).env?.GEMINI_API_KEY;
  }
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

export async function generateLyricsTimings(title: string, lyrics: string): Promise<string> {
  try {
    const ai = getAI();
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
      
      Letra para processar (remova tempos existentes se houver):
      ${lyrics.replace(/\[T:\d+(?:[.,]\d+)?\]\n?/, '').replace(/\[\d+(?:[.,]\d+)?\]\s*/g, '')}`,
      config: {
        temperature: 0.1,
      },
    });

    return response.text || lyrics;
  } catch (error) {
    console.error("Erro ao gerar tempos com IA:", error);
    throw error;
  }
}
