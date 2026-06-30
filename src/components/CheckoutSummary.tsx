import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Calendar, Gift, User, Phone,
  ArrowRight, Loader2, ExternalLink, AlertTriangle, X
} from 'lucide-react';
import type { Product } from '../data/scenario';
import { createOrder } from '../lib/kapruka-mcp';
import { useLanguage } from '../contexts/LanguageContext';

interface CheckoutSummaryProps {
  items: Product[];
  onConfirm: () => void;
  onClose: () => void;
}

export function CheckoutSummary({ items, onConfirm, onClose }: CheckoutSummaryProps) {
  const { t } = useLanguage();
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
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  // Validate required fields
  const isValid = recipientName.trim().length > 0 && recipientPhone.trim().length > 0 && city.trim().length > 0;

  const handlePlaceOrder = async () => {
    if (!isValid || placing || items.length === 0) return;
    setPlacing(true);
    setError(null);

    try {
      // Pass all cart items to the checkout endpoint
      const result = await createOrder({
        cart: items.map(item => ({ productId: item.id, quantity: 1 })),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        city: city.trim(),
        deliveryDate,
        giftMessage: giftMessage.trim() || undefined,
      });

      if (result.payUrl) {
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

        <div className="pt-2">
          <h2 className="text-2xl font-heading font-bold text-white mb-6">
            {t('CHECKOUT_DETAILS')}
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
            <h3 className="font-heading font-semibold text-white flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-emerald-400" /> {t('DELIVERY_INFO')}
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
              <span className="text-lg font-heading font-semibold text-white">{t('TOTAL')}</span>
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
                {t('CONFIRM_PAY')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <p className="text-xs text-white/30 font-mono text-center mt-3">
            You'll be redirected to Kapruka's secure payment page
          </p>
        </div>
      </motion.div>
    </>
  );
}