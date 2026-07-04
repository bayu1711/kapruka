import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, X, Axe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Session } from '../hooks/useWishTree';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onSelectSession: (index: number) => void;
  onDeleteSession: (index: number) => void;
  currentSessionIndex: number;
}

export function GlobalSearchModal({ isOpen, onClose, sessions, onSelectSession, onDeleteSession, currentSessionIndex }: GlobalSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSessions = sessions.map((session, index) => {
    // Generate a title for the session
    const firstQuery = session.history.length > 0 ? session.history[0].query : session.inputValue;
    const title = firstQuery ? firstQuery : `Wish ${index + 1}`;
    
    // Find matching queries in history
    const allText = [
      session.inputValue,
      session.searchQuery,
      ...session.history.map(h => h.query)
    ].join(' ').toLowerCase();

    const isMatch = searchQuery === '' || allText.includes(searchQuery.toLowerCase());
    
    return { session, index, title, isMatch };
  }).filter(item => item.isMatch).reverse(); // Reverse to show newest first

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header & Search Input */}
            <div className="p-6 border-b border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Search className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-2xl font-heading font-bold text-white">
                    Search Wishes
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-white/40 absolute left-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search wishes..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-white placeholder-white/40 outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  No wishes found matching "{searchQuery}"
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredSessions.map(({ session, index, title }) => (
                    <div key={session.id} className="relative group">
                      <button
                        onClick={() => {
                          onSelectSession(index);
                          onClose();
                        }}
                        className={`w-full flex items-start gap-3 p-4 pr-12 rounded-xl text-left transition-all ${
                          index === currentSessionIndex
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${index === currentSessionIndex ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-white/70'}`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate leading-tight">{title}</div>
                          <div className="text-xs text-white/50 mt-1.5 flex items-center gap-2">
                            <span>{session.history.length} messages</span>
                            {index === currentSessionIndex && (
                              <span className="bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(index);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Wish"
                      >
                        <Axe className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
