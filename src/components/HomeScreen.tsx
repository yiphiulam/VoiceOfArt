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
    <div className="flex flex-col h-full bg-[#FDFCFB] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="p-8 pt-12 flex flex-col items-center text-center">
        <h1 className="text-3xl font-light tracking-[0.2em] uppercase">Voice of Arts</h1>
        <p className="text-[10px] tracking-widest text-gray-400 mt-2 uppercase font-medium">藝術之聲・探索伴侶</p>
      </header>

      {/* Viewfinder Simulator */}
      <div className="flex-1 relative px-8 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
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

      {/* AI Identity Disclosure - Responsible AI */}
      <div className="px-8 mt-8">
        <div className="bg-gray-50 border-l-2 border-gray-300 p-4 flex gap-3 items-start">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mb-1">Responsible AI</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-light">
              本導覽為 AI 輔助的反思伴侶，所有解讀皆由 AI 生成，旨在協助您探索，並非唯一標準答案。
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-8 pb-10 flex flex-col gap-4">
        <button 
          onClick={handleCameraClick}
          className="w-full py-5 bg-[#1A1A1A] text-white flex items-center justify-center gap-3 hover:bg-[#333] transition-colors"
        >
          <Camera className="w-5 h-5" />
          <span className="uppercase tracking-[0.2em] text-xs font-light">拍照掃描</span>
        </button>
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
          onClick={handleUploadClick}
          className="w-full py-5 border border-[#1A1A1A] bg-transparent text-[#1A1A1A] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <ImageUp className="w-5 h-5" />
          <span className="uppercase tracking-[0.2em] text-xs font-light">上傳圖片</span>
        </button>
      </div>
    </div>
  );
}
