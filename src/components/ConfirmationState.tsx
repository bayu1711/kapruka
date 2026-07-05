import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmationStateProps {
  onClose: () => void;
  onViewOrders: () => void;
}

export function ConfirmationState({ onClose, onViewOrders }: ConfirmationStateProps) {
  const { t } = useLanguage();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onViewOrders();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onViewOrders]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full px-2 sm:px-0 sm:w-[min(115vw,78vh)] sm:h-[min(115vw,78vh)] md:w-[800px] md:h-[800px] max-w-[800px] max-h-[800px] flex-shrink-0 origin-center flex flex-col">
        {/* Main Content Area - Scrollable */}
        <div 
          className="w-full h-full overflow-y-auto custom-scrollbar pr-2 pb-[35vh] sm:pb-64 pt-20 sm:pt-16 flex items-center justify-center"
        >
          <div className="w-full max-w-xl mx-auto bg-[#402970]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
            {/* Soft glowing ambient */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors flex items-center justify-center z-20"
              title="Return to Tree"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full text-center flex flex-col items-center z-10">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4"
              >
                {t('ORDER_CONFIRMED')}
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/70 font-heading text-lg mb-4 max-w-md mx-auto leading-relaxed"
              >
                Payment link opened in a new tab. Complete your payment on Kapruka to confirm delivery.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-emerald-400 mb-10 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-mono text-sm font-semibold">{t('TREE_MADE_IT_HAPPEN')}</span>
                <Sparkles className="w-4 h-4" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="w-full flex justify-center mt-4"
              >
                <button
                  onClick={onViewOrders}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-semibold rounded-full transition-colors flex items-center gap-2"
                >
                  View My Orders
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}