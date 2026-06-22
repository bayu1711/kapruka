import React from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart, Tag } from 'lucide-react';
import type { Product } from '../data/scenario';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (id: string) => void;
}

export function ProductDetailsModal({
  product,
  onClose,
  onAddToCart
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.25)] backdrop-blur-xl z-10 overflow-hidden"
      >
        {/* Soft glowing ambient background blur */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-6 border border-white/5 bg-slate-950">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Category Tag */}
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full w-fit mb-3 border border-emerald-500/20">
          <Tag className="w-3 h-3" />
          <span>{product.category.toUpperCase()}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold font-heading text-white mb-2 leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-xl font-mono text-emerald-400 font-bold mb-6">
          LKR {product.price.toLocaleString()}
        </p>

        {/* Add to Cart button */}
        <button
          onClick={() => {
            onAddToCart(product.id);
            onClose();
          }}
          className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Add to Wishlist / Cart</span>
        </button>
      </motion.div>
    </div>
  );
}
