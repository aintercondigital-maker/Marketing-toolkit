
import { getGeminiBasicTask } from "./geminiService";
import { Language } from "../types";

/**
 * @deprecated Use getGeminiMarketingResponse from geminiService.ts
 * Azure OpenAI logic removed to strictly follow Google GenAI SDK requirements.
 */
export const getStrategyResponse = async (userPrompt: string, kbContext: string, config: any, language: Language) => {
  const systemInstruction = `You are an Advantech Strategic Consultant.
  
  IMPORTANT: Use the following Strategic Knowledge Context to answer. If the answer is found in the context, cite the source.
  
  Strategic Knowledge Context:
  ${kbContext}`;

  try {
    const text = await getGeminiBasicTask(systemInstruction, userPrompt, language, true);
    return {
      text: text || "",
      grounding: []
    };
  } catch (err: any) {
    return {
      text: `Error: ${err.message}`,
      grounding: []
    };
  }
};

/**
 * @deprecated Use getGeminiBasicTask from geminiService.ts
 */
export const getBasicTask = async (systemInstruction: string, userPrompt: string, config: any, language: Language) => {
  return await getGeminiBasicTask(systemInstruction, userPrompt, language);
};
