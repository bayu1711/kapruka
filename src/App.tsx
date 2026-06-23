import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWishTree } from './hooks/useWishTree';
import { BrandLockup } from './components/BrandLockup';
import { AiStatus } from './components/AiStatus';
import { WishTree } from './components/WishTree';
import { WishInputBar } from './components/WishInputBar';
import { ProductPager } from './components/ProductPager';
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
    toggleCart,
    proceedToCheckout,
    confirmOrder,
    updateInput,
    currentConfig,
    products
  } = useWishTree();
  // Enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  const onSubmit = () => {
    handleSubmit(state.inputValue);
  };
  const cartProducts = state.cartItems.map(
    (id) => products.find((p) => p.id === id)!
  );
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

  const [productStart, setProductStart] = useState(0);
  const [isPaging, setIsPaging] = useState(false);

  useEffect(() => {
    setIsPaging(false);
  }, [state.stage, state.productSeed]);

  const visibleProducts = shuffledProducts.slice(
    productStart,
    productStart + PRODUCT_PAGE_SIZE
  );
  const showPager =
  state.stage >= 3 &&
  !state.showCart &&
  !state.showCheckout &&
  !state.showConfirmation;
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
      <BrandLockup />
      <AiStatus status={state.aiStatus} show={!!state.aiStatus} />
      <CartBadge count={state.cartItems.length} onClick={toggleCart} />


      

      {/* Main tree visualization */}
      <div className="flex-1 relative w-full flex flex-col pb-24 sm:pb-32 pt-16 sm:pt-0">
        <WishTree
          stage={state.stage}
          products={visibleProducts}
          selectedProduct={state.selectedProduct}
          onSelectProduct={selectProduct}
          isPaging={isPaging}
        />
        
      </div>

      {/* Product pager (above the chat) */}
      {showPager &&
      <ProductPager
        start={productStart}
        pageSize={PRODUCT_PAGE_SIZE}
        total={products.length}
        onPrev={() => {
          setIsPaging(true);
          setProductStart((s) => Math.max(0, s - PRODUCT_PAGE_SIZE));
        }}
        onNext={() => {
          setIsPaging(true);
          setProductStart((s) =>
            Math.min(
              Math.max(0, products.length - PRODUCT_PAGE_SIZE),
              s + PRODUCT_PAGE_SIZE
            )
          );
        }}
      />

      }

      {/* Input bar */}
      {!state.showCheckout && !state.showConfirmation &&
      <WishInputBar
        value={state.inputValue}
        onChange={updateInput}
        onSubmit={onSubmit}
        placeholder={
        currentConfig?.prompt || 'What are you wishing for today?'
        }
        disabled={state.showCheckout || state.showConfirmation || state.isSearching} />

      }

      {/* Cart drawer */}
      <CartDrawer
        isOpen={state.showCart}
        onClose={toggleCart}
        items={cartProducts}
        onCheckout={proceedToCheckout} />
      

      {/* Checkout */}
      {state.showCheckout &&
      <CheckoutSummary items={cartProducts} onConfirm={confirmOrder} />
      }

      {/* Confirmation */}
      {state.showConfirmation && <ConfirmationState />}

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