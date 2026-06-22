import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
interface AiStatusProps {
  status: string;
  show: boolean;
}
export function AiStatus({ status, show }: AiStatusProps) {
  if (!show || !status) return null;
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: 20
      }}
      className="fixed top-24 sm:top-32 left-1/2 -translate-x-1/2 z-40 w-max max-w-[90vw]">
      
      <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 sm:px-6 sm:py-3">
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="flex-shrink-0">
          
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
        </motion.div>
        <span className="text-xs sm:text-sm font-mono text-white/90 truncate">
          {status}
        </span>
      </div>
    </motion.div>);

}