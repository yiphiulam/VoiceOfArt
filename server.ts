import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateContentWithRetry(params: any, retries = 5) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      if (attempt >= retries) throw error;
      
      let delay = 2000 * Math.pow(2, attempt);
      const errorMessage = error?.message || '';
      const retryMatch = errorMessage.match(/Please retry in (\d+(\.\d+)?)s/);
      if (retryMatch) {
        delay = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000;
      }
      
      console.warn(`Gemini API error, retrying in ${delay}ms... (attempt ${attempt}/${retries})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.post("/api/analyze-artwork", async (req, res) => {
    try {
      const { base64Image } = req.body;
      
      if (!base64Image) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Extract correct mime type
      const match = base64Image.match(/^data:(image\/\w+);base64,/);
      const mimeType = match ? match[1] : "image/jpeg";
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

      const prompt = `You are an expert art analyst. Analyze THIS SPECIFIC uploaded artwork. 
      Do NOT invent features that are not visible in this image.
      If the image is a drawing, sketch, or different artwork, ONLY identify the visual elements actually present in the image (like specific colors, figures, shapes, or subjects you see).
      Identify 1 to 2 key visual elements that stand out in this specific image to save processing time.
      For each element, provide:
      1. 'id': a short unique string id
      2. 'x': horizontal coordinate percentage (e.g., "30%") of its center relative to the top-left of the image.
      3. 'y': vertical coordinate percentage (e.g., "40%") of its center relative to the top-left of the image.
      4. 'title': a short title (in Traditional Chinese)
      5. 'desc': a VERY BRIEF description of what you see (max 20 words, in Traditional Chinese).`;

      const response: any = await generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                x: { type: "STRING" },
                y: { type: "STRING" },
                title: { type: "STRING" },
                desc: { type: "STRING" }
              }
            }
          }
        }
      });

      let jsonText = response.text || "[]";
      try {
        const results = JSON.parse(jsonText);
        res.json({ hotspots: results });
      } catch (e) {
        console.error("JSON parse error on model output:", jsonText);
        res.json({ hotspots: [] });
      }
    } catch (error) {
      console.error("VLM Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze artwork" });
    }
  });

  app.post("/api/reflection-chat", async (req, res) => {
    try {
      const { base64Image, history, hotspots } = req.body;
      
      const systemInstruction = `你是一個溫暖且富有洞察力的藝術反思伴侶（Voice of Arts）。
你的任務是引導使用者觀察梁奕焚的畫作或其他當代藝術作品，啟發他們的個人反思。
核心原則：
1. 結合 RAG 背景庫：適時帶入梁奕焚的風格背景（如：常民生活日常百態、小人物的尊嚴、強烈色彩、原始性、傳統工藝的傳承等），作為對話的基底。
2. 開放式提問 (引发思考) - 必須根據使用者上傳的畫面具體細節（如人物動作、色彩對比、物件）提出開放式問題，讓使用者思考「你覺得主角在做什麼？」或「這顏色帶給你什麼感受？」等。絕對不要只是單向輸出知識。
3. 保留模糊性 (Preserve Ambiguity)：當使用者認真回覆後，先肯定他們的有趣觀點，然後可以保留模糊性地給出另一種可能的藝術史解讀（如：部分學者認為... 但也有另一種解讀是...），鼓勵他們對藝術的多元詮釋。

如果使用者是第一次進入對話（沒有歷史紀錄）：
第一句話先打招呼，點出畫面中明顯的特徵或氛圍（根據上傳圖片），然後直接提出一個開放式問題詢問他們的感受或想法。
如果使用者已經有回覆：
給予回應鼓勵，補充一點相關文化或歷史脈絡，並可視情況進行下一個提問或是適度總結。`;

      let contents: any[] = [];
      let imagePart: any[] = [];
      if (base64Image) {
        const match = base64Image.match(/^data:(image\/\w+);base64,/);
        const mimeType = match ? match[1] : "image/jpeg";
        imagePart = [{
          inlineData: {
            mimeType: mimeType,
            data: base64Image.replace(/^data:image\/\w+;base64,/, "")
          }
        }];
      }

      if (!history || history.length === 0) {
        contents = [
          {
            role: 'user',
            parts: [
              ...imagePart,
              { text: "請根據這幅圖片，包含以下系統識別出的重點：" + JSON.stringify(hotspots || []) + "，作為藝術反思伴侶開場，說明這幅作品的獨特之處，並向我提出一個具體畫面的反思問題。" }
            ]
          }
        ];
      } else {
        contents = history.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        // Prepend image to the first user message if history exists
        if (imagePart.length > 0) {
          const firstUserMsgIndex = contents.findIndex(c => c.role === 'user');
          if (firstUserMsgIndex !== -1) {
            contents[firstUserMsgIndex].parts.unshift(imagePart[0]);
          } else {
            contents.unshift({ role: 'user', parts: imagePart });
          }
        }
      }

      const response: any = await generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction }
      });

      res.json({ reply: response.text, source: "資料來源：藝術家散文與年譜 (RAG模擬)" });
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Failed to generate reply" });
    }
  });

  app.post("/api/generate-journal", async (req, res) => {
    try {
      const { history } = req.body;
      
      const prompt = `請根據以下使用者與AI藝術伴侶的對話紀錄，總結使用者的核心觀點（My Perspective）以及對應的藝術文化脈絡（Cultural Context）。
      
對話紀錄：
${JSON.stringify(history)}

請以這兩個欄位回傳 JSON 格式：
1. "perspective": 一句使用者的核心觀點（字數約20-40字，請用第一人稱，如「我覺得...」）。
2. "context": 結合 RAG 背景知識，給予一段相對應的文化脈絡或藝術賞析（字數約50-80字）。`;

      const response: any = await generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              perspective: { type: "STRING" },
              context: { type: "STRING" }
            }
          }
        }
      });

      let jsonText = response.text || "{}";
      let result = { perspective: "我覺得這是一幅很有趣的畫。", context: "藝術家總是透過作品傳達他的深層思想。" };
      try {
        result = JSON.parse(jsonText);
      } catch (e) {
        console.error("Failed to parse JSON", e);
      }
      
      let generatedImage = null;
      try {
        const imagePrompt = `Generate a minimalist, elegant artistic illustration that visually represents this perspective: "${result.perspective}" and this cultural context: "${result.context}". Focus on the abstract mood. DO NOT include any text, letters, or words in the image. Make it resemble a modern museum exhibition artwork.`;
        
        const imageRes: any = await generateContentWithRetry({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: imagePrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });
        
        if (imageRes && imageRes.candidates && imageRes.candidates[0] && imageRes.candidates[0].content.parts) {
           for (const part of imageRes.candidates[0].content.parts) {
             if (part.inlineData) {
               generatedImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
               break;
             }
           }
        }
      } catch (imgError) {
        console.error("Failed to generate image:", imgError);
      }

      res.json({ ...result, generatedImage });

    } catch (error) {
      console.error("Journal Gen Error:", error);
      res.status(500).json({ error: "Failed to generate journal" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
