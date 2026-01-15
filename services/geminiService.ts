
import { GoogleGenAI, Type } from "@google/genai";
import { MARKETING_ASSISTANT_PROMPT } from "../constants";
import { Language } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiMarketingResponse = async (userPrompt: string, kbContext: string, language: Language) => {
  const ai = getAI();
  const sanitizedContext = kbContext.trim() || "No internal assets currently loaded.";
  const fullSystemPrompt = `
${MARKETING_ASSISTANT_PROMPT}

### INTERNAL KNOWLEDGE BASE (PRIORITY 1)
--- START OF CONTEXT ---
${sanitizedContext}
--- END OF CONTEXT ---

**CORE RULE:** 
You have access to Google Search. If the internal knowledge base does not contain specific information about a competitor, a new market trend, or a technical standard mentioned by the user, use the 'googleSearch' tool. 
Always prioritize Advantech's internal data. If you use external search, explicitly mention it in your response.
`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: `${fullSystemPrompt}\n\nLanguage: ${language}.`,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    return {
      text: response.text || "No information found.",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (err: any) {
    console.error("Gemini Marketing Error:", err);
    return { text: `Service Error: ${err.message}.`, grounding: [] };
  }
};

export const generateKeywordSuggestions = async (product: string, specs: string, language: Language) => {
  const ai = getAI();
  const systemInstruction = `
你是一位專精於 B2B 工業製造與 IoT 領域的 SEM 搜尋引擎行銷專家。你的任務是根據產品資訊與規格發想一組「高轉換率」的 Google Ads 關鍵字列表。

**思考邏輯 (Thinking Process):**
1. **核心層 (Product Core):** 產品本名與類別。
2. **屬性層 (Attributes/Specs):** 針對專業工程師搜尋的具體規格 (例如: "Isolated", "4kV", "DIN-rail", "ESD Level 4")。
3. **場景/痛點層 (Scenarios/Pain Points):** 解決特定工業環境痛點的詞彙 (例如: "vibration proof", "wide temperature").

**過濾規則:** 嚴格排除 B2C/DIY 流量，僅保留商業、系統整合與工業採購意圖。

**輸出格式要求 (CRITICAL OUTPUT RULES):**
1. **必須以標準 Markdown 表格呈現** (Standard Markdown Table).
2. 表格標題必須為：### 1. High-Conversion Keyword List
3. 表格欄位必須包含：
| 關鍵字 (Keyword) | 匹配模式 (Match Type) | 搜尋意圖 (Intent) | 潛在客群 (Audience) | 佈局邏輯 (Rationale) |
4. **格式嚴格要求：**
   - **每一列 (Row) 必須單獨佔據一行 (Each row must be on a new line).** 嚴禁將多列合併在同一行。
   - **Rationale** 欄位必須詳細說明該詞如何區分 B2B 與 B2C，並對應產品特定價值。
   - 禁止使用 JSON 或 Code Block。
5. 表格下方提供「排除關鍵字 (Negative Keywords)」清單。
`;

  const userPrompt = `產品名稱: ${product}\n規格細節: ${specs}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: `${systemInstruction}\n\nLanguage: ${language}.`,
        temperature: 0.3,
      }
    });
    return response.text;
  } catch (err) {
    return "關鍵字建議生成失敗。";
  }
};

export const generateSvgFromPrompt = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const systemInstruction = `World-class industrial SVG designer. 
Output ONLY raw <svg>...</svg> code for: ${prompt}.
Rules:
- Valid SVG only. No markdown, no text.
- Viewbox: 0 0 24 24. 
- Use "currentColor" for fills/strokes. 
- Clean, modern, professional vector lines.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      },
    });
    
    let text = response.text || "";
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      return svgMatch[0].trim();
    }
    return text.replace(/```svg/gi, "").replace(/```/gi, "").trim();
  } catch (err: any) {
    throw new Error(err.message || "Fast SVG generation failed");
  }
};

