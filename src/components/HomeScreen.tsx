import React, { useRef } from 'react';
import { Camera, ImageUp, Info } from 'lucide-react';

interface HomeScreenProps {
  onScan: (base64Image?: string) => void;
}

export function HomeScreen({ onScan }: HomeScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onScan(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCFB] text-[#1A1A1A] font-sans relative overflow-hidden">
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-28" style={{ scrollbarWidth: 'none' }}>
        
        {/* Header */}
        <header className="p-8 pt-12 flex flex-col items-center text-center">
          <h1 className="text-3xl font-light tracking-[0.2em] uppercase">Voice of Arts</h1>
          <p className="text-[10px] tracking-widest text-gray-400 mt-2 uppercase font-medium">藝術之聲・探索伴侶</p>
        </header>

        {/* Viewfinder Simulator */}
        <div className="px-8 flex flex-col items-center justify-center w-full max-w-sm mx-auto mb-8">
          <div className="w-full aspect-[4/5] bg-[#F4F1ED] border border-gray-100 shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute inset-0 border-[16px] border-white/40 pointer-events-none" />

            {/* Scanner corner accents indicating focus */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white" />

            <div className="w-24 h-32 mb-6 bg-[#C4A484] shadow-md flex items-center justify-center">
               <span className="text-[6px] text-[#2D2D2D] opacity-40 uppercase tracking-[0.3em] font-serif italic rotate-90 whitespace-nowrap">Liang Yi-fen</span>
            </div>

            <p className="text-xs tracking-[0.4em] uppercase text-gray-400 z-10">請將作品對準框內</p>
            <p className="text-[10px] text-gray-400 mt-2 z-10 font-light">如：梁奕焚《傳統工藝人物系列》</p>
          </div>
        </div>

        {/* About the Artist Section */}
        <section className="px-8 mb-8">
          <div className="border-t border-gray-200 pt-8 text-left">
            <p className="text-[9px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-2">Artist Profile</p>
            <h2 className="text-sm font-bold tracking-[0.15em] mb-4 text-[#1A1A1A] uppercase">關於藝術家・梁奕焚</h2>
            
            <div className="space-y-4 text-xs text-gray-500 leading-relaxed font-light">
              <p>
                梁奕焚（1937年生於台灣彰化），是台灣現代藝術的先驅之一。他早年師從李仲生教授研究現代藝術，並發起創立了「李仲生現代藝術基金會」。
              </p>
              
              {/* Quote block */}
              <div className="bg-[#F4F1ED] p-4 border-l-2 border-[#1A1A1A] my-4">
                <p className="font-serif italic text-gray-600 text-[11px] leading-relaxed">
                  「藝術是屬於精神和心靈的，不應該受到現實與自然，和陳舊的傳統形式所限制。畫家能夠從『真我』的個性來創作，是我人生的大幸。」
                </p>
                <span className="block text-[9px] text-gray-400 mt-1.5 tracking-wider text-right">— 梁奕焚自序</span>
              </div>

              <p>
                1987年，50歲的梁奕焚常住紐約SOHO區，在國際藝術競技場中憑藉獨特畫風站穩腳跟，成為首位連年在SOHO同一畫廊舉辦個展的亞洲藝術家。
              </p>

              <p>
                2005年，69歲的他移居台東都蘭，親力親為打造「秘園」與「大方屋」，在太平洋的大山大海下展開全新的藝術與生活實踐。其作品融合東方傳統工藝色彩與西洋現代空間結構，以『嘿！美人』、『吾土吾民』與『意象萬象』等系列享譽國際。
              </p>
            </div>
          </div>
        </section>

        {/* AI Identity Disclosure - Responsible AI */}
        <div className="px-8 mb-6">
          <div className="bg-gray-50 border-l-2 border-gray-300 p-4 flex gap-3 items-start text-left">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-1">Responsible AI</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-light">
                本導覽為 AI 輔助的反思伴侶，所有解讀皆由 AI 生成，旨在協助您探索，並非唯一標準答案。
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Floating Action Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-6 flex gap-4 z-20 shadow-[0_-10px_35px_rgba(0,0,0,0.05)]">
        
        <input 
          type="file" 
          ref={cameraInputRef} 
          onChange={handleFileChange} 
          accept="image/*"
          capture="environment"
          className="hidden" 
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        <button 
          onClick={handleCameraClick}
          className="flex-1 py-4 bg-[#1A1A1A] text-white flex items-center justify-center gap-2.5 hover:bg-[#333] transition-colors shadow-sm"
        >
          <Camera className="w-4 h-4" />
          <span className="uppercase tracking-[0.2em] text-[11px] font-medium">拍照掃描</span>
        </button>

        <button 
          onClick={handleUploadClick}
          className="flex-1 py-4 border border-[#1A1A1A] bg-white text-[#1A1A1A] flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ImageUp className="w-4 h-4" />
          <span className="uppercase tracking-[0.2em] text-[11px] font-medium">上傳圖片</span>
        </button>
      </div>
    </div>
  );
}
