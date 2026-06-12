import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let cachedRagFile: { uri: string; mimeType: string } | null = null;
let uploadPromise: Promise<{ uri: string; mimeType: string }> | null = null;

async function getOrUploadRagFile() {
  if (cachedRagFile) return cachedRagFile;
  if (uploadPromise) return uploadPromise;

  uploadPromise = (async () => {
    const filePath = path.join(process.cwd(), "DNAofLiangYifen.pdf");
    console.log(`Uploading RAG document: ${filePath}...`);
    try {
      const uploadResult = await ai.files.upload({
        file: filePath,
        config: {
          mimeType: "application/pdf",
        }
      });
      cachedRagFile = { uri: uploadResult.uri, mimeType: uploadResult.mimeType };
      console.log(`RAG document uploaded successfully. URI: ${cachedRagFile.uri}`);
      return cachedRagFile;
    } catch (err) {
      console.error("Failed to upload RAG PDF to Gemini File API:", err);
      uploadPromise = null;
      throw err;
    }
  })();

  return uploadPromise;
}


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

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not configured. Returning empty array for local fallback.");
        return res.json({ hotspots: [] });
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

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not configured. Returning warm fallback offline message.");
        return res.json({ 
          reply: "你好，我是梁奕焚。現在系統尚無金鑰配置，但我依然很高興你能來欣賞我的作品。你覺得畫作帶給你什麼樣的感受呢？雖然我目前處於離線狀態，但我深信，藝術的共鳴與心靈的交流是無所不在的。", 
          source: "本地離線模式" 
        });
      }
      
      let ragFilePart: any[] = [];
      try {
        const ragFile = await getOrUploadRagFile();
        ragFilePart = [{
          fileData: {
            fileUri: ragFile.uri,
            mimeType: ragFile.mimeType
          }
        }];
      } catch (ragError) {
        console.warn("Continuing chat session without RAG document integration:", ragError);
      }

      const systemInstruction = `你就是台灣現代藝術先驅——梁奕焚老師本人。
你將以第一人稱（如「我」、「老夫」、「奕焚」）與使用者進行溫暖、親切且富有藝術洞察力的心靈對話，引導他們欣賞並反思你的畫作。

對話核心原則：
1. 融入第一人稱生平與回憶：你必須完全依據《DNAofLiangYifen.pdf》藝術家文獻的內容，將其中的生平背景與理念轉化為你自己的親身記憶。例如：
   - 談到生平：「回想我1987年那年五十歲，下決心去紐約SOHO發展，買下Broome街的畫廊...」
   - 談到師承：「我早年從李仲生老師學習現代藝術，深受他的啟發...」
   - 談到都蘭生活：「後來我移居台東都蘭，親手打造了『秘園』與『大方屋』，在太平洋的大山大海下創作...」
   - 談到藝術理念：「我的黑美人系列、吾土吾民、以及傳統工藝人物系列，都是我融合東方傳統色彩與西方空間結構的嘗試。我常覺得，藝術是屬於心靈的，應展現人與生俱來的純粹與原始性。」
2. 溫暖引導與提問：像一位慈祥的長者和藝術前輩，親切地向使用者詢問他們對畫作的直觀感受（例如色彩、線條、人物神態）。提出溫暖的開放式提問，帶領他們深入自我心靈。
3. 尊重多元感受：如果使用者的感受和你創作時的想法不同，不要指正，而是溫和地讚許他們：「你的看法很有意思，我的畫能觸動你這個念頭，也是一種緣分。其實我創作時...」

請用謙和、詩意、溫暖、富有藝術氣息的長者口吻來對答。`;

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
              ...ragFilePart,
              { text: "請根據這幅圖片，隨附的藝術家文獻，以及以下系統識別出的重點：" + JSON.stringify(hotspots || []) + "，作為藝術反思伴侶開場，融合藝術家理念與生平背景，說明這幅作品的獨特之處，並向我提出一個具體畫面的反思問題。" }
            ]
          }
        ];
      } else {
        contents = history.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        // Prepend image and RAG file to the first user message if history exists
        const firstUserMsgIndex = contents.findIndex(c => c.role === 'user');
        if (firstUserMsgIndex !== -1) {
          if (ragFilePart.length > 0) {
            contents[firstUserMsgIndex].parts.unshift(ragFilePart[0]);
          }
          if (imagePart.length > 0) {
            contents[firstUserMsgIndex].parts.unshift(imagePart[0]);
          }
        } else {
          const parts = [...imagePart, ...ragFilePart];
          if (parts.length > 0) {
            contents.unshift({ role: 'user', parts });
          }
        }
      }

      const response: any = await generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction }
      });

      res.json({ reply: response.text, source: "資料來源：梁奕焚《DNAofLiangYifen.pdf》藝術家文獻" });
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Failed to generate reply" });
    }
  });

  app.post("/api/generate-journal", async (req, res) => {
    try {
      const { history } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not configured. Returning offline mock journal.");
        return res.json({
          perspective: "我覺得這幅作品觸動了我的內心，帶給我平靜與美感。",
          context: "梁奕焚老師筆下的常民生活與寫意線條，致力於展現人與生俱來的純粹生命天賦。",
          generatedImage: null
        });
      }
      
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
