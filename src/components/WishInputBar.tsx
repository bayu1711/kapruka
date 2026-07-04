import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, RefreshCw, ChevronRight, ChevronLeft, Mic, MicOff, MessageCircleQuestion, ShoppingCart, ListTree } from 'lucide-react';
import type { HistorySnapshot } from '../hooks/useWishTree';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useLanguage } from '../contexts/LanguageContext';
import { Locale } from '../i18n/translations';

interface WishInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (finalValue?: string) => void;
  placeholder: string;
  disabled?: boolean;
  isSearching?: boolean;
  history?: HistorySnapshot[];
  onHistoryClick?: (index: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onRandomize?: () => void;
  hasMorePages?: boolean;
  hasPrevPages?: boolean;
  followUpQuestions?: string[];
  selectedProduct?: any; // We'll type this properly if Product is available
  onAddToCart?: () => void;
  onRemoveFromCart?: () => void;
  isProductInCart?: boolean;
  customTopContent?: React.ReactNode;
  liveCategories?: string[];
  onCategorySelect?: (category: string) => void;
}

/** A small 'U' SVG used as the loading indicator on the send button */
function USpinner() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-4 h-4 sm:w-5 sm:h-5"
    >
      <motion.path
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: [0, 1, 0], pathOffset: [0, 0, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        d="M 6 9 A 6 6 0 0 0 18 9"
        stroke="#FDE047"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
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
  isSearching,
  history,
  onHistoryClick,
  onNextPage,
  onPrevPage,
  onRandomize,
  hasMorePages,
  hasPrevPages,
  followUpQuestions,
  onFollowUpClick,
  selectedProduct,
  onAddToCart,
  onRemoveFromCart,
  isProductInCart,
  customTopContent,
  liveCategories,
  onCategorySelect,
}: WishInputBarProps) {
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const { t } = useLanguage();
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const historyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (transcript) {
      onChange(transcript);
    }
  }, [transcript, onChange]);

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' }); // Or get current locale if we pass it
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() && !listening) return;

    let finalVal = value;
    const activeQuestion = followUpQuestions && followUpQuestions.length > 0 ? followUpQuestions[0] : null;
    if (activeQuestion) {
      finalVal = `Q: ${activeQuestion}\nA: ${value}`;
    }

    setLoading(true);
    await onSubmit(finalVal);
    setLoading(false);
  };

  const isLoadingIndicator = loading || isSearching;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className="absolute bottom-0 inset-x-0 w-full z-50 flex justify-center px-4 pb-4 sm:pb-8 pt-2 pointer-events-none"
    >
      <div className="w-full max-w-2xl flex flex-col items-end relative pointer-events-auto">
        {/* History Log */}
        {history && history.length > 0 && (
          <div 
            ref={historyScrollRef}
            className="absolute bottom-[calc(100%+0.5rem)] right-0 w-full flex flex-col items-end gap-2 px-2 max-h-[20vh] pt-4 overflow-y-auto mb-2 no-scrollbar pointer-events-auto"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 10%, black 40%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 10%, black 40%, black 100%)',
              overscrollBehaviorY: 'contain'
            }}
          >
            {history.map((snap, idx) => {
              let displayQuery = snap.query;
              if (displayQuery.startsWith('Q: ') && displayQuery.includes('\nA: ')) {
                displayQuery = displayQuery.split('\nA: ')[1];
              }
              return (
                <div key={idx} className="flex flex-col w-full mb-2 gap-1">
                  <div className="flex justify-end w-full">
                    <button
                      type="button"
                      onClick={() => onHistoryClick?.(idx)}
                      className="text-right text-sm transition-all backdrop-blur-xl border rounded-2xl px-4 py-2 max-w-[80%] break-words text-white bg-white/30 border-white/40 hover:bg-white/40 shadow-lg"
                    >
                      {displayQuery}
                    </button>
                  </div>
                  {snap.aiStatus && !snap.aiStatus.match(/^Found \d+ (items|results)/) && (
                    <div className="flex justify-start w-full">
                      <div className="text-left text-sm backdrop-blur-xl border rounded-2xl px-4 py-2 max-w-[80%] break-words transition-all text-emerald-50 bg-emerald-700/60 border-emerald-400/50 shadow-lg font-medium">
                        {snap.aiStatus}
                      </div>
                    </div>
                  )}
                  {snap.errorMessage && (
                    <div className="flex justify-end w-full">
                      <div className="text-xs text-red-200 mr-2 px-2.5 py-1.5 bg-red-950/60 backdrop-blur-sm rounded-lg border border-red-500/30 max-w-[80%] text-right break-words">
                        {snap.errorMessage}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {customTopContent && (
          <div className="w-full flex justify-end items-end gap-2 px-2 mb-3 pointer-events-auto">
            {customTopContent}
          </div>
        )}

        {/* Action Chips */}
        <AnimatePresence mode="popLayout">
          {selectedProduct ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="w-full flex justify-between items-end gap-2 px-2 mb-3 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => {
                  if (isProductInCart) {
                    if (onRemoveFromCart) onRemoveFromCart();
                  } else {
                    if (onAddToCart) onAddToCart();
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md border rounded-full px-3 py-1.5 transition-colors shadow-lg ${
                  isProductInCart
                    ? 'bg-yellow-400/90 hover:bg-yellow-400 border-yellow-300 shadow-yellow-400/20 text-[#402970]'
                    : 'bg-emerald-500/80 hover:bg-emerald-500 border-emerald-400 shadow-emerald-500/20 text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {isProductInCart ? 'Added to Cart (Remove)' : 'Add to Cart'}
              </button>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 shadow-lg max-w-[60%] truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">Wishing for: {selectedProduct.name}</span>
              </div>
            </motion.div>
          ) : (
            (hasPrevPages || hasMorePages || onRandomize) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="w-full flex flex-wrap justify-end items-end gap-2 px-2 mb-3"
              >
            <div className="flex flex-wrap gap-2 justify-end">
              {liveCategories && liveCategories.length > 0 && (
                <div className="relative flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCategories(!showCategories)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 bg-blue-500/20 hover:bg-blue-500/40 backdrop-blur-md border border-blue-500/30 rounded-full px-3 py-1.5 transition-colors"
                  >
                    <ListTree className="w-3.5 h-3.5" />
                    Categories
                  </button>
                  <AnimatePresence>
                    {showCategories && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl flex flex-wrap gap-2 max-h-48 overflow-y-auto z-50"
                      >
                        {liveCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setShowCategories(false);
                              onCategorySelect?.(cat);
                            }}
                            className="px-2 py-1 text-xs font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10"
                          >
                            {cat}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {hasPrevPages && (
                <button
                  type="button"
                  onClick={onPrevPage}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t('PREVIOUS')}
                </button>
              )}
              {hasMorePages && (
                <button
                  type="button"
                  onClick={onNextPage}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 transition-colors"
                >
                  {t('LOAD_MORE')}
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
                  {t('RANDOMIZE')}
                </button>
              )}
            </div>
          </motion.div>
            )
          )}
        </AnimatePresence>

        <form onSubmit={handleFormSubmit} className="w-full relative mt-2">

          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={selectedProduct ? `Ask about ${selectedProduct.name} (e.g. warranty, delivery)...` : ((followUpQuestions && followUpQuestions.length > 0) ? followUpQuestions[0] : (placeholder || t('PLACEHOLDER')))}
              disabled={disabled}
              className={`w-full px-4 py-3 sm:px-6 sm:py-4 ${browserSupportsSpeechRecognition ? 'pr-28 sm:pr-32' : 'pr-12 sm:pr-14'} bg-transparent text-white placeholder:text-white/40 font-heading text-base sm:text-lg outline-none`}
            />
            {browserSupportsSpeechRecognition && (
              <div className="absolute right-12 sm:right-16 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors ${listening
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                    }`}
                >
                  {listening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={!value.trim() || disabled || isLoadingIndicator}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isLoadingIndicator ? (
                  <motion.span
                    key="tree"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <USpinner />
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