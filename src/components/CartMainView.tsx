import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, ArrowRight, Trash2, ChevronLeft } from 'lucide-react';
import type { Product } from '../data/scenario';
import { useLanguage } from '../contexts/LanguageContext';

interface CartMainViewProps {
  items: Product[];
  onCheckout: () => void;
  onRemoveItem: (id: string) => void;
  selectedProduct: string | null;
  onSelectProduct: (id: string | null) => void;
  selectedCartItems: string[];
  onToggleItemSelection: (id: string) => void;
}

export function CartMainView({
  items,
  onCheckout,
  onRemoveItem,
  selectedProduct,
  onSelectProduct,
  selectedCartItems,
  onToggleItemSelection
}: CartMainViewProps) {
  const { t } = useLanguage();
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  const selectedProductObj = selectedProduct 
    ? items.find(p => p.id === selectedProduct) 
    : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-[min(150vw,68vh)] h-[min(150vw,68vh)] sm:w-[min(115vw,78vh)] sm:h-[min(115vw,78vh)] md:w-[800px] md:h-[800px] max-w-[800px] max-h-[800px] flex-shrink-0 origin-center flex flex-col">
        {/* Main Content Area - Scrollable */}
        <div className="w-full h-full overflow-y-auto custom-scrollbar pr-2 pb-32 pt-12 sm:pt-16">
          <AnimatePresence mode="wait">
            {selectedProductObj ? (
              /* Detailed Product View */
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full h-full bg-[#402970]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row gap-6 p-6"
              >
                <div className="w-full sm:w-1/2 h-48 sm:h-full rounded-2xl overflow-hidden shadow-inner bg-black/20 relative group">
                  <img 
                    src={selectedProductObj.image || `https://placehold.co/400x400/1e293b/6ee7b7?text=${encodeURIComponent(selectedProductObj.name)}`} 
                    alt={selectedProductObj.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    onClick={() => onSelectProduct(null)}
                    className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors flex items-center justify-center"
                    title="Back to Cart Grid"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2 relative">
                  <button
                    onClick={() => onSelectProduct(null)}
                    className="absolute top-0 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center"
                    title="Close Details"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="mb-6 pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-medium text-emerald-300">
                        {selectedProductObj.category}
                      </span>
                      {selectedProductObj.delivery === 'Same Day' && (
                        <span className="px-3 py-1 bg-blue-500/20 rounded-full text-xs font-mono font-medium text-blue-300">
                          Available Today
                        </span>
                      )}
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4 leading-tight pr-10">
                      {selectedProductObj.name}
                    </h3>
                    <div className="flex items-baseline gap-3">
                      <p className="text-4xl font-mono font-bold text-emerald-400">
                        LKR {selectedProductObj.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 text-white/80 space-y-4">
                    <p className="text-base leading-relaxed">
                      {selectedProductObj.description || "A wonderful gift choice that brings joy and happiness to your loved ones. Specially selected to match your preferences."}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-white/5 p-4 rounded-xl">
                        <span className="text-sm text-white/50 font-mono block mb-1">Occasion</span>
                        <span className="text-base font-medium">{selectedProductObj.occasion || "Any Occasion"}</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl">
                        <span className="text-sm text-white/50 font-mono block mb-1">Recipient</span>
                        <span className="text-base font-medium">{selectedProductObj.recipient || "Anyone"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={() => onCheckout()}
                      className="flex-1 min-w-[200px] py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                    >
                      {t('CHECKOUT')}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        onRemoveItem(selectedProductObj.id);
                        onSelectProduct(null);
                      }}
                      className="py-4 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Grid View */
              <motion.div
                key="list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col gap-4 sm:gap-5 max-w-4xl mx-auto"
              >
                {items.map((item, index) => {
                  const isChecked = selectedCartItems.includes(item.id);
                  return (
                    <motion.div
                      key={`${item.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSelectProduct(item.id)}
                      className={`relative bg-white/5 rounded-2xl border ${isChecked ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 hover:border-white/30'} cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden group flex flex-row items-stretch min-h-[120px]`}
                    >
                      <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center cursor-pointer group/checkbox p-1">
                          <div className="relative flex items-center justify-center w-6 h-6">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleItemSelection(item.id)}
                              className="peer sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/40 group-hover/checkbox:border-white/70 bg-black/40 backdrop-blur-sm'}`}>
                              <svg className={`w-3.5 h-3.5 text-white ${isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} transition-all`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Left: Info */}
                      <div className="flex-1 p-4 sm:p-5 pl-14 sm:pl-16 flex flex-col justify-center">
                        <h3 className="font-heading font-medium text-white mb-1 line-clamp-2 leading-tight text-lg sm:text-xl">
                          {item.name}
                        </h3>
                        <p className="text-sm font-mono text-white/50 mb-3 line-clamp-1">
                          {item.category}
                        </p>
                        <p className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
                          LKR {item.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Right: Image */}
                      <div className="w-32 sm:w-48 lg:w-56 overflow-hidden relative bg-black/20 shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(item.id);
                          }}
                          className="absolute top-3 right-3 p-2.5 bg-black/40 hover:bg-red-500/80 rounded-full text-white/80 hover:text-white transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                          title={t('REMOVE_ITEM')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                
                {items.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/50 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <ShoppingCart className="w-20 h-20 mb-6 opacity-20" />
                    <p className="text-2xl font-heading mb-2 text-white/70">Your cart is empty</p>
                    <p className="text-base font-mono">Select a product from the tree to add it here.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
