import React from 'react';
export function Legend() {
  return (
    <div className="fixed top-16 right-4 sm:top-6 sm:right-32 z-50 flex flex-col sm:flex-row gap-1.5 sm:gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl p-2 sm:p-4">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        <span className="text-[10px] sm:text-xs font-mono text-white/70">
          <span className="hidden sm:inline">Your Choices / </span>Preferences
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
        <span className="text-[10px] sm:text-xs font-mono text-white/70">
          Products<span className="hidden sm:inline"> (Solutions)</span>
        </span>
      </div>
    </div>);

}