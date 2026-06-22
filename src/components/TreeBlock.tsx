import React from 'react';
import { motion } from 'framer-motion';
import type { Block } from '../data/scenario';
interface TreeBlockProps {
  block: Block;
  index: number;
}
export function TreeBlock({ block, index }: TreeBlockProps) {
  const colorClasses = {
    white:
    'bg-white text-slate-900 shadow-[0_0_16px_rgba(255,255,255,0.6)] border-white',
    blue: 'bg-blue-600 text-white shadow-[0_0_16px_rgba(37,99,235,0.6)] border-blue-400/50',
    green:
    'bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.6)] border-emerald-400/50'
  };
  return (
    <motion.div
      initial={{
        scale: 0,
        opacity: 0,
        filter: 'blur(8px)'
      }}
      animate={{
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)'
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: block.delay || 0
      }}
      className={`
        absolute px-4 py-2 rounded-full
        ${colorClasses[block.color]}
        flex items-center justify-center
        border backdrop-blur-md z-10
      `}
      style={{
        left: `${block.position.x}px`,
        top: `${block.position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}>
      
      <span className="text-xs font-mono font-bold tracking-wide whitespace-nowrap">
        {block.label}
      </span>
    </motion.div>);

}