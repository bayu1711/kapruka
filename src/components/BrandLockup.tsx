import React from 'react';
export function BrandLockup() {
  return (
    <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 sm:gap-3">
      <img
        src="https://www.kapruka.com/static/image/send-online-logo.png"
        alt="Kapruka"
        className="h-4 sm:h-6 w-auto brightness-0 invert" />
      
      <div className="flex flex-col">
        <span className="text-[10px] sm:text-sm font-heading font-medium text-white/90 leading-tight">
          KAPRUKA
        </span>
        <span className="text-sm sm:text-lg font-heading font-semibold text-emerald-400 leading-tight">
          WISH TREE
        </span>
      </div>
    </div>);

}