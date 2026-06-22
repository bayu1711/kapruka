import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import type { Product } from '../data/scenario';
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onCheckout: () => void;
}
export function CartDrawer({
  isOpen,
  onClose,
  items,
  onCheckout
}: CartDrawerProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          {/* Backdrop */}
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        

          {/* Drawer */}
          <motion.div
          initial={{
            x: '100%'
          }}
          animate={{
            x: 0
          }}
          exit={{
            x: '100%'
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
          className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto">
          
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-2xl font-heading font-bold text-white">
                    Your Cart
                  </h2>
                </div>
                <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item, index) =>
              <motion.div
                key={`${item.id}-${index}`}
                initial={{
                  opacity: 0,
                  x: 20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                transition={{
                  delay: index * 0.1
                }}
                className="flex gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                
                    <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover" />
                
                    <div className="flex-1">
                      <h3 className="font-heading font-medium text-white mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm font-mono text-white/60 mb-2">
                        {item.category}
                      </p>
                      <p className="text-lg font-mono font-semibold text-emerald-400">
                        LKR {item.price.toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
              )}
              </div>

              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 font-heading">Subtotal</span>
                  <span className="font-mono text-white">
                    LKR {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 font-heading">Delivery</span>
                  <span className="font-mono text-emerald-400">Free</span>
                </div>
                <div className="h-px bg-white/10 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-heading font-semibold text-white">
                    Total
                  </span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">
                    LKR {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout button */}
              <button
              onClick={onCheckout}
              className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 group">
              
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}