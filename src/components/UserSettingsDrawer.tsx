import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, CheckSquare, Square, Trash2, Activity } from 'lucide-react';

interface UserSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  enablePostFilter: boolean;
  onTogglePostFilter: () => void;
  enableAnimations: boolean;
  onToggleAnimations: () => void;
  onDeleteAllData: () => void;
  defaultRegion: string;
  onRegionChange: (region: string) => void;
}

export function UserSettingsDrawer({
  isOpen,
  onClose,
  enablePostFilter,
  onTogglePostFilter,
  enableAnimations,
  onToggleAnimations,
  onDeleteAllData,
  defaultRegion,
  onRegionChange
}: UserSettingsDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-blue-500/30 z-[70] overflow-y-auto shadow-[0_0_50px_rgba(59,130,246,0.2)]"
          >
            <div className="p-6 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-heading font-bold text-white">
                    Settings
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Toggles Section */}
                <section>
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Preferences
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={onTogglePostFilter}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div>
                        <div className="text-white font-medium mb-1">Strict AI Matching</div>
                        <div className="text-white/50 text-sm">Enhance search accuracy by filtering out irrelevant suggestions using advanced AI reasoning.</div>
                      </div>
                      <div className="text-blue-400 ml-4">
                        {enablePostFilter ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </div>
                    </button>

                    <button
                      onClick={onToggleAnimations}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div>
                        <div className="text-white font-medium mb-1">Enable Animations</div>
                        <div className="text-white/50 text-sm">Toggle visual animations and transitions throughout the application.</div>
                      </div>
                      <div className="text-blue-400 ml-4">
                        {enableAnimations ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </div>
                    </button>

                    <div className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 transition-colors text-left">
                      <div>
                        <div className="text-white font-medium mb-1">Default Delivery Region</div>
                        <div className="text-white/50 text-sm">Select your primary delivery area for accurate shipping estimates.</div>
                      </div>
                      <div className="ml-4">
                        <select
                          value={defaultRegion}
                          onChange={(e) => onRegionChange(e.target.value)}
                          className="bg-black/40 border border-white/20 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
                        >
                          <option value="Colombo">Colombo</option>
                          <option value="Gampaha">Gampaha</option>
                          <option value="Kandy">Kandy</option>
                          <option value="Galle">Galle</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Data Management
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete all local data? This cannot be undone.')) {
                          onDeleteAllData();
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors text-left group"
                    >
                      <div>
                        <div className="text-red-400 font-medium mb-1 group-hover:text-red-300">Clear All Data</div>
                        <div className="text-red-400/60 text-sm group-hover:text-red-300/80">Erase all sessions, cart items, and stored preferences.</div>
                      </div>
                      <div className="text-red-400 ml-4">
                        <Trash2 className="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                </section>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
