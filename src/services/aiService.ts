import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateLyricsTimings(title: string, lyrics: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um assistente especializado em sincronização de letras de músicas para projeção em igrejas.
      Analise a letra da música "${title}" e estime o tempo de início (em segundos) para cada frase.
      
      Regras CRÍTICAS:
      1. Retorne a letra EXATAMENTE como fornecida, mas adicione o tempo no início de cada linha no formato [segundos].
      2. O primeiro slide (título) deve começar em [0].
      3. Estime intervalos realistas baseados no ritmo natural da música (geralmente entre 4 a 10 segundos por linha).
      4. Se houver um "Coro" ou "Refrão", mantenha o texto e adicione o tempo correspondente à sua posição na música.
      5. Não pule nenhuma linha. Não adicione comentários.
      6. Retorne APENAS o texto formatado.
      
      Exemplo de formato:
      [0] Título da Música
      [5] Primeira frase da música
      [12] Segunda frase da música
      
      Letra para processar:
      ${lyrics}`,
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
