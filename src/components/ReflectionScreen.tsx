import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Hotspot } from '../App';
import liangAvatar from '@/assets/liang_yifen_avatar.png';

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  source?: string;
}

interface ReflectionScreenProps {
  image?: string | null;
  hotspots?: Hotspot[];
  artworkId?: string | null;
  onBack: () => void;
  onFinish: (history: Message[]) => void;
}

export function ReflectionScreen({ image, hotspots, artworkId, onBack, onFinish }: ReflectionScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCitation, setShowCitation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    let isMounted = true;
    if (messages.length === 0) {
      setIsTyping(true);
      fetch('/api/reflection-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: image, hotspots, artworkId, history: [] })
      })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setMessages([{
          id: 'msg-[init]',
          sender: 'ai',
          text: data.reply || '您好！這幅作品充滿了獨特的氛圍。您覺得畫面中最吸引你目光的地方在哪裡？',
          source: data.source
        }]);
        setIsTyping(false);
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setIsTyping(false);
      });
    }
    return () => { isMounted = false; };
  }, [image, hotspots, messages.length, artworkId]);

  const handleSend = async (customText?: string) => {
    const textToSend = typeof customText === 'string' ? customText : inputText;
    if (!textToSend.trim()) return;
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/reflection-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base64Image: image, 
          hotspots, 
          artworkId,
          history: updatedMessages 
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || '很有趣的觀點！藝術品總能帶給我們不同的感受。',
        source: data.source
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '抱歉，我的反思引擎遇到一點網路狀況，請稍後再試。'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCFB] text-[#1A1A1A] font-sans relative">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-[#FDFCFB] z-10 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#EBE6DD] bg-[#FAF8F5]">
            <img src={liangAvatar} alt="梁奕焚老師" className="w-full h-full object-cover scale-105" />
          </div>
          <div className="text-left">
            <h1 className="text-xs font-bold text-[#1A1A1A] tracking-wider">與梁奕焚老師對話</h1>
            <p className="text-[9px] tracking-widest text-gray-400 font-medium">藝術與心靈的對話</p>
          </div>
        </div>
        <div className="w-9" /> {/* Spacer for centering/aligning */}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 scroll-smooth bg-[#FDFCFB]">
        
        {/* Welcome Card from Teacher Liang */}
        <div className="bg-[#FAF8F5] border border-[#EBE6DD] p-5 rounded-2xl flex gap-4 items-center mb-2 shadow-sm text-left">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#1A1A1A]/10 bg-white flex-shrink-0">
            <img src={liangAvatar} alt="梁奕焚老師" className="w-full h-full object-cover scale-105" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-[#1A1A1A] mb-1">關於這幅作品...</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-light">
              「很高興在這裡遇見你。藝術屬於我們的心靈。對這幅畫作有什麼感受，儘管與我聊聊。」
            </p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 w-full ${msg.sender === 'user' ? 'flex-row-reverse items-start' : 'flex-row items-start'}`}
            >
              {msg.sender === 'ai' ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#EBE6DD] bg-white flex-shrink-0 shadow-sm">
                  <img src={liangAvatar} alt="梁奕焚老師" className="w-full h-full object-cover scale-105" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#2C2A29] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                  你
                </div>
              )}

              <div className={`flex flex-col max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-400 font-bold mb-1 tracking-wider">
                  {msg.sender === 'ai' ? '梁奕焚 老師' : '我'}
                </span>
                
                <div 
                  className={`p-4 text-[13px] font-light leading-relaxed shadow-sm whitespace-pre-wrap rounded-2xl
                    ${msg.sender === 'user' 
                      ? 'bg-[#2C2A29] text-white rounded-tr-sm' 
                      : 'bg-[#FAF8F5] border border-[#EBE6DD] text-[#2D2D2D] rounded-tl-sm'
                    }`}
                >
                  {msg.text}
                </div>
                
                {/* Context Citation Link (RAG) */}
                {msg.source && (
                  <button 
                    onClick={() => setShowCitation(true)}
                    className="mt-2 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity text-left"
                  >
                    <Info className="w-3 h-3 shrink-0 text-gray-400" />
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider underline underline-offset-2">{msg.source}</p>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex gap-3 items-start w-full"
             >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#EBE6DD] bg-white flex-shrink-0 shadow-sm">
                  <img src={liangAvatar} alt="梁奕焚老師" className="w-full h-full object-cover scale-105" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[9px] text-gray-400 font-bold mb-1 tracking-wider">梁奕焚 老師正在思考...</span>
                  <div className="bg-[#FAF8F5] border border-[#EBE6DD] px-5 py-4 rounded-2xl rounded-tl-sm flex gap-1.5 shadow-sm h-12 items-center">
                    <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-6 pb-8 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] pl-6 pr-6">
        
        {/* Quick Options - generic */}
        {messages.length === 1 && !isTyping && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            <button 
              onClick={() => handleSend('我感覺充滿了寧靜的心情')}
              className="whitespace-nowrap px-4 py-2 bg-gray-50 border border-gray-200 text-[#1A1A1A] text-[11px] font-medium tracking-wide rounded-full hover:bg-gray-100 transition-colors"
            >
              感覺很寧靜
            </button>
            <button 
              onClick={() => handleSend('色彩給我很強烈的對比感')}
              className="whitespace-nowrap px-4 py-2 bg-gray-50 border border-gray-200 text-[#1A1A1A] text-[11px] font-medium tracking-wide rounded-full hover:bg-gray-100 transition-colors"
            >
              強烈的色彩對比
            </button>
          </div>
        )}

        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="我的解讀 / 我有不同看法..."
            className="w-full bg-[#F4F1ED] border border-gray-200 text-[13px] px-5 py-4 pr-14 rounded-full font-light focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-all placeholder:text-gray-400"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!inputText.trim() && !isTyping}
            className="absolute right-2 p-2.5 bg-[#1A1A1A] text-white rounded-full disabled:opacity-30 disabled:bg-gray-400 hover:bg-[#333] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* End Button */}
        <AnimatePresence>
          {messages.length > 2 && !isTyping && (
            <motion.div 
               initial={{ opacity: 0, height: 0, marginTop: 0 }}
               animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
               className="flex justify-center"
            >
              <button 
                  onClick={() => onFinish(messages)}
                  className="w-full py-4 border border-[#1A1A1A] bg-transparent text-[#1A1A1A] text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-gray-50 transition-colors"
              >
                  結束並生成日誌
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RAG Citation Modal */}
      <AnimatePresence>
        {showCitation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40 flex items-end justify-center p-0"
            onClick={() => setShowCitation(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#FDFCFB] w-full h-[70%] rounded-t-3xl p-8 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-1">RAG Knowledge Base</p>
                  <h3 className="text-sm font-light tracking-widest uppercase">文獻資料庫</h3>
                </div>
                <button onClick={() => setShowCitation(false)} className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                  <X className="w-4 h-4 text-[#1A1A1A]" />
                </button>
              </div>
              
              <div className="w-8 h-[1px] bg-gray-300 mb-6 shrink-0"></div>

              <div className="overflow-y-auto flex-1 pr-2 pb-4 text-[13px] font-light text-gray-600 leading-relaxed" style={{ scrollbarWidth: 'none' }}>
                <div className="mb-6 flex items-start gap-3 bg-gray-50 p-4 border border-gray-100 rounded-lg">
                  <div className="w-8 h-10 bg-[#B23A30] shrink-0 shadow-sm flex items-center justify-center">
                    <span className="text-[5px] text-white/50 tracking-widest break-all px-1 leading-none text-center">PDF</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] mb-1 tracking-wider text-xs">梁奕焚 1991-2021 三十年創作回顧</h4>
                    <p className="text-[10px] text-gray-400 tracking-wider">擷取自藝術家自傳與手稿 (Artistic DNA of Liang Yi-fen)</p>
                  </div>
                </div>

                <div className="pl-5 border-l-2 border-[#1A1A1A] space-y-6">
                  <div>
                    <h5 className="text-[10px] tracking-widest text-[#1A1A1A] font-bold uppercase mb-2">關於常民生活</h5>
                    <p className="italic text-gray-500">
                      「從夏迦爾的畫作，看到素樸的俄國農村生活，和農事的操作... 我的黑美人畫作，和我記憶中的故土故民，都是在紐約居停的十多年間誕生的，這些作品對我多少抒發了些許的思鄉情懷... 我的繪畫作品形式，能夠成為所謂的國際風格，就是因為畫裡表現著大家共有的鄉愁文化。」
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] tracking-widest text-[#1A1A1A] font-bold uppercase mb-2">藝術與創作精神</h5>
                    <p className="italic text-gray-500">
                      「藝術家之所以為藝術家，不只是因為他們在工作，在畫；正像人活著，不只是為了吃，為了那一頓飽。因此，畢卡索才會說：『我是上帝，我在創造！』」
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] tracking-widest text-[#1A1A1A] font-bold uppercase mb-2">作品的原始性與純粹</h5>
                    <p className="italic text-gray-500">
                      「原始性的藝術，就是在展現人與生俱來的天賦... 人人皆具有藝術的天份和保有藝術的種子。否則，人活著，就不會注意美醜，不會去眷愛美的事物。」
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
