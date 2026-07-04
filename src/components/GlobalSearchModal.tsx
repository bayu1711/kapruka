import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Session } from '../hooks/useWishTree';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onSelectSession: (index: number) => void;
  currentSessionIndex: number;
}

export function GlobalSearchModal({ isOpen, onClose, sessions, onSelectSession, currentSessionIndex }: GlobalSearchModalProps) {
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
    const title = firstQuery ? firstQuery : `Conversation ${index + 1}`;
    
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
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-[#2a1b4d] rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[70vh]"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-purple-300" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="flex-1 bg-transparent text-white placeholder-purple-300/50 outline-none text-lg"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-purple-300/50">
                  No conversations found matching "{searchQuery}"
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredSessions.map(({ session, index, title }) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(index);
                        onClose();
                      }}
                      className={`flex items-start gap-3 p-4 rounded-xl text-left transition-all ${
                        index === currentSessionIndex
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${index === currentSessionIndex ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-purple-300/70'}`}>
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{title}</div>
                        <div className="text-sm text-purple-300/60 mt-1 flex items-center gap-3">
                          <span>{session.history.length} messages</span>
                          {index === currentSessionIndex && (
                            <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
