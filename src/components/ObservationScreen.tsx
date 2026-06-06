import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import type { Hotspot } from '../App';

interface ObservationScreenProps {
  image?: string | null;
  hotspots?: Hotspot[];
  onContinue: () => void;
  onBack?: () => void;
}

export function ObservationScreen({ image, hotspots = [], onContinue }: ObservationScreenProps) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Use dynamic hotspots or fallback to default if none provided
  const displayHotspots = hotspots.length > 0 ? hotspots : [
    {
      id: 'bg',
      x: '25%',
      y: '35%',
      title: '鮮豔的紅色背景',
      desc: '視覺元素分析 (VLM)：\n辦識出強烈的紅色背景。這往往是梁奕焚作品中用以營造東方傳統氛圍與強烈情感張力的標誌性色彩。'
    },
    {
      id: 'figures',
      x: '50%',
      y: '65%',
      title: '特異的人物穿著',
      desc: '視覺元素分析 (VLM)：\n四位人物中，居中者穿著花紋上衣，且是唯一穿著白襪黑鞋的人物，在深色服飾的對比中脫穎而出。'
    },
    {
      id: 'shelf',
      x: '80%',
      y: '45%',
      title: '傳統展示架與物件',
      desc: '視覺元素分析 (VLM)：\n右側有三層木製展示架，上面擺放著傳統民俗玩具，為畫面增添了時空背景的敘事感與生活氣息。'
    }
  ];

  const activeData = displayHotspots.find(h => h.id === activeHotspot);

  return (
    <div className="flex flex-col h-full bg-[#FDFCFB] text-[#1A1A1A] font-sans relative overflow-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent absolute top-0 w-full text-white">
        <div className="flex flex-col">
          <p className="text-[10px] tracking-widest uppercase font-medium opacity-80">Step 02</p>
          <h1 className="text-sm font-light tracking-[0.2em] uppercase mt-1">Slow Looking</h1>
        </div>
      </header>

      {/* Main Image Area */}
      <div className="relative w-full h-[65%] shadow-inner overflow-hidden flex-shrink-0 border-b border-gray-200 bg-[#E0E0E0]">
         {image ? (
            <img src={image} alt="Uploaded Artwork" className="absolute inset-0 w-full h-full object-cover" />
         ) : (
           <div className="absolute inset-0 bg-[#B23A30]">
             {/* Fallback abstract representation */}
             <div className="absolute inset-0 flex items-center justify-center opacity-90 mix-blend-multiply">
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIi8+PC9zdmc+')]"></div>
                <div className="absolute right-[8%] top-[25%] w-20 h-44 border-l-[3px] border-r-[3px] border-[#1A1A1A] flex flex-col justify-evenly">
                  <div className="w-full h-1 bg-[#1A1A1A]"></div>
                  <div className="w-full h-1 bg-[#1A1A1A]"></div>
                  <div className="absolute top-[20%] left-[20%] w-6 h-6 rounded-full border-2 border-[#1A1A1A]"></div>
                  <div className="absolute top-[60%] right-[20%] w-4 h-8 bg-[#1A1A1A]"></div>
                </div>
                <div className="flex items-end gap-1 absolute bottom-[5%] left-[10%]">
                   <div className="w-14 h-40 bg-[#1A1A1A] rounded-t-[2rem]"></div>
                   <div className="w-16 h-[11.5rem] bg-[#1A1A1A] rounded-t-[2rem] relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiI+PGNpcmNsZSBjeD0iNCIgY3k9IjQiIHI9IjIiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
                     <div className="absolute bottom-0 w-full h-6 bg-[#FDFCFB] border-b-4 border-[#1A1A1A]"></div>
                   </div>
                   <div className="w-14 h-40 bg-[#1A1A1A] rounded-t-[2rem]"></div>
                   <div className="w-12 h-36 bg-[#1A1A1A] rounded-t-[2rem]"></div>
                </div>
             </div>
           </div>
         )}

         {/* Hotspots */}
         {displayHotspots.map((spot) => (
           <motion.button
             key={spot.id}
             className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center transition-transform ${activeHotspot === spot.id ? 'scale-110 z-20' : 'z-10'}`}
             style={{ left: spot.x, top: spot.y }}
             onClick={() => setActiveHotspot(spot.id)}
           >
             <span className="absolute inset-0 rounded-full bg-white opacity-40 animate-ping"></span>
             <span className="relative w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] border border-gray-200"></span>
             {activeHotspot === spot.id && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 80, opacity: 1 }}
                 className="absolute top-1/2 left-1/2 w-[1px] bg-white origin-top"
                 style={{ transform: 'translateX(-50%)' }}
               />
             )}
           </motion.button>
         ))}
      </div>

      {/* Observation Hint Card (Always visible unless bottom sheet is up) */}
      <div className="flex-1 px-8 py-8 relative bg-[#FDFCFB]">
        <AnimatePresence>
          {!activeHotspot && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border text-left border-gray-200 p-6 shadow-sm relative w-full"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1A1A1A]"></div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Guide Your Eye
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                {displayHotspots.length > 0 ? (
                  <>注意到了嗎？畫面中已標出 <span className="font-medium text-[#1A1A1A]">{displayHotspots.length}</span> 個視覺元素特徵。<br/><br/></>
                ) : (
                  <>注意到了嗎？畫面中間的人物穿著有花紋的上衣，且是唯一穿著<span className="font-medium text-[#1A1A1A]">白襪黑鞋</span>的人。<br/><br/></>
                )}
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">點擊畫面上的亮點以查看視覺辨識結果。</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sheet for Hotspot */}
      <AnimatePresence>
        {activeHotspot && activeData && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 w-full bg-[#FDFCFB] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100 z-30"
          >
            <div className="p-8 pb-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-gray-400 mb-2 font-medium">VLM Element Found</p>
                  <h3 className="text-lg font-light tracking-widest">{activeData.title}</h3>
                </div>
                <button 
                  onClick={() => setActiveHotspot(null)}
                  className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 text-[#1A1A1A]" />
                </button>
              </div>
              
              <div className="w-8 h-[1px] bg-gray-300 mb-6"></div>

              <p className="text-[13px] text-gray-500 leading-relaxed font-light whitespace-pre-line mb-8 text-left">
                {activeData.desc}
              </p>

              <button 
                onClick={onContinue}
                className="w-full py-5 bg-[#1A1A1A] text-white flex items-center justify-center gap-3 hover:bg-[#333] transition-colors"
              >
                <span className="uppercase tracking-[0.2em] text-xs font-light">進入反思對話</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay background when bottom sheet is open */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveHotspot(null)}
            className="absolute inset-x-0 bottom-0 top-[65%] bg-white/60 backdrop-blur-sm z-20"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
