import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface ProductPagerProps {
  start: number;
  pageSize: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}
export function ProductPager({
  start,
  pageSize,
  total,
  onPrev,
  onNext
}: ProductPagerProps) {
  const from = total === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, total);
  const canPrev = start > 0;
  const canNext = start + pageSize < total;
  return (
    <motion.div
      initial={{
        y: 20,
        opacity: 0
      }}
      animate={{
        y: 0,
        opacity: 1
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 30
      }}
      className="fixed bottom-24 sm:bottom-28 inset-x-0 z-40 flex justify-center px-2 sm:px-4">
      
      <div className="flex items-center gap-1 sm:gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-1 py-1 sm:px-2 sm:py-1.5 shadow-2xl">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Prev Items</span>
          <span className="sm:hidden">Prev</span>
        </button>

        <span className="px-1 sm:px-3 text-[10px] sm:text-xs font-mono text-white/60 whitespace-nowrap">
          <span className="hidden sm:inline">Showing </span>
          {from}–{to} of {total}
          <span className="hidden sm:inline"> items</span>
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-semibold text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          
          <span className="hidden sm:inline">Load More Items</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </motion.div>);

}