import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import type { Hotspot } from '../App';

interface ObservationScreenProps {
  image?: string | null;
  hotspots?: Hotspot[];
  artworkId?: string | null;
  onContinue: () => void;
  onBack?: () => void;
}

const ARTWORK_FALLBACKS: Record<string, Hotspot[]> = {
  '1': [
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
  ],
  '2': [
    {
      id: 'blue_hat',
      x: '45%',
      y: '20%',
      title: '顯眼的藍色帽子',
      desc: '視覺元素分析 (VLM)：\n主角頭戴鮮明飽和的藍色帽子，成為畫面的視覺焦點，與背景溫暖色系形成冷暖平衡。'
    },
    {
      id: 'dog',
      x: '70%',
      y: '75%',
      title: '依偎的寵物小狗',
      desc: '視覺元素分析 (VLM)：\n身旁描繪了一隻溫順的小狗，流露出人與動物和諧相處的溫馨生活情調，增添常民生活的溫情。'
    },
    {
      id: 'posture',
      x: '35%',
      y: '50%',
      title: '簡約的肢體線條',
      desc: '視覺元素分析 (VLM)：\n人物線條圓潤且極度簡化，融合了立體派的空間重組與東方傳統寫意神韻。'
    }
  ],
  '3': [
    {
      id: 'instrument',
      x: '50%',
      y: '55%',
      title: '懷抱的彈撥樂器',
      desc: '視覺元素分析 (VLM)：\n主角雙手環抱著傳統樂器，彈奏的姿態營造出聽覺與視覺交融的詩意氛圍。'
    },
    {
      id: 'yellow_light',
      x: '20%',
      y: '30%',
      title: '溫暖的黃橙光暈',
      desc: '視覺元素分析 (VLM)：\n暖黃色調的背景散發著沉靜的藝術氣質，烘托出彈琴者專注而和諧的心境。'
    },
    {
      id: 'face',
      x: '48%',
      y: '22%',
      title: '側臉線條與留白',
      desc: '視覺元素分析 (VLM)：\n以乾淨的黑線勾勒出的側臉，造型神似傳統佛像的平和法相，神聖而純粹。'
    }
  ],
  '4': [
    {
      id: 'black_beauty',
      x: '50%',
      y: '45%',
      title: '自信傲然的黑美人',
      desc: '視覺元素分析 (VLM)：\n畫中女性以純黑膚色呈現，輪廓大膽有力，顛覆傳統審美，展現極具現代張力的女性軀體。'
    },
    {
      id: 'red_chair',
      x: '42%',
      y: '70%',
      title: '鮮亮的朱紅座椅',
      desc: '視覺元素分析 (VLM)：\n黑美人坐於朱紅木椅上，鮮明對比的色彩撞擊，釋放出強烈的生命動能與舞台感。'
    },
    {
      id: 'carpet',
      x: '75%',
      y: '85%',
      title: '裝飾性的底座線條',
      desc: '視覺元素分析 (VLM)：\n椅腳下的幾何毯面結構，融合野獸派的純粹色彩與東方民俗圖案的點綴。'
    }
  ],
  '5': [
    {
      id: 'piano_strings',
      x: '60%',
      y: '60%',
      title: '琴鍵與線條律動',
      desc: '視覺元素分析 (VLM)：\n畫中女子身前橫臥著鋼琴或琴弦結構，黑白線條流瀉出音樂律動，與人物動態呼應。'
    },
    {
      id: 'pose',
      x: '35%',
      y: '35%',
      title: '專注的演奏姿態',
      desc: '視覺元素分析 (VLM)：\n女子低頭彈奏，手臂線條流暢延伸，勾勒出陶醉於音樂世界的優雅身形。'
    },
    {
      id: 'background_contrast',
      x: '20%',
      y: '75%',
      title: '民俗圖案與背景交界',
      desc: '視覺元素分析 (VLM)：\n背景與地面交界處飾有東方傳統工藝色彩的花紋，營造出豐富的層次質感與空間層次。'
    }
  ],
  '6': [
    {
      id: 'bg_dots',
      x: '40%',
      y: '25%',
      title: '星夜與花雨般的背景',
      desc: '視覺元素分析 (VLM)：\n黑色背景中綴滿了粉紅、白色與黃色的斑點，猶如繁星夜空或落英繽紛，營造出浪漫而夢幻的意境。'
    },
    {
      id: 'reclining_body',
      x: '65%',
      y: '80%',
      title: '純粹的黑色裸女身軀',
      desc: '視覺元素分析 (VLM)：\n黑美人以極簡的純黑線條與色塊呈現，與背後的繽紛斑點及下方的紅毯形成強烈對比，展現原始純粹的生命力。'
    },
    {
      id: 'yellow_chair',
      x: '78%',
      y: '38%',
      title: '簡練的靠背木椅',
      desc: '視覺元素分析 (VLM)：\n黃白相間的木質靠背椅靜置於畫面一側，其流暢的線條和簡約結構，為畫面增添了空間與生活感的平衡。'
    }
  ]
};

const GENERIC_FALLBACK: Hotspot[] = [
  {
    id: 'custom_color',
    x: '30%',
    y: '40%',
    title: '畫面色彩張力',
    desc: '視覺元素分析 (VLM)：\n畫作中大膽純粹的色彩對比，反映出梁奕焚老師筆下豐沛的情感力量與東方傳統氛圍。'
  },
  {
    id: 'custom_structure',
    x: '65%',
    y: '60%',
    title: '主體構圖與寫意線條',
    desc: '視覺元素分析 (VLM)：\n畫面核心的主體線條或人物輪廓，簡練而傳神，體現了藝術家對純粹美感的追求。'
  }
];

export function ObservationScreen({ image, hotspots = [], artworkId, onContinue }: ObservationScreenProps) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Use dynamic hotspots or fallback to specific artwork details if none provided
  const fallbacks = artworkId && ARTWORK_FALLBACKS[artworkId] 
    ? ARTWORK_FALLBACKS[artworkId] 
    : GENERIC_FALLBACK;

  const displayHotspots = hotspots.length > 0 ? hotspots : fallbacks;

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
      <div className="flex-1 px-8 py-8 relative bg-[#FDFCFB] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
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
            className="absolute bottom-0 left-0 w-full max-h-[85%] overflow-y-auto bg-[#FDFCFB] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100 z-30"
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
