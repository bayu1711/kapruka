import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import type { HistorySnapshot } from '../hooks/useWishTree';

interface WishInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  history?: HistorySnapshot[];
  onHistoryClick?: (index: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onRandomize?: () => void;
  hasMorePages?: boolean;
  hasPrevPages?: boolean;
}

/** A small tree SVG used as the loading indicator on the send button */
function TreeSpinner() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      animate={{ rotate: [0, 0, 15, -15, 10, -10, 5, -5, 0] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Trunk */}
      <rect x="10.5" y="17" width="3" height="5" rx="1" fill="white" opacity="0.9" />
      {/* Bottom layer */}
      <polygon points="12,11 5,20 19,20" fill="white" opacity="0.75" />
      {/* Middle layer */}
      <polygon points="12,6 6.5,15 17.5,15" fill="white" opacity="0.88" />
      {/* Top layer */}
      <polygon points="12,2 8,10 16,10" fill="white" />
      {/* Glowing star on top */}
      <motion.circle
        cx="12"
        cy="2"
        r="1.5"
        fill="#6ee7b7"
        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

export function WishInputBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  history,
  onHistoryClick,
  onNextPage,
  onPrevPage,
  onRandomize,
  hasMorePages,
  hasPrevPages,
}: WishInputBarProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled && !loading) {
      setLoading(true);
      onSubmit();
      // Reset loading after the stage transition animation (~800ms)
      setTimeout(() => setLoading(false), 900);
    }
  };

  const isLoading = loading && !disabled;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className="fixed bottom-4 sm:bottom-8 inset-x-0 z-50 flex justify-center px-4"
    >
      <div className="w-full max-w-2xl flex flex-col items-end">
        {/* History Log */}
        {history && history.length > 0 && (
          <div className="w-full flex flex-col items-end gap-2 px-2 max-h-40 overflow-y-auto mb-4 no-scrollbar">
            {history.map((snap, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onHistoryClick?.(idx)}
                className="text-right text-sm text-white/50 hover:text-white/80 transition-colors bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 max-w-[80%] break-words"
              >
                {snap.query}
              </button>
            ))}
          </div>
        )}

        {/* Action Chips */}
        {(hasPrevPages || hasMorePages || onRandomize) && (
          <div className="w-full flex flex-wrap justify-end items-center gap-2 px-2 mb-3">
            {hasPrevPages && (
              <button
                type="button"
                onClick={onPrevPage}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous items
              </button>
            )}
            {hasMorePages && (
              <button
                type="button"
                onClick={onNextPage}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 transition-colors"
              >
                Load more items
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onRandomize && (
              <button
                type="button"
                onClick={onRandomize}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100 bg-emerald-500/20 hover:bg-emerald-500/40 backdrop-blur-md border border-emerald-500/30 rounded-full px-3 py-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Show me something else
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 pr-12 sm:pr-14 bg-transparent text-white placeholder:text-white/40 font-heading text-base sm:text-lg outline-none"
          />
          <button
            type="submit"
            disabled={!value.trim() || disabled || isLoading}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.span
                  key="tree"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <TreeSpinner />
                </motion.span>
              ) : (
                <motion.span
                  key="arrow"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
        </form>
      </div>
    </motion.div>
  );
}