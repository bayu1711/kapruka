import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Axe, Settings } from 'lucide-react';
import { useWishTree } from './hooks/useWishTree';
import { AiStatus } from './components/AiStatus';
import { WishTree } from './components/WishTree';
import { DevToolsDrawer } from './components/DevToolsDrawer';
import { WishInputBar } from './components/WishInputBar';
import { CartBadge } from './components/CartBadge';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutSummary } from './components/CheckoutSummary';
import { ConfirmationState } from './components/ConfirmationState';
import { ProductDetailsModal } from './components/ProductDetailsModal';
const PRODUCT_PAGE_SIZE = 20;
export function App() {
  const {
    state,
    handleSubmit,
    selectProduct,
    addToCart,
    removeFromCart,
    toggleCart,
    proceedToCheckout,
    cancelCheckout,
    confirmOrder,
    closeConfirmation,
    updateInput,
    currentConfig,
    products,
    totalProducts,
    liveCategories,
    history,
    restoreHistory,
    nextPage,
    prevPage,
    sessions,
    currentSessionIndex,
    goToNextSession,
    goToPrevSession,
    deleteSession,
  } = useWishTree();
  // Enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  const onSubmit = (finalValue?: string) => {
    handleSubmit(finalValue || state.inputValue, enablePostFilter);
  };
  const cartProducts = state.cartItems;
  const selectedProductObj = state.selectedProduct
    ? products.find((p) => p.id === state.selectedProduct) || null
    : null;
  // Shuffle products on each refinement using the seed (simulates context-aware re-ranking)
  const shuffledProducts = useMemo(() => {
    const arr = [...products];
    // Seeded Fisher-Yates shuffle so the same seed always gives the same order
    let seed = state.productSeed * 9301 + 49297;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [products, state.productSeed]);

  const [isPaging, setIsPaging] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [enablePostFilter, setEnablePostFilter] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(false);

  useEffect(() => {
    setIsPaging(false);
  }, [state.stage, state.productSeed]);

  // products is already sliced by useWishTree based on state.page
  const visibleProducts = shuffledProducts;

  const showPager =
    state.stage >= 3 &&
    !state.showCart &&
    !state.showCheckout &&
    !state.showConfirmation;

  const hasMorePages = (state.page + 1) * PRODUCT_PAGE_SIZE < totalProducts;
  const hasPrevPages = state.page > 0;
  return (
    <div className="relative w-full h-[100dvh] bg-[#402970] overflow-hidden flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-[#4b3282]/50 via-[#402970] to-[#402970] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial from-[#5b3e9d]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* UI Components */}

      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setIsDevToolsOpen(true)}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 rounded-full shadow-lg transition-colors backdrop-blur-md border border-purple-500/30"
          title="Developer Tools"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        {(sessions.length > 1 || state.stage > 0) && (
          <button
            onClick={deleteSession}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-orange-700/80 hover:bg-orange-800 text-white rounded-full shadow-lg transition-colors backdrop-blur-md border border-orange-700/20"
            title="Chop down this tree"
          >
            <Axe className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        <CartBadge count={state.cartItems.length} onClick={toggleCart} />
      </div>




      {/* Main tree visualization */}
      <div className="flex-1 relative w-full flex flex-col pt-16 sm:pt-0 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSessionIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-1 w-full h-full relative min-h-0 overflow-hidden"
          >
            <WishTree
              stage={state.stage}
              products={visibleProducts}
              selectedProduct={state.selectedProduct}
              onSelectProduct={selectProduct}
              isPaging={isPaging}
              liveCategories={liveCategories}
              aiReasoning={state.aiReasoning}
              aiRecipient={state.aiRecipient}
              aiActualSearchQuery={state.aiActualSearchQuery}
              aiOriginalSearchQuery={state.aiOriginalSearchQuery}
              searchParameters={state.searchParameters}
              showDebugGrid={showDebugGrid}
              isSearching={state.isSearching}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className="absolute inset-y-0 left-0 w-16 sm:w-24 pointer-events-none flex items-center justify-start z-40">
          {currentSessionIndex > 0 && (
            <button
              onClick={goToPrevSession}
              className="pointer-events-auto ml-2 sm:ml-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 shadow-xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="absolute inset-y-0 right-0 w-32 pointer-events-none flex items-center justify-end z-40">
          {currentSessionIndex === sessions.length - 1 ? (
            <button
              onClick={goToNextSession}
              className="pointer-events-auto mr-2 sm:mr-6 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 backdrop-blur-md flex items-center gap-2 justify-center text-white font-heading transition-all hover:scale-105 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
              title="Start New Wish Tree"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold text-sm">New Wish Tree</span>
            </button>
          ) : (
            <button
              onClick={goToNextSession}
              className="pointer-events-auto mr-2 sm:mr-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 shadow-xl"
              title="Next Session"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {!state.showCheckout && !state.showConfirmation &&
          <WishInputBar
            value={state.inputValue}
            onChange={updateInput}
            onSubmit={onSubmit}
            placeholder={currentConfig?.prompt || 'What are you wishing for today?'}
            disabled={state.showCheckout || state.showConfirmation || state.isSearching}
            history={history}
            onHistoryClick={restoreHistory}
            hasMorePages={hasMorePages}
            hasPrevPages={hasPrevPages}
            onNextPage={() => {
              setIsPaging(true);
              nextPage();
            }}
            onPrevPage={() => {
              setIsPaging(true);
              prevPage();
            }}
            onRandomize={() => {
              const randomQueries = [
                "Please suggest completely different gift ideas, but keep all my previous constraints (like occasion, recipient, budget) in mind.",
                "Show me some alternative options for the same person and occasion.",
                "I want something else, but still fitting the same context we discussed."
              ];
              const q = randomQueries[Math.floor(Math.random() * randomQueries.length)];
              handleSubmit(q);
            }}
            followUpQuestions={state.followUpQuestions}
          />
        }
      </div>

      {/* Cart drawer */}
      <CartDrawer
        isOpen={state.showCart}
        onClose={toggleCart}
        items={cartProducts}
        onCheckout={proceedToCheckout}
        onRemoveItem={removeFromCart}
      />

      {/* Dev Tools drawer */}
      <DevToolsDrawer
        isOpen={isDevToolsOpen}
        onClose={() => setIsDevToolsOpen(false)}
        showDebugGrid={showDebugGrid}
        onToggleDebugGrid={() => setShowDebugGrid(!showDebugGrid)}
        enablePostFilter={enablePostFilter}
        onTogglePostFilter={() => setEnablePostFilter(!enablePostFilter)}
        aiReasoning={state.aiReasoning}
        aiRecipient={state.aiRecipient}
        aiActualSearchQuery={state.aiActualSearchQuery}
        aiOriginalSearchQuery={state.aiOriginalSearchQuery}
        aiPostFilterReasoning={state.aiPostFilterReasoning}
        searchParameters={state.searchParameters}
        liveCategories={liveCategories}
      />

      {/* Checkout */}
      <AnimatePresence>
        {state.showCheckout &&
          <CheckoutSummary items={cartProducts} onConfirm={confirmOrder} onClose={cancelCheckout} />
        }
      </AnimatePresence>

      {/* Confirmation */}
      <AnimatePresence>
        {state.showConfirmation && <ConfirmationState onClose={closeConfirmation} />}
      </AnimatePresence>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProductObj && (
          <ProductDetailsModal
            product={selectedProductObj}
            onClose={() => selectProduct(null)}
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>
    </div>);
}