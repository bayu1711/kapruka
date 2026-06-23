import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Calendar, Gift, User, Phone,
  ArrowRight, Loader2, ExternalLink, AlertTriangle
} from 'lucide-react';
import type { Product } from '../data/scenario';
import { createOrder } from '../lib/kapruka-mcp';

interface CheckoutSummaryProps {
  items: Product[];
  onConfirm: () => void;
}

export function CheckoutSummary({ items, onConfirm }: CheckoutSummaryProps) {
  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [city, setCity] = useState('Colombo');
  const [giftMessage, setGiftMessage] = useState('Happy Birthday! 🎉');

  // Tomorrow as default date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [deliveryDate, setDeliveryDate] = useState(tomorrow.toISOString().split('T')[0]);

  // Checkout state
  const [placing, setPlacing] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  // Validate required fields
  const isValid = recipientName.trim().length > 0 && recipientPhone.trim().length > 0 && city.trim().length > 0;

  const handlePlaceOrder = async () => {
    if (!isValid || placing || items.length === 0) return;
    setPlacing(true);
    setError(null);

    try {
      // Use the first cart item as the primary product
      const primaryProduct = items[0];
      const result = await createOrder({
        productId: primaryProduct.id,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        city: city.trim(),
        deliveryDate,
        giftMessage: giftMessage.trim() || undefined,
      });

      if (result.payUrl) {
        setPayUrl(result.payUrl);
        // Open the pay link in a new tab automatically
        window.open(result.payUrl, '_blank', 'noopener,noreferrer');
        // Notify parent that order is placed
        onConfirm();
      } else {
        throw new Error('No payment URL returned');
      }
    } catch (err) {
      console.error('[MCP] createOrder failed:', err);
      setError('Could not place order. Please try again or visit Kapruka.com directly.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden my-4"
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-6">
            Complete Your Order
          </h2>

          {/* Recipient details */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-4 space-y-3">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" /> Recipient
            </h3>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <User className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                type="text"
                placeholder="Recipient full name *"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="bg-transparent text-white text-sm placeholder:text-white/30 outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <Phone className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                type="tel"
                placeholder="Recipient phone *"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="bg-transparent text-white text-sm placeholder:text-white/30 outline-none w-full"
              />
            </div>
          </div>

          {/* Delivery details */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-4 space-y-3">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Delivery
            </h3>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                type="text"
                placeholder="City *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent text-white text-sm placeholder:text-white/30 outline-none w-full"
              />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <Calendar className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                type="date"
                value={deliveryDate}
                min={tomorrow.toISOString().split('T')[0]}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="bg-transparent text-white text-sm outline-none w-full [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Gift message */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-4">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-emerald-400" /> Gift Message
            </h3>
            <textarea
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 font-heading text-sm outline-none focus:border-emerald-400/50 transition-colors resize-none"
              rows={2}
              placeholder="Optional gift message..."
            />
          </div>

          {/* Order summary */}
          <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center mb-2 text-sm">
                <span className="text-white/70 truncate mr-4">{item.name}</span>
                <span className="font-mono text-white flex-shrink-0">LKR {item.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="h-px bg-white/10 my-3" />
            <div className="flex justify-between items-center">
              <span className="text-lg font-heading font-semibold text-white">Total</span>
              <span className="text-2xl font-mono font-bold text-emerald-400">LKR {subtotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-white/40 font-mono mt-2">
              Prices locked for 60 minutes after order creation
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handlePlaceOrder}
            disabled={!isValid || placing}
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-heading font-semibold text-lg rounded-xl transition-colors flex items-center justify-center gap-2 group shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
          >
            {placing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Creating order...</>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Place Order & Pay on Kapruka
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <p className="text-xs text-white/30 font-mono text-center mt-3">
            You'll be redirected to Kapruka's secure payment page
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}