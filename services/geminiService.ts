
import { GoogleGenAI, Type } from "@google/genai";
import { MARKETING_ASSISTANT_PROMPT, INITIAL_KB } from "../constants";
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
You are a Senior SEM Expert specializing in B2B Industrial Manufacturing and IoT. Your task is to generate a high-conversion Google Ads keyword list based on product specifications.

**CRITICAL REQUIREMENT:**
The entire response, including table headers, table content, and rationales, MUST be written in the following language: **${language}**.

**Thinking Process:**
1. **Core Layer:** Product category and core name.
2. **Attribute Layer:** Specific industrial specs (e.g., "Isolated", "DIN-rail", "ESD Protection").
3. **Scenario Layer:** Pain-point driven keywords for industrial environments.

**Output Rules:**
1. Must use a standard Markdown table.
2. The table must have these columns: Keyword, Match Type, Intent, Target Audience, Rationale.
3. Rationale must explain why this keyword is professional B2B intent vs generic B2C.
4. Provide a list of "Negative Keywords" below the table.
`;

  const userPrompt = `Target Language: ${language}\nProduct: ${product}\nSpecs: ${specs}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3,
      }
    });
    return response.text;
  } catch (err) {
    return "Error generating keyword intelligence.";
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

export const generateMotTable = async (product: string, target: string, pain: string, language: Language) => {
  const ai = getAI();
  
  const kbContext = INITIAL_KB.map(k => `[Source: ${k.source}]\n${k.content}`).join('\n\n');

  const systemInstruction = `
# Task
Please design a strategy planning table containing 10 B2B Moments of Truth (MOT) based on the provided framework.

**STRICT LANGUAGE RULE:** Output the entire table and content in: **${language}**.

# 1. Framework Constraints
* **Strict Order (1-10):**
    1. MOT 1: The Opening Gambit (Entrance)
    2. MOT 2: Needs Discovery (Entrance)
    3. MOT 3: The Product Demo (Conversion)
    4. MOT 4: The Client-Specific Insight (Conversion)
    5. MOT 5: The Moment of Crisis (Retention)
    6. MOT 6: The Formal Proposal (Conversion)
    7. MOT 7: The Final Delivery (Retention)
    8. MOT 8: The Q&A Session (Conversion)
    9. MOT 9: Success Stories (Referral)
    10. MOT 10: The Company Introduction (Entrance)
* **SECURE Mapping**: Map each MOT to one: Speed, Engineered Flexibility, Enhanced Customization, Uncertainty Reduction, Reliability, Cognitive Alignment.
* **Value Keywords**: Bold these keywords in descriptions: Sustainable Growth, Long-term Value, Efficiency, Reduce Cost, Competitive Advantage, Agility.

# 2. Output Format (Markdown Table)
| Order | MOT Name | Stage | SECURE | Experience & Value Delivery |

# 3. Internal Knowledge Base Context
${kbContext}
`;

  const userPrompt = `
  Context for Strategy:
  - Product/Solution: ${product}
  - Target Customer: ${target}
  - Primary Pain Point: ${pain}
  
  Output Language: ${language}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text;
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
  const ai = getAI();
  
  const systemInstruction = `
**Role:** Senior Google Ads Strategist.
**Goal:** Generate JSON for ${format}. 
**Language:** ${language}.
1 Chinese/Japanese/Korean char = 2 units. 1 English char = 1 unit.
**Output Format:** Pure JSON.
`;

  const userPrompt = `Product: ${product}\nSpecs: ${specs}\nValue Prop: ${valueProp}\nKeywords: ${keywords}\nLanguage: ${language}`;

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

export const analyzeDocumentLayout = async (base64Image: string) => {
  const ai = getAI();
  const prompt = `Identify ALL text blocks for PDF-to-PPT reconstruction. Return JSON Array with box_2d.`;

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
    return response.text ? JSON.parse(response.text) : [];
  } catch (err) {
    console.error("Layout analysis failed", err);
    return [];
  }
};

export const removeTextFromImage = async (base64Image: string): Promise<string> => {
  const ai = getAI();
  const prompt = "Strictly remove ALL text from this document image. Fill the gaps seamlessly.";
  
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
        if (part.inlineData) return part.inlineData.data;
      }
    }
    return base64Image;
  } catch (err: any) {
    return base64Image; 
  }
};

export const generateSvgFromPrompt = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const systemInstruction = `You are a world-class vector graphic artist specializing in industrial design. 
  Generate a single, complete, valid SVG string based on the user prompt. 
  The SVG should be clean, minimalist, and use a professional color palette (like Indigo or Advantech Blue). 
  Ensure the SVG has a viewBox and is responsive. Return ONLY the raw SVG code without any markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });
    return response.text?.replace(/```svg/g, '').replace(/```/g, '').trim() || "";
  } catch (err: any) {
    console.error("SVG generation failed", err);
    throw new Error(`Failed to generate SVG: ${err.message}`);
  }
};
