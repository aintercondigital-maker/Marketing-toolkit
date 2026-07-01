import OpenAI from "openai";
import { MARKETING_ASSISTANT_PROMPT, INITIAL_KB } from "../constants";
import { Language } from "../types";
import db from "../lib/db";
import "dotenv/config";

// Setup OpenAI client for NVIDIA NIM
const getOpenAI = () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY environment variable is not set.");
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1"
  });
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function localTextSimilaritySearch(query: string, chunks: { content: string, filename: string }[], topK: number = 3) {
  const words = query.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return chunks.slice(0, topK);
  
  const scored = chunks.map(chunk => {
    let score = 0;
    const text = chunk.content.toLowerCase();
    for (const word of words) {
      if (text.includes(word)) {
        score += 1.0;
        const count = text.split(word).length - 1;
        score += count * 0.15;
      }
    }
    const relativeScore = score / (Math.log(text.length) + 1);
    return { ...chunk, score: relativeScore };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// Embedding helper using NVIDIA NIM
export const getNvidiaEmbeddings = async (contents: string[]): Promise<{ values: number[] }[]> => {
  try {
    const openai = getOpenAI();
    const response = await openai.embeddings.create({
      model: "nvidia/embeddings-nv-embed-qa-4",
      input: contents,
      encoding_format: "float",
    });
    return response.data.map(item => ({ values: item.embedding }));
  } catch (err) {
    console.warn("NVIDIA Embedding API failed. Falling back to local keyword search...", err);
    // Return mock 1024-dimensional embeddings as fallback
    return contents.map(() => ({ values: new Array(1024).fill(0) }));
  }
};

const getKBContext = async (query?: string) => {
  let context = INITIAL_KB.map(k => `[Source: ${k.source}]\n${k.content}`).join('\n\n');
  
  if (query) {
    let topChunks: any[] = [];
    try {
      const embeddings = await getNvidiaEmbeddings([query]);
      const queryEmbedding = embeddings?.[0]?.values;
      if (queryEmbedding) {
        const allChunks = db.prepare("SELECT content, embedding, filename FROM chunks JOIN documents ON chunks.document_id = documents.id").all() as { content: string, embedding: string, filename: string }[];
        
        const scoredChunks = allChunks.map(chunk => {
          const chunkEmbedding = JSON.parse(chunk.embedding) as number[];
          const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
          return { content: chunk.content, filename: chunk.filename, score };
        });

        scoredChunks.sort((a, b) => b.score - a.score);
        topChunks = scoredChunks.slice(0, 3);
      }
    } catch (e) {
      console.warn("Embedding search failed. Falling back to local keyword matching search...", e);
      try {
        const allChunks = db.prepare("SELECT content, filename FROM chunks JOIN documents ON chunks.document_id = documents.id").all() as { content: string, filename: string }[];
        topChunks = localTextSimilaritySearch(query, allChunks, 3);
      } catch (innerErr) {
        console.error("Local text search fallback failed:", innerErr);
      }
    }

    if (topChunks && topChunks.length > 0) {
      const vectorContext = topChunks.map((r: any) => `[Source: ${r.filename}]\n${r.content}`).join('\n\n');
      context += '\n\n--- ADDITIONAL VECTOR DB CONTEXT ---\n\n' + vectorContext;
    }
  }
  return context;
};

// Generic Chat Completion Helper using NVIDIA NIM
const generateChatCompletion = async (
  systemInstruction: string,
  userPrompt: string,
  temperature: number = 0.5,
  isJson: boolean = false
): Promise<string> => {
  try {
    const openai = getOpenAI();
    const systemContent = isJson 
      ? `${systemInstruction}\n\nIMPORTANT: You MUST respond with a valid JSON object. Do not include any other conversational text or markdown code blocks (like \`\`\`json).\n\n`
      : systemInstruction;

    const response = await openai.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userPrompt }
      ],
      temperature: temperature,
      response_format: isJson ? { type: "json_object" } : undefined,
    });
    return response.choices[0]?.message?.content || "";
  } catch (err: any) {
    console.error("NVIDIA Chat Completion Error:", err);
    throw err;
  }
};

function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

export const getGeminiMarketingResponseServer = async (userPrompt: string, language: Language) => {
  const kbContext = await getKBContext(userPrompt);
  const sanitizedContext = kbContext.trim() || "No internal assets currently loaded.";
  const fullSystemPrompt = `
${MARKETING_ASSISTANT_PROMPT}

### INTERNAL KNOWLEDGE BASE (PRIORITY 1)
--- START OF CONTEXT ---
${sanitizedContext}
--- END OF CONTEXT ---

Always prioritize Advantech's internal data.
`;
  
  const text = await generateChatCompletion(
    `${fullSystemPrompt}\n\nLanguage: ${language}.`,
    userPrompt,
    0.1
  );

  return {
    text: text || "No information found.",
    grounding: []
  };
};