export const generateSolutionCopy = async (software: string, hardware: string, connectivity: string, language: Language) => {
  const ai = getAI();
  const system = `You are a high-end Advantech Marketing Strategist. 
  Your task is to create 3 distinct marketing copy variations for a specific product combination (The Solution Burger).
  Use the 'Peak Experience' methodology.
  
  Format:
  ### 1. The Technical Edge (Focus on Specs)
  ### 2. The Business Bridge (Focus on ROI)
  ### 3. The Visionary Hook (Focus on 'Intelligent Planet' and Trust)`;

  const prompt = `Generate compelling marketing copy for this combination:
  - Software Layer: ${software}
  - Processing Layer: ${hardware}
  - Connectivity Layer: ${connectivity}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `${system}\n\nLanguage: ${language}.`,
        temperature: 0.8,
      }
    });
    return response.text;
  } catch (err) {
    return "Error generating marketing copy.";
  }
};

export const getGeminiBasicTask = async (systemInstruction: string, userPrompt: string, language: Language, isPro: boolean = false) => {
  const ai = getAI();
  try {
    const model = isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: `${systemInstruction}\n\nLanguage: ${language}.`,
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (err: any) {
    return `Error: ${err.message}`;
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
  const ai = getAI();
  
  let formatConstraints = "";
  if (format === 'RSA') {
    formatConstraints = `
    1. **Format:** Responsive Search Ads. 
    2. **Headlines:** Quantity: 10. Length: MAX 30 visual units. Focus: Keywords & Direct Response.
    3. **Descriptions:** Quantity: 4. Length: MAX 90 visual units.`;
  } else if (format === 'PMax') {
    formatConstraints = `
    1. **Format:** Performance Max.
    2. **Short Headlines:** Quantity: 5. Length: MAX 30 visual units.
    3. **Long Headlines:** Quantity: 5. Length: MAX 90 visual units. *CRITICAL: Must be a stand-alone powerful slogan.*
    4. **Descriptions:** Quantity: 4. Length: 1x 60 units, 3x 90 units.
    5. **Focus:** Brand Authority & Broad Appeal across Search/Maps/YT.`;
  } else if (format === 'Display') {
    formatConstraints = `
    1. **Format:** Responsive Display Ads.
    2. **Short Headlines:** Quantity: 5. Length: MAX 30 units.
    3. **Long Headlines:** Quantity: 1. Length: MAX 90 units. *MUST be stand-alone (self-sufficient).*
    4. **Descriptions:** Quantity: 5. Length: MAX 90 units.
    5. **Focus:** Interruptive marketing, visual-first assistance.`;
  } else if (format === 'DemandGen') {
    formatConstraints = `
    1. **Format:** Demand Gen (YouTube/Gmail/Discover).
    2. **Headlines:** Quantity: 5. Length: MAX 40 visual units (extended space for tone).
    3. **Descriptions:** Quantity: 5. Length: MAX 90 units.
    4. **Focus:** Storytelling, native-feel, soft sell, inspirational.`;
  }

  const systemInstruction = `
**Role:** Senior Google Ads Strategist for Advantech.
**Goal:** Generate high-CTR Google Ads JSON for format: ${format}.

**Visual Length Rule (STRICT):**
- 1 Chinese/CJK character = 2 units.
- 1 English letter/number/space = 1 unit.
- **NEVER** exceed the unit limit for the selected format.

**Content Strategy:**
- Translate technical specs into "Scenarios" and "Pain Point Elimination".
- No exclamation marks. No all-caps (except acronyms).
- Keywords "${keywords}" must be naturally integrated into at least 4 headlines.

**Format Specifics:**
${formatConstraints}

**Output Format:** Pure JSON.
{
  "ad_group_idea": "string",
  "headlines": [{ "text": "string", "length_check": "string (units/limit)" }],
  "long_headlines": [{ "text": "string", "length_check": "string" }],
  "descriptions": [{ "text": "string", "length_check": "string" }],
  "marketing_rationale": "string"
}
`;

  const userPrompt = `
Product: ${product}
Specs: ${specs}
Value Prop: ${valueProp}
Keywords: ${keywords}
Language: ${language}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (err: any) {
    console.error(err);
    throw new Error("Ads Generation Failed");
  }
};

/**
 * Analyzes a document image to detect text layout for PPTX reconstruction.
 * Uses gemini-3-flash-preview for high-speed OCR.
 */
export const analyzeDocumentLayout = async (base64Image: string) => {
  const ai = getAI();
  const prompt = `Identify ALL text blocks in the image for PDF-to-PPT reconstruction.
  
  Return a JSON Array where each item has:
  - "text": The exact string content.
  - "box_2d": [ymin, xmin, ymax, xmax] coordinates (0-1000 scale).
  - "font_size": Estimated font size (integer).
  - "is_bold": boolean.
  - "align": "left", "center", or "right".
  - "color": Hex color string (e.g., "000000").
  
  Strict JSON output.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              font_size: { type: Type.NUMBER },
              is_bold: { type: Type.BOOLEAN },
              align: { type: Type.STRING },
              color: { type: Type.STRING }
            },
            required: ["text", "box_2d"]
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (err) {
    console.error("Layout analysis failed", err);
    return [];
  }
};

/**
 * Removes text from an image using Gemini 2.5 Flash Image (Inpainting).
 * Used for creating a clean background for PPT slides.
 */
export const removeTextFromImage = async (base64Image: string): Promise<string> => {
  const ai = getAI();
  // Optimized prompt for "Background Cleaning"
  const prompt = "Strictly remove ALL text, numbers, and watermarks from this document image. Preserve all diagrams, logos, photos, and background styling exactly as they are. Fill the gaps seamlessly to create a clean background template.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: base64Image } }
        ]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    throw new Error("No image generated.");
  } catch (err: any) {
    // If image generation fails, return original so the process doesn't crash, 
    // but text will be duplicated.
    console.error("Image cleaning failed, using original", err);
    return base64Image; 
  }
};
