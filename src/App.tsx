import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Axe, Settings, Search, TreePine, ShoppingCart } from 'lucide-react';
import { useWishTree } from './hooks/useWishTree';
import { AiStatus } from './components/AiStatus';
import { WishTree } from './components/WishTree';
import { DevToolsDrawer } from './components/DevToolsDrawer';
import { UserSettingsDrawer } from './components/UserSettingsDrawer';
import { WishInputBar } from './components/WishInputBar';
import { CartBadge } from './components/CartBadge';
import { CartMainView } from './components/CartMainView';
import { CheckoutSummary } from './components/CheckoutSummary';
import { ConfirmationState } from './components/ConfirmationState';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { useLanguage } from './contexts/LanguageContext';
import SpeechRecognition from 'react-speech-recognition';
import { Locale } from './i18n/translations';
const PRODUCT_PAGE_SIZE = 20;
export function App() {
  const { locale, setLocale, t } = useLanguage();
  
  const cycleLanguage = () => {
    const langs: Locale[] = ['en-US', 'si-LK', 'ta-LK'];
    const nextIndex = (langs.indexOf(locale) + 1) % langs.length;
    const nextLang = langs[nextIndex];
    setLocale(nextLang);
    SpeechRecognition.stopListening();
  };

  const langLabel = ['EN', 'SI', 'TA'][['en-US', 'si-LK', 'ta-LK'].indexOf(locale)];

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
    selectSession,
    deleteSessionByIndex,
    toggleCartItemSelection,
    clearCartSelection,
    updateCheckoutDetails,
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
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [enablePostFilter, setEnablePostFilter] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [defaultRegion, setDefaultRegion] = useState('Colombo');
  const [enableUISounds, setEnableUISounds] = useState(true);
  const [enableVoiceAssistant, setEnableVoiceAssistant] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const [showCanopy, setShowCanopy] = useState(true);

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
  const hasSelection = !!state.selectedProduct;
  const isCartContext = state.showCart || state.showCheckout || state.showConfirmation;
  const [viewportHeight, setViewportHeight] = useState('100dvh');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const handleResize = () => {
        setViewportHeight(`${window.visualViewport?.height}px`);
      };
      window.visualViewport.addEventListener('resize', handleResize);
      handleResize();
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div 
      className={`relative w-full bg-[#402970] overflow-hidden flex flex-col ${enableAnimations ? '' : 'disable-animations'}`}
      style={{ height: viewportHeight }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-[#4b3282]/50 via-[#402970] to-[#402970] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial from-[#5b3e9d]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* UI Components */}

      <div className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3 transition-opacity duration-300 opacity-100`}>
        {(state.showCart || state.showCheckout || state.showConfirmation) && !state.showConfirmation && (
          <div className="flex items-center gap-1.5 sm:gap-2 mr-2 sm:mr-4">
            {/* Icon Box */}
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            
            {/* Title Box */}
            <div className="flex items-center h-8 sm:h-10 bg-black/60 backdrop-blur-md px-3 sm:px-4 rounded-full border border-white/10 shadow-lg">
              <span className="text-xs sm:text-sm font-heading font-bold text-white whitespace-nowrap">
                {state.showCheckout ? 'CHECKOUT' : t('YOUR_CART')}
              </span>
            </div>
            
            {/* Item Count Box */}
            <div className="flex items-center h-8 sm:h-10 bg-black/60 backdrop-blur-md px-3 sm:px-4 rounded-full border border-white/10 shadow-lg hidden sm:flex">
              <span className="text-xs sm:text-sm font-mono text-white/90 whitespace-nowrap">
                {cartProducts.length} {cartProducts.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Total Box */}
            <div className="flex items-center gap-2 h-8 sm:h-10 bg-black/60 backdrop-blur-md px-3 sm:px-4 rounded-full border border-white/10 shadow-lg">
              <span className="text-[10px] sm:text-xs font-heading text-white/60 whitespace-nowrap">{t('TOTAL')}</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 whitespace-nowrap">
                LKR {cartProducts.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={cycleLanguage}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full shadow-lg transition-colors backdrop-blur-md border border-white/20 font-mono text-xs sm:text-sm font-bold"
          title="Change Voice Language"
        >
          {langLabel}
        </button>

        {(state.showCart || state.showCheckout || state.showConfirmation) ? (
          <button
            onClick={() => {
              if (state.showConfirmation) closeConfirmation();
              else if (state.showCheckout) {
                cancelCheckout();
                toggleCart(); // to go back to tree if we cancel checkout, or wait, cancel checkout goes to cart? Yes, if showCart is true. So let's just use a function that closes all.
              }
              else toggleCart();
            }}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 rounded-full shadow-lg transition-colors backdrop-blur-md border border-emerald-500/30"
            title="Back to Tree"
          >
            <TreePine className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        ) : (
          <>
            {/* Hidden Developer Tools - uncomment or add shortcut if needed */}
            {/* <button
              onClick={() => setIsDevToolsOpen(true)}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 rounded-full shadow-lg transition-colors backdrop-blur-md border border-purple-500/30"
              title="Developer Tools"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button> */}
            <button
              onClick={() => setIsUserSettingsOpen(true)}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 rounded-full shadow-lg transition-colors backdrop-blur-md border border-blue-500/30"
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {(history.length > 0 || state.stage > 0) && (
              <button
                onClick={deleteSession}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-orange-700/80 hover:bg-orange-800 text-white rounded-full shadow-lg transition-colors backdrop-blur-md border border-orange-700/20"
                title="Chop down this tree"
              >
                <Axe className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 rounded-full shadow-lg transition-colors backdrop-blur-md border border-blue-500/30"
              title="Search Wishes"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <CartBadge count={state.cartItems.length} onClick={toggleCart} />
          </>
        )}
      </div>




      {/* Main tree visualization */}
      <div className="flex-1 relative w-full flex flex-col pt-16 sm:pt-0 min-h-0">
        <AnimatePresence mode="wait">
          {state.showConfirmation ? (
            <motion.div
              key="confirmation-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-1 w-full h-full relative min-h-0"
            >
              <ConfirmationState onClose={closeConfirmation} />
            </motion.div>
          ) : state.showCheckout ? (
            <motion.div
              key="checkout-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-1 w-full h-full relative min-h-0"
            >
              <CheckoutSummary 
                items={cartProducts} 
                details={{
                  ...state.checkoutDetails,
                  city: state.checkoutDetails.city || defaultRegion
                }}
                onUpdateDetails={updateCheckoutDetails}
                onConfirm={confirmOrder} 
                onClose={cancelCheckout} 
              />
            </motion.div>
          ) : state.showCart ? (
            <motion.div
              key="cart-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-1 w-full h-full relative min-h-0"
            >
              <CartMainView
                items={cartProducts}
                onCheckout={proceedToCheckout}
                onRemoveItem={removeFromCart}
                selectedProduct={state.selectedProduct}
                onSelectProduct={selectProduct}
                selectedCartItems={state.selectedCartItems}
                onToggleItemSelection={toggleCartItemSelection}
              />
            </motion.div>
          ) : (
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
                showCanopy={showCanopy}
                isSearching={state.isSearching}
                onAddToCart={addToCart}
                onQuickSearch={(query) => {
                  handleSubmit(query, enablePostFilter);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        {(!state.showCart && !state.showCheckout && !state.showConfirmation) && currentSessionIndex > 0 && (
          <div className={`absolute top-28 sm:top-1/2 sm:-translate-y-1/2 left-4 sm:left-6 z-40 transition-opacity duration-300 pointer-events-none opacity-100`}>
            <button
              onClick={goToPrevSession}
              className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 shadow-xl"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        )}

        {(!state.showCart && !state.showCheckout && !state.showConfirmation) && (
          <div className={`absolute top-28 sm:top-1/2 sm:-translate-y-1/2 right-4 sm:right-6 z-40 transition-opacity duration-300 pointer-events-none flex items-center justify-end opacity-100`}>
            {currentSessionIndex === sessions.length - 1 ? (
              (history.length > 0 || state.stage > 0) && (
                <button
                  onClick={goToNextSession}
                  className="pointer-events-auto px-3 py-2 sm:px-4 sm:py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 backdrop-blur-md flex items-center gap-1.5 sm:gap-2 justify-center text-white font-heading transition-all hover:scale-105 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                  title="Start New Wish Tree"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-xs sm:text-sm">New Tree</span>
                </button>
              )
            ) : (
              <button
                onClick={goToNextSession}
                className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 shadow-xl"
                title="Next Session"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        )}

        <div className={`w-full transition-opacity duration-300 opacity-100`}>
          <WishInputBar
            value={state.inputValue}
            onChange={updateInput}
            onSubmit={onSubmit}
            placeholder={currentConfig?.prompt || 'What are you wishing for today?'}
            disabled={state.isSearching}
            isSearching={state.isSearching}
            history={isCartContext ? state.cartHistory : history}
            onHistoryClick={isCartContext ? undefined : restoreHistory}
            hasMorePages={isCartContext ? false : hasMorePages}
            hasPrevPages={isCartContext ? false : hasPrevPages}
            liveCategories={liveCategories}
            onCategorySelect={(cat) => handleSubmit(`Show me ${cat}`)}
            priceOptions={[
              { label: 'Under Rs. 1000', value: 'under 1000' },
              { label: 'Rs. 1000 - Rs. 5000', value: 'between 1000 and 5000' },
              { label: 'Over Rs. 5000', value: 'over 5000' }
            ]}
            onPriceSelect={(price) => handleSubmit(`Show me items ${price}`)}
            sortOptions={[
              { label: 'Price: Low to High', value: 'price low to high' },
              { label: 'Price: High to Low', value: 'price high to low' }
            ]}
            onSortSelect={(sort) => handleSubmit(`Sort by ${sort}`)}
            onNextPage={isCartContext ? undefined : () => {
              setIsPaging(true);
              nextPage();
            }}
            onPrevPage={isCartContext ? undefined : () => {
              setIsPaging(true);
              prevPage();
            }}
            onRandomize={(isCartContext || state.stage === 0) ? undefined : () => {
              const randomQueries = [
                "Please suggest completely different gift ideas, but keep all my previous constraints (like occasion, recipient, budget) in mind.",
                "Show me some alternative options for the same person and occasion.",
                "I want something else, but still fitting the same context we discussed."
              ];
              const q = randomQueries[Math.floor(Math.random() * randomQueries.length)];
              handleSubmit(q);
            }}
            followUpQuestions={state.followUpQuestions}
            selectedProduct={selectedProductObj}
            onAddToCart={() => {
              if (selectedProductObj) addToCart(selectedProductObj.id);
            }}
            onRemoveFromCart={() => {
              if (selectedProductObj) removeFromCart(selectedProductObj.id);
            }}
            isProductInCart={selectedProductObj ? state.cartItems.some(item => item.id === selectedProductObj.id) : false}
            customTopContent={(state.showCart && !state.showCheckout && !state.showConfirmation) ? (
              <>
                {state.selectedCartItems.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 shadow-lg truncate max-w-[50%]">
                    <span className="truncate">
                      {state.selectedCartItems.length === 1 
                        ? (state.cartItems.find(p => p.id === state.selectedCartItems[0])?.name || '1 item selected')
                        : `Selected: ${state.selectedCartItems.length} items`}
                    </span>
                  </div>
                )}
                {state.selectedCartItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSubmit(`I want to compare the selected items.`);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 bg-blue-500/20 hover:bg-blue-500/40 backdrop-blur-md border border-blue-500/30 rounded-full px-3 py-1.5 transition-colors shadow-lg"
                  >
                    Compare selected
                  </button>
                )}
                {(state.selectedCartItems.length > 0 || state.cartItems.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      proceedToCheckout();
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-500/80 hover:bg-emerald-500 backdrop-blur-md border border-emerald-400 rounded-full px-3 py-1.5 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {state.selectedCartItems.length > 0 ? 'Checkout selected' : 'Proceed to Checkout'}
                  </button>
                )}
              </>
            ) : (state.stage === 0 && !state.isSearching) ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex overflow-x-auto no-scrollbar gap-2 w-full px-4 sm:px-6"
                style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                }}
              >
                {[
                  "Gift for my mother under 5000",
                  "Birthday gift for a 5 year old boy",
                  "Romantic anniversary dinner ideas",
                  "Same day delivery cakes to Colombo"
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubmit(suggestion, enablePostFilter)}
                    className="flex-shrink-0 flex items-center px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-white/20 rounded-full text-white/95 text-xs font-semibold transition-colors shadow-lg backdrop-blur-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            ) : undefined}
          />
        </div>
      </div>


      {/* Dev Tools drawer */}
      <DevToolsDrawer
        isOpen={isDevToolsOpen}
        onClose={() => setIsDevToolsOpen(false)}
        showDebugGrid={showDebugGrid}
        onToggleDebugGrid={() => setShowDebugGrid(!showDebugGrid)}
        enablePostFilter={enablePostFilter}
        onTogglePostFilter={() => setEnablePostFilter(!enablePostFilter)}
        showCanopy={showCanopy}
        onToggleCanopy={() => setShowCanopy(!showCanopy)}
        aiReasoning={state.aiReasoning}
        aiRecipient={state.aiRecipient}
        aiActualSearchQuery={state.aiActualSearchQuery}
        aiOriginalSearchQuery={state.aiOriginalSearchQuery}
        aiPostFilterReasoning={state.aiPostFilterReasoning}
        searchParameters={state.searchParameters}
        liveCategories={liveCategories}
      />

      {/* User Settings Drawer */}
      <UserSettingsDrawer
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        enablePostFilter={enablePostFilter}
        onTogglePostFilter={() => setEnablePostFilter(!enablePostFilter)}
        enableAnimations={enableAnimations}
        onToggleAnimations={() => setEnableAnimations(!enableAnimations)}
        showCanopy={showCanopy}
        onToggleCanopy={() => setShowCanopy(!showCanopy)}
        enableUISounds={enableUISounds}
        onToggleUISounds={() => setEnableUISounds(!enableUISounds)}
        enableVoiceAssistant={enableVoiceAssistant}
        onToggleVoiceAssistant={() => setEnableVoiceAssistant(!enableVoiceAssistant)}
        defaultRegion={defaultRegion}
        onRegionChange={setDefaultRegion}
        onDeleteAllData={() => {
          localStorage.clear();
          window.location.reload();
        }}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        sessions={sessions}
        onSelectSession={selectSession}
        onDeleteSession={deleteSessionByIndex}
        currentSessionIndex={currentSessionIndex}
      />
    </div>);
}