import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { OrderTracker } from './OrderTracker';
import { useLanguage } from '../contexts/LanguageContext';

export function ConfirmationState() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-md text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 mb-6"
        >
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-heading font-bold text-white mb-3"
        >
          {t('ORDER_CONFIRMED')}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 font-heading mb-2"
        >
          Payment link opened in a new tab. Complete your payment on Kapruka to confirm delivery.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-emerald-400 mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-mono text-sm">{t('TREE_MADE_IT_HAPPEN')}</span>
          <Sparkles className="w-4 h-4" />
        </motion.div>

        {/* Order tracker */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          <p className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">
            Track your order
          </p>
          <OrderTracker />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}