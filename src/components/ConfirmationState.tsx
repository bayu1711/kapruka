import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
export function ConfirmationState() {
  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      
      <motion.div
        initial={{
          scale: 0.8,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20
        }}
        className="text-center">
        
        <motion.div
          initial={{
            scale: 0
          }}
          animate={{
            scale: 1
          }}
          transition={{
            delay: 0.2,
            type: 'spring',
            stiffness: 200
          }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 mb-6">
          
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </motion.div>

        <motion.h2
          initial={{
            y: 20,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            delay: 0.3
          }}
          className="text-4xl font-heading font-bold text-white mb-4">
          
          Your Wish is On Its Way!
        </motion.h2>

        <motion.p
          initial={{
            y: 20,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            delay: 0.4
          }}
          className="text-xl text-white/70 font-heading mb-8">
          
          Order confirmed for same-day delivery to Colombo
        </motion.p>

        <motion.div
          initial={{
            y: 20,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            delay: 0.5
          }}
          className="flex items-center justify-center gap-2 text-emerald-400">
          
          <Sparkles className="w-5 h-5" />
          <span className="font-mono text-sm">
            The Wish Tree made it happen
          </span>
          <Sparkles className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </motion.div>);

}