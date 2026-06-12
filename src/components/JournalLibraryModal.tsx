import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavedJournal {
  id: string;
  artworkTitle: string;
  artworkImage: string;
  perspective: string;
  context: string;
  sentiment: string;
  generatedImage?: string | null;
  date: string;
}

interface JournalLibraryModalProps {
  onClose: () => void;
}

export function JournalLibraryModal({ onClose }: JournalLibraryModalProps) {
  const [journals, setJournals] = useState<SavedJournal[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load journals from localStorage
  useEffect(() => {
    const dataStr = localStorage.getItem('voice_of_art_journals');
    if (dataStr) {
      try {
        setJournals(JSON.parse(dataStr));
      } catch (err) {
        console.error("Failed to parse journals history:", err);
      }
    }
  }, []);

  // Delete a journal entry
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("確定要刪除這篇日誌嗎？")) {
      const updated = journals.filter(j => j.id !== id);
      setJournals(updated);
      localStorage.setItem('voice_of_art_journals', JSON.stringify(updated));
      if (expandedId === id) {
        setExpandedId(null);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/40 z-50 flex items-end justify-center p-0"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#FDFCFB] w-full h-[88%] rounded-t-3xl p-6 pb-8 flex flex-col shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-2 text-left">
            <BookOpen className="w-5 h-5 text-[#B23A30]" />
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase text-gray-400 font-bold mb-0.5">My Portfolio</p>
              <h3 className="text-sm font-bold tracking-widest uppercase">我的數位藝術日誌</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 text-[#1A1A1A]" />
          </button>
        </div>

        <div className="w-8 h-[1px] bg-gray-300 mb-4 shrink-0"></div>

        {/* Journal Entries List */}
        <div 
          className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-4" 
          style={{ scrollbarWidth: 'none' }}
        >
          {journals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 gap-3">
              <BookOpen className="w-10 h-10 stroke-1 text-gray-300" />
              <p className="text-xs font-light leading-relaxed max-w-[220px]">
                目前尚無儲存的日誌。探索畫作並完成反思對話，即可生成您的第一篇專屬日誌！
              </p>
            </div>
          ) : (
            journals.map((journal) => {
              const isExpanded = expandedId === journal.id;
              
              return (
                <motion.div
                  key={journal.id}
                  layout="position"
                  onClick={() => setExpandedId(isExpanded ? null : journal.id)}
                  className={`bg-white border text-left cursor-pointer transition-all duration-300 relative overflow-hidden p-5 shadow-sm
                    ${isExpanded ? 'border-[#B23A30] ring-1 ring-[#B23A30]/15' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="flex gap-4 items-start">
                    {/* Generative Art Thumbnail */}
                    <div className="w-14 h-18 bg-neutral-100 shrink-0 overflow-hidden relative border border-gray-100 flex items-center justify-center">
                      {journal.generatedImage ? (
                        <img src={journal.generatedImage} className="w-full h-full object-cover" alt="Generative Art" />
                      ) : (
                        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIi8+PC9zdmc+')]"></div>
                      )}
                    </div>

                    {/* Metadata & Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{journal.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#1A1A1A] tracking-wider truncate mb-2">
                        {journal.artworkTitle}
                      </h4>

                      {/* Emotion analysis pill */}
                      {journal.sentiment && (
                        <span className="inline-block px-2 py-0.5 bg-[#FAF8F5] border border-[#EBE6DD] rounded-full text-[9px] text-[#5C5854] font-medium tracking-wide">
                          情緒：{journal.sentiment}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={(e) => handleDelete(journal.id, e)}
                      className="p-2 text-gray-300 hover:text-red-500 rounded-full hover:bg-gray-50 transition-colors"
                      title="刪除此篇日誌"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expanded Content Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-5 pt-5 border-t border-gray-100 flex flex-col gap-5 overflow-hidden"
                      >
                        {/* Enlarged Generated Artwork */}
                        {journal.generatedImage && (
                          <div className="w-full aspect-square overflow-hidden border border-gray-100 bg-neutral-50 shadow-inner">
                            <img src={journal.generatedImage} className="w-full h-full object-cover" alt="AI Abstract Impression" />
                          </div>
                        )}

                        {/* Takeaway Details */}
                        <div className="bg-[#F4F1ED] p-4 border-l-2 border-[#1A1A1A]">
                          <h5 className="text-[9px] tracking-[0.2em] font-bold text-[#1A1A1A] uppercase mb-1.5">My Perspective (深刻印象)</h5>
                          <p className="text-xs font-medium leading-relaxed italic text-[#2D2D2D]">
                            「{journal.perspective}」
                          </p>
                        </div>

                        {/* RAG Context details */}
                        <div>
                          <h5 className="text-[9px] tracking-[0.2em] font-bold text-gray-400 uppercase mb-1.5">Cultural Context (文化脈絡)</h5>
                          <p className="text-[11px] font-light leading-relaxed text-gray-500">
                            {journal.context}
                          </p>
                          <div className="bg-[#1A1A1A] rounded p-3 text-[9px] text-gray-300 leading-relaxed font-light flex items-center gap-2 mt-3">
                            <Sparkles className="w-3 h-3 text-[#B23A30] shrink-0" />
                            <span>本篇反思脈絡融合了您當時對畫作的觀察與梁奕焚的藝術手稿。</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
