import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ScanningScreen } from './components/ScanningScreen';
import { ObservationScreen } from './components/ObservationScreen';
import { ReflectionScreen, Message } from './components/ReflectionScreen';
import { JournalScreen } from './components/JournalScreen';
import { ARCameraScreen } from './components/ARCameraScreen';

type ScreenType = 'home' | 'scanning' | 'observation' | 'reflection' | 'journal' | 'ar';

export interface Hotspot {
  id: string;
  x: string;
  y: string;
  title: string;
  desc: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeArtworkId, setActiveArtworkId] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  return (
    <div className="w-full min-h-screen bg-neutral-100 flex items-center justify-center overflow-hidden font-sans">
      {/* Mobile App Container Simulator for Web Preview */}
      <main className="w-full h-[100dvh] sm:h-[844px] sm:max-h-[90vh] sm:max-w-[390px] relative overflow-hidden sm:rounded-[2rem] sm:border-[8px] border-neutral-200 shadow-2xl bg-[#FDFCFB]">
        
        {currentScreen === 'home' && (
          <HomeScreen 
            onScan={(base64?: string, artworkId?: string) => {
              if (base64) setUploadedImage(base64);
              if (artworkId) setActiveArtworkId(artworkId);
              setCurrentScreen('scanning');
            }} 
            onAR={() => setCurrentScreen('ar')}
          />
        )}
        
        {currentScreen === 'scanning' && (
          <ScanningScreen 
            base64Image={uploadedImage}
            onBack={() => setCurrentScreen('home')} 
            onComplete={(foundHotspots) => {
              setHotspots(foundHotspots);
              setCurrentScreen('observation');
            }}
          />
        )}

        {currentScreen === 'observation' && (
          <ObservationScreen 
            image={uploadedImage}
            hotspots={hotspots}
            artworkId={activeArtworkId}
            onBack={() => setCurrentScreen('scanning')}
            onContinue={() => setCurrentScreen('reflection')}
          />
        )}

        {currentScreen === 'reflection' && (
          <ReflectionScreen 
            image={uploadedImage}
            hotspots={hotspots}
            artworkId={activeArtworkId}
            onBack={() => setCurrentScreen('observation')}
            onFinish={(history) => {
              setChatHistory(history);
              setCurrentScreen('journal');
            }}
          />
        )}

        {currentScreen === 'journal' && (
          <JournalScreen 
            image={uploadedImage}
            history={chatHistory}
            onHome={() => {
              setUploadedImage(null);
              setHotspots([]);
              setChatHistory([]);
              setActiveArtworkId(null);
              setCurrentScreen('home');
            }}
          />
        )}

        {currentScreen === 'ar' && (
          <ARCameraScreen onBack={() => setCurrentScreen('home')} />
        )}

      </main>
    </div>
  );
}
