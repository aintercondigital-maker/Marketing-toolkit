# Advantech CP Marketing Toolkit (研華科技 B2B 智慧行銷工具箱)

[English Version Below](#english-version)

本專案是一個專為 **研華科技 (Advantech)** 量身打造的 B2B 工業物聯網與物聯網解決方案智慧行銷工具箱。透過整合智慧 AI 模型、**Vector DB (向量資料庫)** 以及 **Google Drive 雲端硬碟同步** 技術，為行銷人員與業務經理提供全方位的 B2B 高轉化文案、廣告關鍵字策略及 Moments of Truth (MOT) 關鍵體驗決策表規劃。

---

## 🌟 核心特色功能

### 1. 📂 智慧知識庫管理器 (Knowledge Base Manager)
*   **本地文件導入**：支援 PDF、TXT 以及 Markdown (.md) 格式之工業產品說明書、白皮書與行銷文檔上傳。
*   **Google Drive 雲端雙向同步**：整合 Firebase Authentication 進行 Google 帳戶授權，可直接在介面搜尋、瀏覽並一鍵同步下載 Google 雲端硬碟中的關鍵文件。
*   **智慧分塊與向量化 (Chunking & Embeddings)**：自動將文件拆分為高關聯性的文本區塊，並使用高效語意嵌入模型產生向量，儲存至本地 SQLite 向量資料庫（RAG 檢索增強生成架構）。

### 2. 🧠 AI 智慧核心引擎
*   **語意理解與生成 (LLM)**：結合 RAG 架構與生成式 AI，回答最精準的研華專屬產品與服務資訊。
*   **語意搜尋與檢索**：使用高維度嵌入向量進行文件與搜尋詞的向量轉換，實作極高精準度的語意搜尋。
*   **多模態視覺版面分析 (Vision)**：對上傳之 PDF 圖檔進行細緻的排版與區塊文字提取，以便進行 PDF-to-PPT 簡報重構。
*   **工業向量繪圖生成**：能透過純文字指令呼叫 AI 精準輸出符合研華企業藍色調與工業風的 SVG 向量圖形。

### 3. 🍔 B2B 解決方案堡壘 (B2B Solution Burger Builder)
*   行銷人員可依據「**軟體層 (Software)** + **運算硬體層 (Compute)** + **感知與通訊層 (Sensing/IO)**」進行三層漢堡式的技術堆疊。
*   AI 依據研華科技五大痛點框架（Downtime、Energy、Efficiency、Control、Quality）自動輸出高說服力的 **5-Step 故事線文案**（包含頭像定位、量化痛點、唯一解法、ROI 證據以及 Call-to-Action 呼籲）。

### 4. 📈 Google Ads SEM 關鍵字規劃大師
*   輸入產品規格，AI 自動輸出「核心層、屬性層、場景層」三維度的專業 B2B Google 搜尋廣告關鍵字。
*   提供對應的**比對類型 (Match Type)**、**搜尋意圖 (Intent)**、**目標受眾**與**專業論證**，並自動列出精準的 **排除關鍵字 (Negative Keywords)**。

### 5. 🎯 B2B 10 大關鍵時刻 (MOT) 體驗決策表
*   依據「峰值體驗 (Peak Experience)」方法論，為特定工業產品設計 **10 個關鍵決策時刻**。
*   涵蓋開場演說、3分鐘簡介、成功案例證明鏈、20個問不倒 QA、驚喜交付等，並自動映射到 SECURE 核心屬性（速度、彈性、客製、降不確定性、可靠度、認知契合）。

### 6. 📝 嚴格字數限制廣告文案產生器 (Ad Copy Generator)
*   支援 RSA（回應式搜尋廣告）、PMax（最高成效廣告）、Display（多媒體廣告）以及 DemandGen（需求開發廣告）格式。
*   內建嚴格的 **CJK/英文雙規字元計數器**（1個中文/日文/韓文字 = 2字元，英文/數字/空格 = 1字元），確保產出的 Headlines (30/90字元) 與 Descriptions (90字元) 100% 符合 Google Ads 後台限制。

---

## 🛠️ 技術架構

### 前端 (Client-Side)
*   **React 18** & **TypeScript**
*   **Vite** 高效建置工具
*   **Tailwind CSS** 精緻工業美學 UI 設計
*   **Firebase Client SDK**（Google Drive OAuth 授權、雲端存取 Scope 託管）

### 後端 (Server-Side)
*   **Express** API 伺服器
*   **SQLite** & **Better-SQLite3** (儲存 Indexed Toolkit Documents 與 向量/文字 Chunks 資料)
*   **Multer** (處理本地文件上傳緩衝)

---

## 🚀 啟動與開發

### 1. 安裝套件
```bash
npm install
```

### 2. 本地開發模式 (Express + Vite 混合熱重載)
```bash
npm run dev
```

### 3. 生產環境編譯與部署
```bash
npm run build
```

---

<span id="english-version"></span>

# Advantech CP Marketing Toolkit

This project is an intelligent B2B industrial IoT and IoT solution marketing toolkit customized for **Advantech**. By integrating state-of-the-art AI models, **Vector DB**, and **Google Drive sync** technology, it provides marketers and business development managers with comprehensive B2B high-conversion copy, search ad keyword strategy, and Moments of Truth (MOT) customer experience planners.

---

## 🌟 Core Features

### 1. 📂 Knowledge Base Manager
*   **Local Document Ingestion**: Upload Advantech product manuals, whitepapers, and marketing files in PDF, TXT, or Markdown (.md) formats.
*   **Google Drive Integration**: Connect through Google credentials using Firebase Authentication to search, browse, and sync files directly from Google Drive.
*   **Smart Chunking & Vectorization**: Automatically splits documents into semantic chunks, generates vectors using an embedding model, and persists them into a local SQLite database (RAG architecture).

### 2. 🧠 Intelligent AI Engine
*   **Generative AI & LLM (with RAG)**: Answers queries with high accuracy based on Advantech's internal product and solution database.
*   **Semantic Search**: Utilizes embedding models to match user query intentions with knowledge base articles.
*   **Multimodal Layout Analysis (Vision)**: Extracts text layouts and boundaries from uploaded document images to assist in reconstructing PDF slides to PowerPoint.
*   **Industrial Vector Graphics Creator**: Generates responsive SVG drawings that adhere strictly to Advantech's branding and industrial design palette.

### 3. 🍔 B2B Solution Burger Builder
*   Stack hardware, software, and connectivity layers ("Software" + "Compute" + "Sensing/IO") like a three-layered hamburger.
*   The AI produces a highly persuasive **5-Step Solution Narrative** based on Advantech's five core pain-point areas (Downtime, Energy, Efficiency, Control, Quality) including target avatar, quantified pain, unique solution, ROI proof, and Call-to-Action.

### 4. 📈 Google Ads SEM Keyword Planner
*   Input product specifications to generate high-conversion B2B Google Ads keywords classified into Core, Attribute, and Scenario layers.
*   Provides match type suggestions, search intent analysis, target audience, technical rationales, and an automated list of **Negative Keywords**.

### 5. 🎯 B2B Moments of Truth (MOT) Planner
*   Design a peak-experience planning dashboard containing **10 critical B2B Moments of Truth (MOT)**.
*   Covers opening speeches, success stories, QA objection handling, value demos, and unexpected value delivery mapped directly to SECURE traits (Speed, Engineered Flexibility, Enhanced Customization, Uncertainty Reduction, Reliability, Cognitive Alignment).

### 6. 📝 Strict Length-Constrained Ad Copy Generator
*   Supports RSA (Responsive Search Ads), PMax (Performance Max), Display, and DemandGen formats.
*   Features a built-in strict CJK & Latin character counter (1 CJK char = 2 units, 1 Latin/space = 1 unit) to guarantee generated headlines and descriptions comply perfectly with Google Ads length limitations.

---

## 🛠️ Technology Stack

### Client-Side
*   **React 18** & **TypeScript**
*   **Vite** Build System
*   **Tailwind CSS** Industrial Aesthetics UI Theme
*   **Firebase Client SDK** (Google Drive OAuth authentication and access scope handling)

### Server-Side
*   **Express** API Server
*   **SQLite** & **Better-SQLite3** (Saves indexed document chunks and semantic vectors)
*   **Multer** (Handles local file upload buffering)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server (Express + Vite Proxy)
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```
