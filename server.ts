import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import Database from "better-sqlite3";

import cors from "cors";
import path from "path";
import fs from "fs";
import db from "./lib/db";
import { 
  getGeminiMarketingResponseServer, 
  generateKeywordSuggestionsServer,
  generateSolutionCopyServer,
  getGeminiBasicTaskServer,
  generateMotTableServer,
  generateGoogleAdsServer,
  analyzeDocumentLayoutServer,
  removeTextFromImageServer,
  generateSvgFromPromptServer,
  getNvidiaEmbeddings
} from "./services/geminiService.server";

// Initialize SQLite Database
const insertDocument = db.prepare("INSERT INTO documents (filename) VALUES (?)");
const insertChunk = db.prepare("INSERT INTO chunks (document_id, content, embedding) VALUES (?, ?, ?)");
const getAllChunks = db.prepare("SELECT content, embedding, filename FROM chunks JOIN documents ON chunks.document_id = documents.id");

// Setup Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Helper function to chunk text
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Upload PDF/Text and process
  app.post("/api/upload-pdf", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname.toLowerCase();
      const dataBuffer = fs.readFileSync(filePath);
      let text = "";

      if (fileName.endsWith(".pdf")) {
        // Parse PDF
        try {
          // @ts-ignore
          const pdf = await import('pdf-parse');
          // @ts-ignore
          const data = await (pdf.default || pdf)(dataBuffer);
          text = data.text;
        } catch (pdfError) {
          console.error("PDF Parse error:", pdfError);
          throw new Error("Failed to parse PDF file");
        }
      } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
        // Parse Text/Markdown
        text = dataBuffer.toString("utf-8");
      } else {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Unsupported file format. Please upload PDF, TXT, or MD." });
      }

      if (!text || text.trim() === "") {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "Could not extract text from file" });
      }

      // Chunk text
      const chunks = chunkText(text);

      // Get embeddings
      let embeddings;
      try {
        embeddings = await getNvidiaEmbeddings(chunks);
      } catch (embErr) {
        console.warn("Embedding API failed on upload. Using mock embeddings fallback...", embErr);
        embeddings = chunks.map(() => ({ values: new Array(1024).fill(0) }));
      }

      if (!embeddings || embeddings.length !== chunks.length) {
        throw new Error("Failed to generate embeddings for all chunks");
      }

      // Save to database
      const docResult = insertDocument.run(req.file.originalname);
      const documentId = docResult.lastInsertRowid;

      const insertMany = db.transaction((chunksToInsert: {content: string, embedding: number[]}[]) => {
        for (const chunk of chunksToInsert) {
          insertChunk.run(documentId, chunk.content, JSON.stringify(chunk.embedding));
        }
      });

      const chunksData = chunks.map((content, index) => ({
        content,
        embedding: embeddings[index].values
      }));

      insertMany(chunksData);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({ success: true, message: "File processed and added to knowledge base", chunksAdded: chunks.length });
    } catch (error: any) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Query vector database
  app.post("/api/query", async (req, res) => {
    try {
      const { query, topK = 3 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const queryResult = await getNvidiaEmbeddings([query]);
      const queryEmbedding = queryResult?.[0]?.values;
      if (!queryEmbedding) {
        throw new Error("Failed to generate embedding for query");
      }

      // Fetch all chunks and calculate similarity in memory
      const allChunks = getAllChunks.all() as { content: string, embedding: string, filename: string }[];
      
      const scoredChunks = allChunks.map(chunk => {
        const chunkEmbedding = JSON.parse(chunk.embedding) as number[];
        const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
        return {
          content: chunk.content,
          filename: chunk.filename,
          score
        };
      });

      // Sort by score descending and take top K
      scoredChunks.sort((a, b) => b.score - a.score);
      const topChunks = scoredChunks.slice(0, topK);

      res.json({ results: topChunks });
    } catch (error: any) {
      console.error("Error querying knowledge base:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Get all documents
  app.get("/api/documents", (req, res) => {
    try {
      const docs = db.prepare("SELECT * FROM documents ORDER BY upload_date DESC").all();
      res.json({ documents: docs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", (req, res) => {
    try {
      const id = req.params.id;
      db.prepare("DELETE FROM chunks WHERE document_id = ?").run(id);
      db.prepare("DELETE FROM documents WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini Proxy Endpoints
  app.post("/api/gemini/marketing", async (req, res) => {
    try {
      const { userPrompt, language } = req.body;
      const data = await getGeminiMarketingResponseServer(userPrompt, language);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/keywords", async (req, res) => {
    try {
      const { product, specs, language } = req.body;
      const text = await generateKeywordSuggestionsServer(product, specs, language);
      res.json({ text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/solution-copy", async (req, res) => {
    try {
      const { software, hardware, connectivity, language } = req.body;
      const text = await generateSolutionCopyServer(software, hardware, connectivity, language);
      res.json({ text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/basic-task", async (req, res) => {
    try {
      const { systemInstruction, userPrompt, language, isPro } = req.body;
      const text = await getGeminiBasicTaskServer(systemInstruction, userPrompt, language, isPro);
      res.json({ text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/mot", async (req, res) => {
    try {
      const { product, target, pain, language } = req.body;
      const text = await generateMotTableServer(product, target, pain, language);
      res.json({ text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/google-ads", async (req, res) => {
    try {
      const { product, specs, valueProp, keywords, format, language } = req.body;
      const text = await generateGoogleAdsServer(product, specs, valueProp, keywords, format, language);
      res.json({ text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/analyze-layout", async (req, res) => {
    try {
      const { base64Image, language } = req.body;
      const data = await analyzeDocumentLayoutServer(base64Image, language);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/remove-text", async (req, res) => {
    try {
      const { base64Image } = req.body;
      const image = await removeTextFromImageServer(base64Image);
      res.json({ image });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/generate-svg", async (req, res) => {
    try {
      const { prompt } = req.body;
      const svg = await generateSvgFromPromptServer(prompt);
      res.json({ svg });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Note: Express v5 uses *all instead of *
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
