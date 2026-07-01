import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Bug, CheckSquare, Square } from 'lucide-react';

interface DevToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  showDebugGrid: boolean;
  onToggleDebugGrid: () => void;
  enablePostFilter: boolean;
  onTogglePostFilter: () => void;
  showCanopy: boolean;
  onToggleCanopy: () => void;
  aiReasoning?: string;
  aiRecipient?: string;
  aiActualSearchQuery?: string;
  aiOriginalSearchQuery?: string;
  aiPostFilterReasoning?: string;
  searchParameters?: {key: string, value: string}[];
  liveCategories?: string[];
}

export function DevToolsDrawer({
  isOpen,
  onClose,
  showDebugGrid,
  onToggleDebugGrid,
  enablePostFilter,
  onTogglePostFilter,
  showCanopy,
  onToggleCanopy,
  aiReasoning,
  aiRecipient,
  aiActualSearchQuery,
  aiOriginalSearchQuery,
  aiPostFilterReasoning,
  searchParameters,
  liveCategories
}: DevToolsDrawerProps) {
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-purple-500/30 z-[70] overflow-y-auto shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            <div className="p-6 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-heading font-bold text-white">
                    Developer Tools
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
                    <Bug className="w-4 h-4" /> Feature Toggles
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={onToggleDebugGrid}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div>
                        <div className="text-white font-medium mb-1">Show Tree Grid Layout</div>
                        <div className="text-white/50 text-sm">Overlay coordinate grid on the Wish Tree for debugging cell placement.</div>
                      </div>
                      <div className="text-purple-400 ml-4">
                        {showDebugGrid ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </div>
                    </button>

                    <button
                      onClick={onTogglePostFilter}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div>
                        <div className="text-white font-medium mb-1 flex items-center gap-2">
                          Enable AI Post-Filter
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">STRICT MATCH</span>
                        </div>
                        <div className="text-white/50 text-sm">Add a second AI pass to remove irrelevant Kapruka search results (e.g., iPhone 17 when iPhone 13 is requested).</div>
                      </div>
                      <div className="text-purple-400 ml-4">
                        {enablePostFilter ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </div>
                    </button>

                    <button
                      onClick={onToggleCanopy}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div>
                        <div className="text-white font-medium mb-1">Show Tree Canopy</div>
                        <div className="text-white/50 text-sm">Toggle the visibility of the tree trunk and green canopy background.</div>
                      </div>
                      <div className="text-purple-400 ml-4">
                        {showCanopy ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                      </div>
                    </button>
                  </div>
                </section>

                {/* AI Reasoning Section */}
                <section>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">
                    AI Agent Strategy
                  </h3>
                  <div className="bg-black/40 rounded-xl border border-purple-500/20 p-5 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <span className="text-white/50 text-xs block mb-1">Search Query Sent</span>
                        <div className="font-mono bg-black/60 px-3 py-1.5 rounded border border-white/10 text-emerald-400 inline-block">
                          {aiActualSearchQuery || 'None'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-white/50 text-xs block mb-1">Primary Reasoning</span>
                      <div className="text-white/80 text-sm leading-relaxed italic border-l-2 border-purple-500/50 pl-3">
                        {aiReasoning || 'No reasoning available for this search.'}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-4">
                      <span className="text-white/50 text-xs block mb-2">Context & Search Parameters</span>
                      <div className="flex flex-wrap gap-2">
                        {aiOriginalSearchQuery && (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded text-xs text-emerald-200">
                            <span className="opacity-60">Item:</span> <span className="font-semibold">{aiOriginalSearchQuery}</span>
                          </div>
                        )}
                        {searchParameters && searchParameters.map((p, i) => (
                          <div key={i} className="bg-purple-500/10 border border-purple-500/30 px-2 py-1 rounded text-xs text-purple-200">
                            <span className="opacity-60 capitalize">{p.key}:</span> <span className="font-semibold">{p.value}</span>
                          </div>
                        ))}
                        {(!searchParameters || searchParameters.length === 0) && !aiOriginalSearchQuery && (
                          <div className="text-white/40 text-sm italic">No specific parameters extracted.</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-4">
                      <span className="text-white/50 text-xs block mb-2">Suggested Categories</span>
                      {liveCategories && liveCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {liveCategories.map((c, i) => (
                            <div key={i} className="bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded text-xs text-emerald-300">
                              <span className="font-semibold">{c}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/40 text-sm italic">No categories suggested.</div>
                      )}
                    </div>

                    {enablePostFilter && (
                      <div className="pt-4 border-t border-white/10 mt-4">
                        <span className="text-white/50 text-xs block mb-1 flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-purple-400" /> Post-Filter Execution
                        </span>
                        <div className="text-purple-200/90 text-sm leading-relaxed border-l-2 border-purple-400/50 pl-3">
                          {aiPostFilterReasoning || 'Awaiting search to execute post-filter...'}
                        </div>
                      </div>
                    )}
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
