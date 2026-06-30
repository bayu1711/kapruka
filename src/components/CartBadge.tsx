import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
interface CartBadgeProps {
  count: number;
  onClick: () => void;
}
export function CartBadge({ count, onClick }: CartBadgeProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{
        scale: 1.05
      }}
      whileTap={{
        scale: 0.95
      }}
      onClick={onClick}
      className={`flex items-center gap-1.5 sm:gap-2 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg transition-colors ${count > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-500/50 hover:bg-emerald-500/70 border border-emerald-500/20'}`}
      title="View Cart"
    >
      
      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-sm sm:text-base font-mono font-semibold">
        {count}
      </span>
    </motion.button>);

}