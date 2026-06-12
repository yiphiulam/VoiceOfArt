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

  const OFFLINE_DIALOGUES: Record<string, string[]> = {
    '1': [
      "你好，我是梁奕焚。你看我這幅《傳統工藝人物系列》，畫中鮮亮的朱紅背景和這幾位樸拙的人物。當你第一眼看到這幅作品時，最先吸引你的是哪個人物的姿態，或者哪種色彩？",
      "原來這個細節最先觸動了你。我當年在畫這幅畫時，特意用大面朱砂紅作為底色，這是我們傳統工藝（像是漆器、年畫）常有的顏色。你看這幾個人物的比例和衣著，有沒有讓你想起些什麼鄉土的記憶？",
      "這份鄉愁與純粹的記憶，正是我想在畫中表達的。畢卡索曾說過，他是上帝，他在創造；而我覺得，繪畫就是展現人與生俱來的天份與溫情。感謝你與我的分享，這段話非常珍貴，讓我們一起將它記錄在日誌中吧。",
      "哈哈，聽你說這些，我彷彿又回到了當初隨心所欲塗抹色彩的日子。創作是靈魂的對話，你對我的畫作還有什麼想聊聊的嗎？"
    ],
    '2': [
      "你好，我是梁奕焚。這幅《藍帽與狗》是我非常喜愛的作品。你看這人頭戴醒目的藍色帽子，身旁依偎著小狗。當你靜靜凝視這幅畫時，你能感受到畫中人與小狗之間，是一種什麼樣的情感流動？",
      "你說得真好，那種無聲的陪伴與默契確實是這幅畫的核心。藍色帽子在溫暖的背景中是一種冷調的平衡。你覺得，小狗的存在，是不是讓畫面多了一份人間的煙火氣與溫情？",
      "是啊，常民生活的瑣碎與溫暖，一直是我創作的養分。我在都蘭太平洋的大山大海下生活時，也常感受到這種萬物相依的寧靜。心靈的共鳴比什麼都重要，我們一起把這份感受寫入你的藝術日誌吧。",
      "看來我們在心靈上非常有共鳴。對於這幅畫的線條或色彩，你還有其他看法嗎？"
    ],
    '3': [
      "你好，我是梁奕焚。這幅《彈撥樂器系列》是我用音樂與繪畫交融的嘗試。你看主角懷抱樂器的姿態。當你聽著畫中的『琴聲』，你腦海中浮現的是一首輕快的曲子，還是沉靜憂傷的旋律？",
      "很有意思的旋律想像。畫中流暢的黑色線條勾勒出專注的側臉，我畫她的時候，心中確實追求著一種如同傳統菩薩法相般的平和與神聖。你覺得這大片黃橙光暈，為這首曲子鋪陳了怎樣的氛圍？",
      "這種氛圍正如你所說，是沉靜而純粹的。藝術能讓人的精神超越現實的限制，找到真我的個性。能遇到懂我畫中琴聲的知音是種緣分，讓我們將你的這份琴聲記憶存入日誌中吧。",
      "琴音裊裊，心意相通。還有什麼關於彈奏姿態或色彩的感受，想跟我分享的嗎？"
    ],
    '4': [
      "你好，我是梁奕焚。這是我的代表性主題之一《紅椅黑美人》。黑美人坐在亮麗的朱紅木椅上，極具視覺震撼。當你第一眼面對這個純黑的身軀與強烈的紅椅對比時，你感受到的是一種壓抑，還是一種傲然自信的力量？",
      "你的感受非常敏銳。我畫黑美人，是用純黑去挑戰傳統對人體白皙的審美偏見，展現原始純粹的生命力。朱紅的座椅與純黑的身軀相撞，正是靈魂生命能的釋放。這幅畫的構圖與色彩，還讓你聯想到什麼？",
      "確實，這種強烈的對比正是生命的本質。我五十歲在紐約SOHO常駐創作時，就是在這種多元文化碰撞中找到了我的天命。謝謝你對我筆下黑美人的欣賞，讓我們把這份生命的張力記錄在你的反思日誌裡。",
      "哈哈，真高興看到你從我的黑美人中讀出這麼多故事。藝術不應該受限，你還有什麼其他感受嗎？"
    ],
    '5': [
      "你好，我是梁奕焚。歡迎來到《琴聲美人》的音樂世界。女子低頭專注彈奏，黑白琴鍵在身前延伸。當你看到她低頭的背影與彈奏的雙手，你覺得她是在為自己演奏，還是在為某個遠方的人訴說心聲？",
      "這是一個非常動人的詮釋。畫中地毯的花紋融入了東方傳統色彩，與鋼琴的現代幾何結構交錯。我畫她時，想捕捉的正是一種陶醉於自我的純粹精神。你覺得這種琴聲是否也觸動了你心底的某些往事？",
      "音樂和繪畫都是心靈的避難所，能幫我們釋放最真實的情感。你的理解很深刻，這幅畫能遇到你這樣的觀賞者，我很欣慰。讓我們將這份裝飾性的地毯與琴音寫入日誌吧。",
      "音符隨色彩在畫面上跳躍，很高興能與你在這個空間交流。還有什麼想對我說的嗎？"
    ],
    '6': [
      "你好，我是梁奕焚。你看這幅《紅毯黑美人》，黑美人斜臥在紅毯上，背景是無數粉白斑點組成的星空夜雨。你覺得，背景中那些落英繽紛的斑點，為躺在紅毯上的美人營造了什麼樣的心境？",
      "你說得對，那確實是一種浪漫、悠閒卻又帶點孤獨與鄉愁的夢幻心境。當年在紐約SOHO創作黑美人與吾土吾民系列時，我的內心確實時常湧現對故土故民的思念。你看下方的紅毯花紋，是不是也帶著一絲東方的熟悉感？",
      "沒錯，那種刻在骨子裡的鄉愁，是我們共同的文化記憶，也是我的作品能在紐約走上國際風格的靈魂所在。人的一生都在追求精神的真我。很開心我們有這場深入的靈魂對話，讓我們一起把這份感受寫入你的反思日誌吧。",
      "在都蘭太平洋的星空下，我也常這樣看著夜空。你能感受到我畫裡的溫度，這對我來說就是最大的回報。你還有什麼其他感受想分享嗎？"
    ],
    'custom': [
      "你好，我是梁奕焚。很高興你能帶來這幅畫與我分享。藝術是心靈的對話，當你靜靜凝視這幅作品時，最先打動你的是它的色彩，還是線條的律動？",
      "原來這個元素最先吸引了你。在藝術創作中，每一筆線條和每一塊顏色都是靈魂在紙上的投射。看著這幅作品，你覺得作者在創作它時，心中是平靜愉悅的，還是波濤湧現的？",
      "你的直覺非常敏銳。藝術就是真我個性的流露，每個人都有感受美的天賦。感謝你帶這幅作品來與我交流心靈，這是一段很美好的時光，讓我們一起把這段對話記錄到日誌中吧。",
      "哈哈，真高興我們能對這幅作品聊得這麼深入。藝術沒有唯一的答案，只有心靈的感應。你還有其他感觸嗎？"
    ]
  };

  app.post("/api/reflection-chat", async (req, res) => {
    try {
      const { base64Image, history, hotspots, artworkId } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not configured. Running offline dialogue script.");
        
        const artId = artworkId || 'custom';
        const dialogue = OFFLINE_DIALOGUES[artId] || OFFLINE_DIALOGUES['custom'];
        
        let replyText = dialogue[0];
        const historyLen = history ? history.length : 0;
        
        if (historyLen === 2) {
          replyText = dialogue[1];
        } else if (historyLen === 4) {
          replyText = dialogue[2];
        } else if (historyLen >= 6) {
          replyText = dialogue[3];
        }
        
        return res.json({ 
          reply: replyText, 
          source: "本地離線引導劇本" 
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
