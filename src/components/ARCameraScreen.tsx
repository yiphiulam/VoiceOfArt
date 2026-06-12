import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, RefreshCw, Download, Home, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import artwork1 from '@/assets/artwork_1.png';
import artwork2 from '@/assets/artwork_2.jpg';
import artwork3 from '@/assets/artwork_3.png';
import artwork4 from '@/assets/artwork_4.jpg';

interface ARCameraScreenProps {
  onBack: () => void;
}

const FRAMES = [
  { id: '1', name: '紅椅黑美人', image: artwork4, position: 'bottom-right', rotation: '-rotate-3' },
  { id: '2', name: '藍帽與狗', image: artwork2, position: 'bottom-left', rotation: 'rotate-3' },
  { id: '3', name: '彈撥樂人', image: artwork3, position: 'top-right', rotation: '-rotate-2' },
  { id: '4', name: '傳統工藝', image: artwork1, position: 'bottom-center', rotation: 'rotate-0' },
];

export function ARCameraScreen({ onBack }: ARCameraScreenProps) {
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeFrame = FRAMES[activeFrameIndex];

  // Request camera access
  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;

    async function startCamera() {
      setErrorMsg(null);
      try {
        if (localStream) {
          localStream.getTracks().forEach(t => t.stop());
        }
        
        const constraints = {
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 960 }
          },
          audio: false
        };

        const s = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          s.getTracks().forEach(t => t.stop());
          return;
        }

        localStream = s;
        setStream(s);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(err => console.error("Video play error:", err));
        }
      } catch (err: any) {
        console.error("Camera open failed:", err);
        if (active) {
          setErrorMsg("無法開啟相機。請確認您已允許本網頁的相機存取權限。");
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  // Toggle front/back camera
  const handleToggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture photo
  const handleCapture = () => {
    if (isCapturing || !videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 150); // Flash animation duration

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Set canvas size to match video aspect ratio
      const videoW = video.videoWidth || 640;
      const videoH = video.videoHeight || 480;
      canvas.width = videoW;
      canvas.height = videoH;

      // Draw the video frame (mirrored if using front-facing camera)
      if (facingMode === 'user') {
        ctx.save();
        ctx.translate(videoW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, videoW, videoH);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0, videoW, videoH);
      }

      // Load active frame artwork image to draw on canvas
      const artImg = new Image();
      artImg.src = activeFrame.image;
      artImg.onload = () => {
        // Draw the Polaroid-style artwork card in the frame
        const cardW = videoW * 0.35;
        const cardH = cardW * 1.33;
        
        let cardX = videoW - cardW - 30;
        let cardY = videoH - cardH - 30;

        if (activeFrame.position === 'bottom-left') {
          cardX = 30;
          cardY = videoH - cardH - 30;
        } else if (activeFrame.position === 'top-right') {
          cardX = videoW - cardW - 30;
          cardY = 30;
        } else if (activeFrame.position === 'bottom-center') {
          cardX = (videoW - cardW) / 2;
          cardY = videoH - cardH - 35;
        }

        // Draw rotated card shadow/background
        ctx.save();
        ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
        
        let angle = 0;
        if (activeFrame.rotation === '-rotate-3') angle = -3;
        else if (activeFrame.rotation === 'rotate-3') angle = 3;
        else if (activeFrame.rotation === '-rotate-2') angle = -2;
        
        ctx.rotate((angle * Math.PI) / 180);

        // Draw card border (Polaroid style)
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 25;
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);

        // Draw painting image inside
        ctx.shadowColor = 'transparent';
        const imgPadding = cardW * 0.06;
        ctx.drawImage(
          artImg, 
          -cardW / 2 + imgPadding, 
          -cardH / 2 + imgPadding, 
          cardW - (imgPadding * 2), 
          cardH - (imgPadding * 3.5)
        );

        // Write artwork title on the card footer
        ctx.fillStyle = '#1A1A1A';
        ctx.font = `bold ${Math.floor(cardW * 0.075)}px Noto Sans TC, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          activeFrame.name, 
          0, 
          cardH / 2 - (imgPadding * 0.8)
        );

        ctx.restore();

        // Export data URL
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        setIsCapturing(false);
      };
    }
  };

  // Download photo
  const handleDownload = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `voice-of-art-ar-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  // Return overlay position styling class
  const getPositionClass = (pos: string) => {
    switch (pos) {
      case 'bottom-right': return 'bottom-6 right-6';
      case 'bottom-left': return 'bottom-6 left-6';
      case 'top-right': return 'top-6 right-6';
      case 'bottom-center': return 'bottom-8 left-1/2 -translate-x-1/2';
      default: return 'bottom-6 right-6';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] text-white font-sans relative">
      
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/10 z-10 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/50 font-bold mb-0.5">AR Camera</p>
          <h1 className="text-xs font-light tracking-[0.2em] uppercase">與畫作合照</h1>
        </div>
        {stream && !capturedImage ? (
          <button onClick={handleToggleCamera} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* Main Viewfinder / Capture Preview */}
      <div className="flex-1 relative flex items-center justify-center p-6 bg-neutral-950 overflow-hidden">
        
        {/* Hidden Canvas for Merging */}
        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence mode="wait">
          {!capturedImage ? (
            // Live Viewfinder
            <motion.div 
              key="viewfinder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full aspect-[3/4] bg-neutral-900 border border-white/10 shadow-2xl relative overflow-hidden"
            >
              {/* Live Video Stream */}
              {errorMsg ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-neutral-900 text-white/60">
                  <AlertTriangle className="w-8 h-8 text-yellow-500 mb-4" />
                  <p className="text-xs font-light leading-relaxed">{errorMsg}</p>
                </div>
              ) : (
                <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                />
              )}

              {/* Flash effect overlay */}
              {flash && <div className="absolute inset-0 bg-white z-40" />}

              {/* Floating Postcard Overlay */}
              {!errorMsg && (
                <motion.div 
                  key={activeFrame.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute ${getPositionClass(activeFrame.position)} ${activeFrame.rotation} w-28 aspect-[3/4] bg-white p-2 shadow-2xl border border-neutral-200/20 pointer-events-none z-20`}
                >
                  <div className="w-full h-[75%] overflow-hidden bg-neutral-100 mb-2">
                    <img src={activeFrame.image} className="w-full h-full object-cover" alt="Overlay art" />
                  </div>
                  <p className="text-[7.5px] text-neutral-800 text-center font-bold tracking-wider">{activeFrame.name}</p>
                </motion.div>
              )}

              {/* Scanline guideline */}
              <div className="absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            </motion.div>
          ) : (
            // Capture Preview
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full aspect-[3/4] border border-white/20 shadow-2xl relative overflow-hidden"
            >
              <img src={capturedImage} className="w-full h-full object-cover" alt="Captured scene" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Frame Selectors / Action Buttons (Footer) */}
      <div className="p-6 pb-8 bg-neutral-900 shrink-0 flex flex-col gap-5 border-t border-white/5">
        
        {!capturedImage ? (
          // Frame Selector Carousel
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-widest uppercase font-bold text-white/40">選擇合照畫作</span>
              <span className="text-[9px] tracking-widest font-bold text-white/80 uppercase">{activeFrame.name}</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {FRAMES.map((frame, index) => (
                <button
                  key={frame.id}
                  onClick={() => setActiveFrameIndex(index)}
                  className={`flex-shrink-0 w-16 aspect-[3/4] relative border-2 overflow-hidden transition-all ${activeFrameIndex === index ? 'border-white scale-105 shadow-md' : 'border-white/10 opacity-60'}`}
                >
                  <img src={frame.image} className="w-full h-full object-cover" alt="Thumbnail" />
                </button>
              ))}
            </div>

            {/* Shutter Button */}
            <div className="flex justify-center mt-2">
              <button 
                onClick={handleCapture}
                disabled={!!errorMsg || isCapturing}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
              >
                <div className="w-14 h-14 rounded-full border-2 border-neutral-900 bg-white flex items-center justify-center">
                  <Camera className="w-6 h-6 text-neutral-900" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          // Preview Options
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                onClick={() => setCapturedImage(null)}
                className="flex-1 py-4 border border-white/20 bg-transparent text-white text-xs tracking-widest font-medium uppercase hover:bg-white/5 transition-colors"
              >
                重拍
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-4 bg-white text-neutral-900 text-xs tracking-widest font-bold uppercase flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                儲存相片
              </button>
            </div>
            <button
              onClick={onBack}
              className="w-full py-4 text-white/50 text-xs tracking-widest uppercase font-medium hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              回到首頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
