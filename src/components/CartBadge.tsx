import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
interface CartBadgeProps {
  count: number;
  onClick: () => void;
}
export function CartBadge({ count, onClick }: CartBadgeProps) {
  if (count === 0) return null;
  return (
    <motion.button
      initial={{
        scale: 0,
        opacity: 0
      }}
      animate={{
        scale: 1,
        opacity: 1
      }}
      whileHover={{
        scale: 1.05
      }}
      whileTap={{
        scale: 0.95
      }}
      onClick={onClick}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-1.5 sm:gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg transition-colors">
      
      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-sm sm:text-base font-mono font-semibold">
        {count}
      </span>
    </motion.button>);

}