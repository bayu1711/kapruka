import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Gift, CreditCard, ArrowRight } from 'lucide-react';
import type { Product } from '../data/scenario';
interface CheckoutSummaryProps {
  items: Product[];
  onConfirm: () => void;
}
export function CheckoutSummary({ items, onConfirm }: CheckoutSummaryProps) {
  const [giftMessage, setGiftMessage] = useState(
    'Happy Birthday Mom! Love you always ❤️'
  );
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      
      <motion.div
        initial={{
          y: 20
        }}
        animate={{
          y: 0
        }}
        className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        
        <div className="p-8">
          <h2 className="text-3xl font-heading font-bold text-white mb-6">
            Complete Your Order
          </h2>

          {/* Delivery Details */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-emerald-400 mt-1" />
              <div>
                <h3 className="font-heading font-semibold text-white mb-1">
                  Delivery Address
                </h3>
                <p className="text-white/70">
                  123 Galle Road, Colombo 03, Sri Lanka
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-emerald-400 mt-1" />
              <div>
                <h3 className="font-heading font-semibold text-white mb-1">
                  Delivery Date
                </h3>
                <p className="text-white/70">
                  Same Day Delivery - Today by 6 PM
                </p>
              </div>
            </div>
          </div>

          {/* Gift Message */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <Gift className="w-5 h-5 text-emerald-400 mt-1" />
              <h3 className="font-heading font-semibold text-white">
                Gift Message
              </h3>
            </div>
            <textarea
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 font-heading outline-none focus:border-emerald-400/50 transition-colors resize-none"
              rows={3} />
            
          </div>

          {/* Payment */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-emerald-400 mt-1" />
              <h3 className="font-heading font-semibold text-white">
                Payment Method
              </h3>
            </div>
            <p className="text-white/70 ml-8">Visa ending in 4242</p>
          </div>

          {/* Order Summary */}
          <div className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20 mb-6">
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
              <span className="text-xl font-heading font-semibold text-white">
                Total
              </span>
              <span className="text-3xl font-mono font-bold text-emerald-400">
                LKR {subtotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-semibold text-lg rounded-xl transition-colors flex items-center justify-center gap-2 group">
            
            Confirm Order
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </motion.div>);

}