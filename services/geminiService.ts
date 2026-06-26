
import { Language } from "../types";

const getErrorMessage = async (res: Response, defaultMsg: string): Promise<string> => {
  try {
    const data = await res.json();
    return data.error || defaultMsg;
  } catch {
    return defaultMsg;
  }
};

export const getGeminiMarketingResponse = async (userPrompt: string, language: Language) => {
  try {
    const res = await fetch("/api/gemini/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt, language }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Gemini Marketing Error:", err);
    return { text: `Service Error: ${err.message}.`, grounding: [] };
  }
};

export const generateKeywordSuggestions = async (product: string, specs: string, language: Language) => {
  try {
    const res = await fetch("/api/gemini/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, specs, language }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.text;
  } catch (err: any) {
    return `Error generating keyword intelligence: ${err.message}`;
  }
};

export const generateSolutionCopy = async (software: string, hardware: string, connectivity: string, language: Language) => {
  try {
    const res = await fetch("/api/gemini/solution-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ software, hardware, connectivity, language }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.text;
  } catch (err: any) {
    return `Error generating marketing copy: ${err.message}`;
  }
};

export const getGeminiBasicTask = async (systemInstruction: string, userPrompt: string, language: Language, isPro: boolean = false) => {
  try {
    const res = await fetch("/api/gemini/basic-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction, userPrompt, language, isPro }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.text;
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
};

export const generateMotTable = async (product: string, target: string, pain: string, language: Language) => {
  try {
    const res = await fetch("/api/gemini/mot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, target, pain, language }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.text;
  } catch (err: any) {
    return `Error generating MOT table: ${err.message}`;
  }
};

export type AdFormat = 'RSA' | 'PMax' | 'Display' | 'DemandGen';

export const generateGoogleAds = async (
  product: string, 
  specs: string, 
  valueProp: string, 
  keywords: string,
  format: AdFormat, 
  language: Language
) => {
  try {
    const res = await fetch("/api/gemini/google-ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, specs, valueProp, keywords, format, language }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.text;
  } catch (err: any) {
    console.error("Ads Generation Failed:", err);
    throw new Error(`Ads Generation Failed: ${err.message}`);
  }
};

export const analyzeDocumentLayout = async (base64Image: string, language: Language) => {
  try {
    const res = await fetch("/api/gemini/analyze-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, language }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (err: any) {
    console.error("Layout analysis failed", err);
    return [];
  }
};

export const removeTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    const res = await fetch("/api/gemini/remove-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.image;
  } catch (err: any) {
    return base64Image; 
  }
};

export const generateSvgFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const res = await fetch("/api/gemini/generate-svg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const errMsg = await getErrorMessage(res, "Server error");
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.svg;
  } catch (err: any) {
    console.error("SVG generation failed", err);
    throw new Error(`Failed to generate SVG: ${err.message}`);
  }
};
