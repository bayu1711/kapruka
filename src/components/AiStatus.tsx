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
      
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_15px_rgba(52,211,153,0.3)] rounded-full px-4 py-2 sm:px-6 sm:py-3 relative overflow-hidden">
        {/* Cool scanning effect */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="flex-shrink-0 relative z-10">
          
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
        </motion.div>
        <span className="text-xs sm:text-sm font-mono text-white/90 truncate relative z-10">
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {status}
          </motion.span>
        </span>
      </div>
    </motion.div>);

}