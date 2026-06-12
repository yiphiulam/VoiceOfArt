import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ScanLine } from 'lucide-react';

interface Hotspot {
  id: string;
  x: string;
  y: string;
  title: string;
  desc: string;
}

interface ScanningScreenProps {
  base64Image?: string | null;
  onBack?: () => void;
  onComplete?: (hotspots: Hotspot[]) => void;
}

export function ScanningScreen({ base64Image, onBack, onComplete }: ScanningScreenProps) {
  useEffect(() => {
    let isMounted = true;
    
    async function analyzeImage() {
      try {
        if (!base64Image) {
          // Fallback if no image provided, just use timeout
          setTimeout(() => {
            if (isMounted && onComplete) onComplete([]);
          }, 3000);
          return;
        }

        const res = await fetch('/api/analyze-artwork', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image })
        });
        
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        if (isMounted && onComplete) {
          onComplete(data.hotspots || []);
        }
      } catch (err) {
        console.error("VLM Error:", err);
        if (isMounted && onComplete) onComplete([]);
      }
    }

    analyzeImage();
    
    return () => {
      isMounted = false;
    };
  }, [base64Image, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#1A1A1A] text-[#FDFCFB] p-8 text-center font-sans relative overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* Visual Animation Container */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="mb-12 relative"
      >
        <div className="w-40 h-52 border border-white/20 bg-[#2D2D2D]/30 flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <ScanLine className="w-8 h-8 text-white/50 font-light" />
          
          {/* Scanning Line Animation */}
          <motion.div
            animate={{ y: [-104, 104] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-[1px] bg-white opacity-40 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          />
        </div>
      </motion.div>

      {/* RAG & VLM Analysis Context */}
      <h2 className="text-xl font-light tracking-[0.2em] mb-6">AI 正在分析視覺元素...</h2>
      <p className="text-gray-400 text-[11px] tracking-widest max-w-[240px] mx-auto leading-relaxed font-light">
        正在解析作品細節，並透過資料庫與<br/>梁奕焚的《傳統工藝人物系列》進行比對，為您準備專屬的反思問題。
      </p>

      {/* Progress indicators mock */}
      <div className="mt-12 flex gap-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-white/60"
          />
        ))}
      </div>

      {onBack && (
        <button 
          onClick={onBack}
          className="absolute bottom-12 text-gray-500 text-[10px] tracking-[0.2em] hover:text-white transition-colors pb-1 border-b border-gray-600 hover:border-white"
        >
          取消掃描
        </button>
      )}
    </div>
  );
}
