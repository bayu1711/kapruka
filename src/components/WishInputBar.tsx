import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

interface WishInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
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
  disabled
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
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
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
    </motion.div>
  );
}