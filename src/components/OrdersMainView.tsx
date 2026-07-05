import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, ChevronLeft } from 'lucide-react';
import type { Order } from '../hooks/useWishTree';
import { OrderTracker } from './OrderTracker';
import { useLanguage } from '../contexts/LanguageContext';

interface OrdersMainViewProps {
  orders: Order[];
  selectedOrder: string | null;
  onSelectOrder: (id: string | null) => void;
}

export function OrdersMainView({
  orders,
  selectedOrder,
  onSelectOrder,
}: OrdersMainViewProps) {
  const { t } = useLanguage();
  const selectedOrderObj = selectedOrder 
    ? orders.find(o => o.id === selectedOrder) 
    : null;

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
          <AnimatePresence mode="wait">
            {selectedOrderObj ? (
              /* Detailed Order View */
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full bg-[#402970]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 relative"
              >
                <button
                  onClick={() => onSelectOrder(null)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center z-20"
                  title="Back to Orders"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-2xl font-heading font-bold text-white mb-6">
                  Order Tracking
                </h3>

                <OrderTracker initialOrderNumber={selectedOrderObj.id} />
              </motion.div>
            ) : (
              /* List View */
              <motion.div
                key="list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col gap-4 sm:gap-5 max-w-4xl mx-auto"
              >
                {orders.map((order, index) => (
                  <motion.div
                    key={`${order.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectOrder(order.id)}
                    className={`relative bg-white/5 rounded-2xl border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden group flex flex-col sm:flex-row items-stretch p-4 gap-4`}
                  >
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-heading font-medium text-white text-lg">
                          Order {order.id}
                        </h3>
                      </div>
                      <p className="text-sm font-mono text-white/50 mb-1">
                        Placed on {order.date}
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-mono font-bold text-emerald-400">
                          LKR {order.total.toLocaleString()}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-mono font-semibold border ${
                          order.status.toLowerCase().includes('delivered')
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : order.status.toLowerCase().includes('cancel')
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    {/* Show a mini preview of items if any exist */}
                    {order.items.length > 0 && (
                      <div className="w-full sm:w-48 lg:w-56 overflow-hidden flex gap-2 shrink-0">
                        {order.items.slice(0, 3).map((item, i) => (
                           <img
                             key={i}
                             src={item.image}
                             alt={item.name}
                             className="w-12 h-12 rounded-lg object-cover bg-black/20"
                           />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xs font-mono text-white">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {orders.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/50 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <Package className="w-20 h-20 mb-6 opacity-20" />
                    <p className="text-2xl font-heading mb-2 text-white/70">No orders yet</p>
                    <p className="text-base font-mono">Place an order to track it here.</p>
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
