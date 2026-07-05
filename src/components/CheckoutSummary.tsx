import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Gift, User, Phone,
  ArrowRight, Loader2, ExternalLink, AlertTriangle, X
} from 'lucide-react';
import type { Product } from '../data/scenario';
import { createOrder, listDeliveryCities, checkDelivery } from '../lib/kapruka-mcp';
import { useLanguage } from '../contexts/LanguageContext';

interface CheckoutSummaryProps {
  items: Product[];
  details: {
    recipientName: string;
    recipientPhone: string;
    city: string;
    giftMessage: string;
    deliveryDate: string;
  };
  onUpdateDetails: (updates: Partial<CheckoutSummaryProps['details']>) => void;
  onConfirm: (orderNumber?: string) => void;
  onClose: () => void;
}

export function CheckoutSummary({ items, details, onUpdateDetails, onConfirm, onClose }: CheckoutSummaryProps) {
  const { t } = useLanguage();

  // Tomorrow as default min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Checkout state
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCityChange = (val: string) => {
    onUpdateDetails({ city: val });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const cities = await listDeliveryCities(val);
        setCitySuggestions(cities.slice(0, 6));
        setShowSuggestions(cities.length > 0);
      } catch {
        setCitySuggestions([]);
      }
    }, 350);
  };

  const selectCity = (c: string) => {
    onUpdateDetails({ city: c });
    setShowSuggestions(false);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  // Validate required fields
  const isValid = details.recipientName.trim().length > 0 && details.recipientPhone.trim().length > 0 && details.city.trim().length > 0;

  const handlePlaceOrder = async () => {
    if (!isValid || placing || items.length === 0) return;
    setPlacing(true);
    setError(null);

    try {
      // DUMMY BYPASS FOR TESTING: We will just simulate success with the provided order number
      // This is because Kapruka's MCP might reject fake orders in the production endpoint.
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading
      
      onConfirm('VPAY827982BA');
    } catch (err) {
      console.error('[MCP] createOrder failed:', err);
      setError('Could not place order. Please try again or visit Kapruka.com directly.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full px-2 sm:px-0 sm:w-[min(115vw,78vh)] sm:h-[min(115vw,78vh)] md:w-[800px] md:h-[800px] max-w-[800px] max-h-[800px] flex-shrink-0 origin-center flex flex-col">
        {/* Main Content Area - Scrollable */}
        <div 
          className="w-full h-full overflow-y-auto custom-scrollbar pr-2 pb-[35vh] sm:pb-64 pt-20 sm:pt-16"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)'
          }}
        >
          <div className="w-full bg-[#402970]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 sm:p-8 relative">
            {/* Soft glowing ambient */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Back/Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center z-20"
              title="Back to Cart"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <h2 className="text-2xl font-heading font-bold text-white mb-6">
                {t('CHECKOUT_DETAILS')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  {/* Recipient details */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                    <h3 className="font-heading font-semibold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" /> Recipient
                    </h3>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                      <User className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Recipient full name *"
                        value={details.recipientName}
                        onChange={(e) => onUpdateDetails({ recipientName: e.target.value })}
                        className="bg-transparent text-white text-sm placeholder:text-white/30 outline-none w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                      <Phone className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                      <input
                        type="tel"
                        placeholder="Recipient phone *"
                        value={details.recipientPhone}
                        onChange={(e) => onUpdateDetails({ recipientPhone: e.target.value })}
                        className="bg-transparent text-white text-sm placeholder:text-white/30 outline-none w-full"
                      />
                    </div>
                  </div>

                  {/* Delivery details */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                    <h3 className="font-heading font-semibold text-white flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-emerald-400" /> {t('DELIVERY_INFO')}
                    </h3>
                    <div className="relative" ref={wrapperRef}>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                        <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="City *"
                          value={details.city}
                          onChange={(e) => handleCityChange(e.target.value)}
                          onFocus={() => {
                            if (citySuggestions.length > 0) setShowSuggestions(true);
                          }}
                          className="bg-transparent text-white text-sm placeholder:text-white/30 outline-none w-full"
                        />
                      </div>
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.ul
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute top-full left-0 right-0 z-30 mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-xl"
                          >
                            {citySuggestions.map((c) => (
                              <li
                                key={c}
                                onMouseDown={() => selectCity(c)}
                                className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 cursor-pointer transition-colors"
                              >
                                {c}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                      <Calendar className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                      <input
                        type="date"
                        value={details.deliveryDate}
                        min={minDate}
                        onChange={(e) => onUpdateDetails({ deliveryDate: e.target.value })}
                        className="bg-transparent text-white text-sm outline-none w-full [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Gift message */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <h3 className="font-heading font-semibold text-white flex items-center gap-2 mb-3">
                      <Gift className="w-4 h-4 text-emerald-400" /> Gift Message
                    </h3>
                    <textarea
                      value={details.giftMessage}
                      onChange={(e) => onUpdateDetails({ giftMessage: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 font-heading text-sm outline-none focus:border-emerald-400/50 transition-colors resize-none"
                      rows={2}
                      placeholder="Optional gift message..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Order summary */}
                  <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                    <h3 className="font-heading font-semibold text-white mb-4">Order Summary</h3>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2 mb-4 space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                           <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-black/20" />
                          <span className="text-white/80 line-clamp-2 flex-1">{item.name}</span>
                          <span className="font-mono text-emerald-300 font-medium whitespace-nowrap">LKR {item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-emerald-500/20 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-heading text-white">{t('TOTAL')}</span>
                      <span className="text-2xl font-mono font-bold text-emerald-400">LKR {subtotal.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-white/50 font-mono mt-3">
                      Prices locked for 60 minutes after order creation
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    {/* Confirm button */}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={!isValid || placing}
                      className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white font-heading font-bold text-lg rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] disabled:shadow-none flex items-center justify-center gap-2 group"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}