export const generateKeywordSuggestionsServer = async (product: string, specs: string, language: Language) => {
  const kbContext = await getKBContext(product + " " + specs);
  const systemInstruction = `
You are a Senior SEM Expert specializing in B2B Industrial Manufacturing and IoT. Your task is to generate a high-conversion Google Ads keyword list based on product specifications.

**CRITICAL REQUIREMENT:**
The entire response, including table headers, table content, and rationales, MUST be written in the following language: **${language}**.

**Advantech Knowledge Base Context:**
${kbContext}

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
  return await generateChatCompletion(systemInstruction, userPrompt, 0.3);
};

export const generateSolutionCopyServer = async (software: string, hardware: string, connectivity: string, language: Language) => {
  const kbContext = await getKBContext(software + " " + hardware + " " + connectivity);
  const system = `You are a high-end Advantech Marketing Strategist. 
  Your task is to create a compelling B2B solution narrative for a specific "Solution Burger" (Software + Compute + Connectivity).
  
  **STRICT 5-STEP STRATEGIC FRAMEWORK:**
  1. **Avatar (你是誰？決策者是誰？)**: Define your role as the partner and identify the specific B2B decision-maker personas (e.g., Plant Manager, CFO).
  2. **Pain (量化的痛點)**: Describe the specific industrial problem. MUST include quantified impact (e.g., "$20k/hr downtime", "ISO 50001 compliance risks").
  3. **Story (唯一的解法)**: Explain why this specific combination of Advantech technology is the ONLY viable path forward. Highlight unique technical differentiators (e.g., "IoT Plug-and-Play", "One-click setup").
  4. **Proof (ROI 的證據)**: Provide evidence of success or ROI calculations based on industrial standards.
  5. **CTA (下一步做什麼？)**: A clear, strategic closing action.

  **ADVANTECH PAIN-POINT CONTEXT:**
  - **Downtime**: PHM with WISE-750/2410 (Proactive over Reactive).
  - **Energy**: ESG & iEMS with ECU-1252/479 (Connecting Energy Horizons).
  - **Efficiency**: FactoryOEE I.App (Visualizing hidden bottlenecks).
  - **Control**: EtherCAT with AMAX-5580 & MotionNavi (Reducing complexity).
  - **Quality**: iDAQ with PCIE-1840 (Capturing micro-second defects).

  **STRICT LANGUAGE RULE:** Output content in: **${language}**.
  **FORMAT:** Use clear H3 headers for each step.
  
  **Advantech Knowledge Base Context:**
  ${kbContext}`;

  const prompt = `Target Language: ${language}
  Generate a solution narrative using these layers:
  - Intelligence Layer (Software): ${software}
  - Processing Layer (Hardware): ${hardware}
  - Connectivity Layer (Sensing/IO): ${connectivity}`;

  return await generateChatCompletion(system, prompt, 0.7);
};

export const getGeminiBasicTaskServer = async (systemInstruction: string, userPrompt: string, language: Language, isPro: boolean = false) => {
  const kbContext = await getKBContext(userPrompt);
  const sys = `${systemInstruction}\n\n**Advantech Knowledge Base Context:**\n${kbContext}\n\nLanguage: ${language}.`;
  return await generateChatCompletion(sys, userPrompt, 0.5);
};

export const generateMotTableServer = async (product: string, target: string, pain: string, language: Language) => {
  const kbContext = await getKBContext(product + " " + target + " " + pain);
  const systemInstruction = `
# Task
You are a B2B Strategy Consultant specialized in the "Peak Experience" methodology. Design a planning table for 10 specific B2B Moments of Truth (MOT).

**CORE PHILOSOPHY:**
1. "Clients want Delivery, not Service." (企業要的是交付，不是服務)
2. Every suggestion must focus on the 4 pillars: High Efficiency, Cost Saving, Results-Driven, Scalability (高效、省錢、出結果、能複製).

**STRICT LANGUAGE RULE:** Output the entire table and content in: **${language}**.

# 1. B2B 10 MOT DEFINITIONS (Follow this exact sequence):
1. **The Opening Speech (高熵標題+高信息增益)**: Create an interest-hook using high entropy titles (e.g., AI ESG trends) with high information gain (proven results).
2. **The 3-Minute Beauty (公司簡介)**: A concise introduction designed to capture the Big Boss's attention in 3 minutes, highlighting unique value.
3. **The Proof Anchor (成功案例)**: Represent 3 types (Big/Med/Small or different verticals) to prove success is "replicable."
4. **The 20 Gold Questions (問不倒的QA)**: Standardized, best-practice answers to common professional objections.
5. **The Value Demo (產品/方案展示)**: "Seconds to understand the difference." Avoid training; focus on the "Peak" of your USP.
6. **The Discovery Loop (展示中的洞察)**: Using the demo to ask targeted questions and uncover the client's actual pain points.
7. **The Client Spotlight (讓甲方覺得獨特)**: Present deep observations about the client's own "beauty" and competitive edge.
8. **The Multi-Role Proposal (正式提案)**: Address 5 key buyer personas simultaneously and provide clear options (options = freedom).
9. **The Crisis Pivot (反轉的時刻)**: Turn technical or delivery failures into trust-building "Peaks" through instant resolution.
10. **The Surprise Delivery (超越預期的交付)**: Managing expectations to ensure the final result far exceeds the initial scope.

# 2. FRAMEWORK MAPPING
Each MOT must map to a SECURE attribute: Speed, Engineered Flexibility, Enhanced Customization, Uncertainty Reduction, Reliability, Cognitive Alignment.

# 3. OUTPUT FORMAT (Markdown Table)
| Order | B2B MOT Strategy | Stage (Entrance/Conversion/Retention) | SECURE Attribute | Delivery Strategy (Peak Experience Action) |

# 4. CONTEXT
Advantech Knowledge Base:
${kbContext}
`;

  const userPrompt = `
  Context for Strategy:
  - Product/Solution: ${product}
  - Target Customer: ${target}
  - Primary Pain Point: ${pain}
  
  Output Language: ${language}.
  `;

  return await generateChatCompletion(systemInstruction, userPrompt, 0.7);
};

export type AdFormat = 'RSA' | 'PMax' | 'Display' | 'DemandGen';

export const generateGoogleAdsServer = async (
  product: string, 
  specs: string, 
  valueProp: string, 
  keywords: string,
  format: AdFormat, 
  language: Language
) => {
  const kbContext = await getKBContext(product + " " + specs + " " + keywords);
  const systemInstruction = `
**Role:** Senior Google Ads Strategist specialized in Industrial B2B (Advantech).
**Goal:** Generate character-compliant Ad Copy for ${format} in ${language}.

**CHARACTER LIMIT RULES (CRITICAL):**
1. 1 Chinese/Japanese/Korean (CJK) char = 2 units.
2. 1 English/Latin char/Number/Space = 1 unit.
3. **Headlines:** Max 30 units (e.g., 15 CJK chars or 30 English chars).
4. **Descriptions:** Max 90 units (e.g., 45 CJK chars or 90 English chars).
5. **Long Headlines (PMax/DemandGen only):** Max 90 units.

**TASK:**
- Use the provided Product, Specs, Value Prop, and Keywords to create a high-CTR ad campaign.
- Headlines should focus on ROI, Certifications (e.g., IEC 61850), and Reliability.
- Descriptions should highlight specific technical pain-point solutions.

**Advantech Knowledge Base Context:**
${kbContext}

**OUTPUT FORMAT:**
You MUST return a JSON object with this exact structure:
{
  "ad_group_idea": "string describing theme",
  "headlines": [
    { "text": "headline under 30 units", "length_check": "e.g. 24/30" }
  ],
  "long_headlines": [
    { "text": "long headline under 90 units", "length_check": "e.g. 56/90" }
  ],
  "descriptions": [
    { "text": "description under 90 units", "length_check": "e.g. 78/90" }
  ],
  "marketing_rationale": "rationale string"
}
`;

  const userPrompt = `
Product: ${product}
Specs: ${specs}
Value Proposition Context: ${valueProp}
Selected Keywords: ${keywords}
Language: ${language}
Ad Format: ${format}
  `;

  const responseText = await generateChatCompletion(systemInstruction, userPrompt, 0.4, true);
  return responseText;
};

export const analyzeDocumentLayoutServer = async (base64Image: string, language: Language) => {
  try {
    const openai = getOpenAI();
    const prompt = `Identify ALL text blocks for PDF-to-PPT reconstruction. Return a JSON Array containing objects with "text" and "box_2d" (an array of 4 numbers [ymin, xmin, ymax, xmax] normalized 0-1000).
    The document language is primarily ${language}.
    
    Format the response as a JSON Array of text blocks:
    [
      {
        "text": "Extracted text snippet",
        "box_2d": [ymin, xmin, ymax, xmax],
        "font_size": 12,
        "is_bold": false,
        "align": "left",
        "color": "#000000"
      }
    ]
    
    Respond strictly with valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const responseText = response.choices[0]?.message?.content || "[]";
    return cleanAndParseJson(responseText);
  } catch (err) {
    console.error("NVIDIA Vision Layout Analysis failed:", err);
    return [];
  }
};

export const removeTextFromImageServer = async (base64Image: string): Promise<string> => {
  return base64Image;
};

export const generateSvgFromPromptServer = async (prompt: string): Promise<string> => {
  const kbContext = await getKBContext(prompt);
  const systemInstruction = `You are a world-class vector graphic artist specializing in industrial design. 
  Generate a single, complete, valid SVG string based on the user prompt. 
  The SVG should be clean, minimalist, and use a professional color palette (like Indigo or Advantech Blue). 
  Ensure the SVG has a viewBox and is responsive. Return ONLY the raw SVG code without any markdown formatting.
  Do not include code block tags or surrounding text.
  
  **Advantech Knowledge Base Context:**
  ${kbContext}`;

  const responseText = await generateChatCompletion(systemInstruction, prompt, 0.2);
  return responseText.replace(/```svg/g, '').replace(/```/g, '').trim() || "";
};
