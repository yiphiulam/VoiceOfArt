import { useState, useEffect } from "react";
import { Share2, Download, Home, Check, LoaderCircle, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Message } from "./ReflectionScreen";

interface JournalScreenProps {
  image?: string | null;
  history?: Message[];
  artworkId?: string | null;
  onViewLibrary: () => void;
  onHome: () => void;
}

export function JournalScreen({ image, history, artworkId, onViewLibrary, onHome }: JournalScreenProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [perspective, setPerspective] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [sentiment, setSentiment] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (history && history.length > 0) {
      fetch("/api/generate-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, artworkId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          setPerspective(data.perspective || "");
          setContext(data.context || "");
          setSentiment(data.sentiment || "");
          if (data.generatedImage) {
            setGeneratedImage(data.generatedImage);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [history, artworkId]);

  function getArtworkTitleById(id?: string | null): string {
    switch (id) {
      case '1': return '傳統工藝人物系列';
      case '2': return '藍帽與狗';
      case '3': return '彈撥樂器系列';
      case '4': return '紅椅黑美人';
      case '5': return '琴聲美人';
      case '6': return '紅毯黑美人';
      default: return '自定義作品互動';
    }
  }

  const handleSaveToLibrary = () => {
    if (isSaved) return;

    const savedRecord = {
      id: Date.now().toString(),
      artworkTitle: getArtworkTitleById(artworkId),
      artworkImage: image || "",
      perspective,
      context,
      sentiment,
      generatedImage,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    };

    try {
      const existingStr = localStorage.getItem('voice_of_art_journals');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(savedRecord);
      localStorage.setItem('voice_of_art_journals', JSON.stringify(existing));
      setIsSaved(true);
      handleAction("成功儲存至數位日誌庫！");
    } catch (err) {
      console.error("Failed to save journal to local library:", err);
      handleAction("儲存失敗，請重試");
    }
  };

  const handleAction = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleShare = async () => {
    const shareText = `我的藝術觀點：\n${perspective}\n\n文化脈絡：\n${context}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "我的藝術日誌",
          text: shareText,
          url: window.location.href,
        });
        handleAction("分享成功");
      } catch (error) {
        console.error("Error sharing", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        handleAction("已複製內容至剪貼簿！");
      } catch (err) {
        handleAction("不支援分享");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCFB] text-[#1A1A1A] font-sans relative">
      {/* Header */}
      <header className="px-6 py-6 pt-10 flex items-center justify-between shrink-0">
        <div className="w-8" /> {/* Spacer */}
        <div className="text-center">
          <p className="text-[9px] tracking-[0.2em] uppercase text-gray-400 font-medium mb-1">
            Your Exhibition Insight
          </p>
          <h1 className="text-xl font-light tracking-widest uppercase">
            藝術日誌
          </h1>
        </div>
        <button 
          onClick={onViewLibrary} 
          className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#1A1A1A] flex items-center justify-center shrink-0"
          title="我的日誌庫"
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </header>

      {/* Journal Card Area */}
      <div
        className="flex-1 px-6 pb-2 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <LoaderCircle className="w-8 h-8" />
            </motion.div>
            <p className="text-[10px] uppercase tracking-widest">
              收斂反思中...
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-8"
          >
            {/* Artwork Thumbnail */}
            <div className="w-full aspect-[4/3] bg-[#E0E0E0] relative overflow-hidden mb-6 flex items-center justify-center">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generative Art Thumbnail"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIi8+PC9zdmc+')]"></div>
              )}
            </div>

            {/* Details & Emotion Tag */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase mb-1">
                  Artist & Work
                </h2>
                <p className="text-sm font-medium tracking-wider">我的觀察日誌</p>
              </div>
              {sentiment && (
                <div className="px-2.5 py-1 bg-[#FAF8F5] border border-[#EBE6DD] rounded-full text-[9px] text-[#5C5854] font-medium tracking-wide">
                  情緒：{sentiment}
                </div>
              )}
            </div>

            <div className="w-8 h-[1px] bg-gray-200 mb-6"></div>

            {/* User's Core Perspective */}
            <div className="mb-6 bg-[#F4F1ED] p-5 border-l-2 border-[#1A1A1A]">
              <h3 className="text-[10px] tracking-[0.2em] font-bold text-[#1A1A1A] uppercase mb-2">
                My Perspective
              </h3>
              <p className="text-[13px] font-medium leading-relaxed italic text-[#2D2D2D]">
                「{perspective || "在這次觀察中，我看到了藝術不同的面貌。"}」
              </p>
            </div>

            {/* System's Cultural Context */}
            <div>
              <h3 className="text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase mb-2">
                Cultural Context
              </h3>
              <p className="text-[12px] font-light leading-relaxed text-gray-500 mb-4 whitespace-pre-wrap">
                {context || "藝術品不只是技巧展現，也是對於文化的深刻傳遞。"}
              </p>
              <div className="bg-[#1A1A1A] rounded-md p-4 text-[10px] text-gray-300 leading-relaxed font-light flex items-start gap-3 mt-4">
                <div className="w-1 h-full min-h-[30px] bg-[#B23A30] shrink-0 rounded-full"></div>
                <div>
                  <span className="font-bold text-white uppercase tracking-widest block mb-1.5">
                    RAG insight applied
                  </span>
                  以上脈絡結合了您在對話互動中的討論特徵與藝術家的風格文獻。
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 bg-[#FDFCFB] shrink-0 border-t border-gray-100 flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        
        {/* Save to library button */}
        {!isLoading && (
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaved}
            className={`w-full py-4 text-xs font-bold tracking-[0.25em] uppercase flex items-center justify-center gap-2 transition-colors
              ${isSaved 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-[#B23A30] text-white hover:bg-[#912f27]'
              }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-green-600 animate-pulse" />
                已儲存至我的數位日誌庫
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                儲存至我的數位日誌庫
              </>
            )}
          </button>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleAction("已儲存至相簿")}
            className="flex-1 py-4 border border-[#1A1A1A] text-[#1A1A1A] flex flex-col items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="uppercase tracking-[0.2em] text-[9px] font-bold">
              儲存圖片
            </span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-4 bg-[#1A1A1A] text-white flex flex-col items-center justify-center gap-1.5 hover:bg-[#333] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="uppercase tracking-[0.2em] text-[9px] font-bold">
              分享觀點
            </span>
          </button>
        </div>
        <button
          onClick={onHome}
          className="w-full py-4 text-gray-500 flex items-center justify-center gap-2 hover:text-[#1A1A1A] transition-colors mt-1"
        >
          <Home className="w-4 h-4" />
          <span className="uppercase tracking-[0.2em] text-[10px] font-medium">
            回到首頁
          </span>
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white px-6 py-3 shadow-xl flex items-center gap-2 z-50 whitespace-nowrap"
          >
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-[11px] tracking-wider font-light">
              {toastMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
