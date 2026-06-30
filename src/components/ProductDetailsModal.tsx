import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart, Tag, ExternalLink, Loader2, Package } from 'lucide-react';
import type { Product } from '../data/scenario';
import { getProduct, type KaprukaMCPProduct } from '../lib/kapruka-mcp';
import { DeliveryChecker } from './DeliveryChecker';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (id: string) => void;
}

export function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailsModalProps) {
  const [details, setDetails] = useState<KaprukaMCPProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!product) {
      setDetails(null);
      return;
    }

    if (product.details) {
      // If we already background-cached the details, use them instantly
      setDetails(product.details);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    getProduct(product.id)
      .then((d) => {
        setDetails(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[MCP] getProduct failed:', err);
        setError('Could not load full details.');
        setLoading(false);
      });
  }, [product]);

  if (!product) return null;

  // Merge: prefer live details, fall back to the product we already have
  const displayName = details?.name ?? product.name;
  const displayPrice = details?.price ?? product.price;
  const displayImage = details?.image || product.image;
  const displayCategory = details?.category ?? product.category;
  const displayUrl = details?.url;
  const displayVariants = details?.variants ?? [];
  const inStock = details ? details.inStock !== false : true;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto shadow-[0_0_50px_rgba(16,185,129,0.25)] p-6 sm:p-8 flex flex-col"
      >
        {/* Soft glowing ambient */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-6 border border-white/5 bg-slate-950">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <img
              src={displayImage || `https://placehold.co/400x400/1e293b/6ee7b7?text=${encodeURIComponent(displayName)}`}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/400x400/1e293b/6ee7b7?text=Kapruka';
              }}
            />
          )}
        </div>

        {/* Category + Stock */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Tag className="w-3 h-3" />
            <span>{displayCategory.toUpperCase() || 'KAPRUKA'}</span>
          </div>
          {!loading && (
            <div className="absolute top-4 right-16 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 z-10 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-xs font-mono font-medium text-white tracking-wider">
                {inStock ? 'IN STOCK' : t('OUT_OF_STOCK').toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        {loading ? (
          <div className="h-7 bg-white/10 rounded-lg animate-pulse mb-2 w-3/4" />
        ) : (
          <h3 className="text-2xl font-bold font-heading text-white mb-2 leading-snug">
            {displayName}
          </h3>
        )}

        {/* Price */}
        {loading ? (
          <div className="h-6 bg-white/10 rounded-lg animate-pulse mb-6 w-1/3" />
        ) : (
          <p className="text-xl font-mono text-emerald-400 font-bold mb-4">
            LKR {displayPrice.toLocaleString()}
          </p>
        )}

        {/* Variants */}
        {displayVariants.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {displayVariants.map((v, i) => (
              <span
                key={i}
                className="text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70"
              >
                {v.name}: {v.value}
              </span>
            ))}
          </div>
        )}

        {/* Error note */}
        {error && (
          <p className="text-xs text-amber-400/80 mb-3 font-mono">{error}</p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onAddToCart(product.id);
              onClose();
            }}
            disabled={!inStock && !loading}
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{t('ADD_TO_CART')}</span>
          </button>

          {displayUrl && (
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 border border-white/20 hover:border-emerald-400/50 text-white/80 hover:text-white font-medium rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 text-sm hover:bg-white/5"
            >
              <ExternalLink className="w-4 h-4" />
              View on Kapruka
            </a>
          )}
        </div>

        {/* Delivery Checker */}
        <DeliveryChecker productId={product.id} />
      </motion.div>
    </>
  );
}
