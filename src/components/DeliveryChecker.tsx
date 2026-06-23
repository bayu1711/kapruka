import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CalendarDays, Truck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { checkDelivery, listDeliveryCities } from '../lib/kapruka-mcp';

interface DeliveryCheckerProps {
  productId?: string;
}

export function DeliveryChecker({ productId }: DeliveryCheckerProps) {
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    available: boolean;
    fee?: number;
    perishableWarning?: boolean;
    message?: string;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tomorrow's date as default minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Autocomplete: query MCP as user types city name
  const handleCityChange = (val: string) => {
    setCity(val);
    setResult(null);
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
    setCity(c);
    setShowSuggestions(false);
  };

  const handleCheck = async () => {
    if (!city.trim() || !date) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await checkDelivery(city, date, productId);
      setResult(res);
    } catch (err) {
      setResult({ available: false, message: 'Could not check delivery. Please try again.' });
    } finally {
      setChecking(false);
    }
  };

  // Close suggestions on click outside
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

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-xs font-mono text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Truck className="w-3 h-3" /> Check Delivery
      </p>

      <div className="flex flex-col gap-2">
        {/* City autocomplete */}
        <div className="relative" ref={wrapperRef}>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <input
              type="text"
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="City (e.g. Colombo)"
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

        {/* Date picker */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
          <CalendarDays className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => { setDate(e.target.value); setResult(null); }}
            className="bg-transparent text-white text-sm outline-none w-full [color-scheme:dark]"
          />
        </div>

        {/* Check button */}
        <button
          onClick={handleCheck}
          disabled={!city.trim() || !date || checking}
          className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-500/30 text-emerald-400 text-sm font-mono font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {checking ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</>
          ) : (
            <><Truck className="w-3.5 h-3.5" /> Check Delivery</>
          )}
        </button>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl px-4 py-3 border text-sm font-mono flex flex-col gap-1 ${
                result.available
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {result.available ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="font-semibold">
                  {result.available ? 'Delivery available!' : 'Not available'}
                </span>
              </div>
              {result.available && result.fee !== undefined && (
                <span className="text-white/70 pl-6">
                  Delivery fee: <span className="text-emerald-400">LKR {result.fee.toLocaleString()}</span>
                </span>
              )}
              {result.perishableWarning && (
                <span className="text-amber-400 pl-6 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Perishable item — same-day delivery recommended
                </span>
              )}
              {result.message && (
                <span className="text-white/60 pl-6 text-xs">{result.message}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
