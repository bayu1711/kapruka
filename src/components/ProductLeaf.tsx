import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Product } from '../data/scenario';
interface ProductLeafProps {
  product: Product;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onAddToCart: () => void;
}
export function ProductLeaf({
  product,
  index,
  isSelected,
  onSelect,
  onAddToCart
}: ProductLeafProps) {
  return (
    <motion.div
      initial={{
        scale: 0,
        opacity: 0,
        filter: 'blur(8px)'
      }}
      animate={{
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)'
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: index * 0.15
      }}
      className="absolute cursor-pointer group z-20"
      style={{
        left: `${product.position.x}px`,
        top: `${product.position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={onSelect}>
      
      <div
        className={`
        relative w-32 h-32 rounded-2xl overflow-hidden
        bg-emerald-500/20 backdrop-blur-sm
        border-2 transition-all duration-300
        ${isSelected ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.8)] scale-105' : 'border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.4)] hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]'}
      `}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover relative z-10"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs font-medium text-emerald-100/70 z-0">
          {product.name}
        </div>
        
        {isSelected &&
        <motion.div
          initial={{
            scale: 0
          }}
          animate={{
            scale: 1
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        }
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: -10
        }}
        animate={{
          opacity: isSelected ? 1 : 0,
          y: isSelected ? 0 : -10
        }}
        className="absolute -bottom-20 left-0 right-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3">
        
        <p className="text-sm font-heading font-medium text-white mb-1">
          {product.name}
        </p>
        <p className="text-xs font-mono text-emerald-400 mb-2">
          LKR {product.price.toLocaleString()}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors">
          
          Add to Cart
        </button>
      </motion.div>
    </motion.div>);

}