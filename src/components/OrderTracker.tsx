import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, CheckCircle2, Truck, Clock, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { trackOrder, type KaprukaTrackResult } from '../lib/kapruka-mcp';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  delivered: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  shipped: <Truck className="w-4 h-4 text-blue-400" />,
  dispatched: <Truck className="w-4 h-4 text-blue-400" />,
  processing: <Package className="w-4 h-4 text-amber-400" />,
  pending: <Clock className="w-4 h-4 text-white/40" />,
  cancelled: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

function getStatusIcon(status: string) {
  const key = Object.keys(STATUS_ICONS).find((k) => status.toLowerCase().includes(k));
  return key ? STATUS_ICONS[key] : <Package className="w-4 h-4 text-white/40" />;
}

interface OrderTrackerProps {
  /** Pre-fill the order number (e.g. from confirmation screen) */
  initialOrderNumber?: string;
}

export function OrderTracker({ initialOrderNumber = '' }: OrderTrackerProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KaprukaTrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await trackOrder(orderNumber.trim());
      setResult(data);
    } catch (err) {
      setError('Could not find that order. Please check the order number and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Input row */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
          <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            placeholder="Enter order number"
            className="bg-transparent text-white text-sm placeholder:text-white/30 outline-none w-full font-mono"
          />
        </div>
        <button
          onClick={handleTrack}
          disabled={!orderNumber.trim() || loading}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-colors flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Track
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Error state */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-white/40 uppercase tracking-wider">Order</p>
                <p className="text-white font-mono font-semibold">{result.orderNumber}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                result.status.toLowerCase().includes('delivered')
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : result.status.toLowerCase().includes('cancel')
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {result.status}
              </div>
            </div>

            {/* Recipient */}
            {result.recipient && (
              <div className="px-5 py-3 border-b border-white/10 text-sm text-white/60 font-mono">
                To: <span className="text-white/80">{result.recipient}</span>
              </div>
            )}

            {/* Timeline */}
            {result.steps.length > 0 && (
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-2">Timeline</p>
                {result.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{getStatusIcon(step.status)}</div>
                    <div className="flex-1">
                      <p className="text-sm text-white/80 font-medium">{step.status}</p>
                      {step.description && (
                        <p className="text-xs text-white/50">{step.description}</p>
                      )}
                      <p className="text-xs font-mono text-white/30 mt-0.5">{step.timestamp}</p>
                    </div>
                    {i === 0 && (
                      <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                        Latest
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
