import { useState, useCallback } from 'react';
import { scenarioBlocks, products, stageConfigs } from '../data/scenario';
import { useScreenInit } from '../useScreenInit.js';

export interface WishTreeState {
  stage: number;
  visibleBlocks: typeof scenarioBlocks;
  selectedProduct: string | null;
  cartItems: string[];
  showCart: boolean;
  showCheckout: boolean;
  showConfirmation: boolean;
  inputValue: string;
  productSeed: number; // increments on each refinement to re-order products
}

export function useWishTree() {
  const screenInit = useScreenInit() as Partial<{
    stage: number;
    showCart: boolean;
    showCheckout: boolean;
    showConfirmation: boolean;
  }>;
  const initialStage = screenInit.stage ?? 0;
  const [state, setState] = useState<WishTreeState>({
    stage: initialStage,
    visibleBlocks: scenarioBlocks.filter((b) => b.stage <= initialStage),
    selectedProduct: null,
    cartItems:
    screenInit.showCart || screenInit.showCheckout || screenInit.showConfirmation ?
    ['p1'] :
    [],
    showCart: screenInit.showCart ?? false,
    showCheckout: screenInit.showCheckout ?? false,
    showConfirmation: screenInit.showConfirmation ?? false,
    inputValue: stageConfigs[initialStage]?.suggestedInput || '',
    productSeed: 0
  });

  const advanceStage = useCallback((targetStage?: number) => {
    setState((prev) => {
      const nextStage = Math.min(targetStage ?? prev.stage + 1, 3);
      const newBlocks = scenarioBlocks.filter((b) => b.stage <= nextStage);
      const nextConfig = stageConfigs[nextStage];

      return {
        ...prev,
        stage: nextStage,
        visibleBlocks: newBlocks,
        inputValue: nextConfig?.suggestedInput || ''
      };
    });
  }, []);

  const selectProduct = useCallback((productId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedProduct: productId
    }));
  }, []);

  const refineProducts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      productSeed: prev.productSeed + 1,
      inputValue: ''
    }));
  }, []);

  const addToCart = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      cartItems: [...prev.cartItems, productId],
      showCart: true
    }));
  }, []);

  const toggleCart = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCart: !prev.showCart
    }));
  }, []);

  const proceedToCheckout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCheckout: true
    }));
  }, []);

  const confirmOrder = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showConfirmation: true,
      showCheckout: false,
      showCart: false
    }));
  }, []);

  const updateInput = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      inputValue: value
    }));
  }, []);

  const currentConfig = stageConfigs[state.stage];

  return {
    state,
    advanceStage,
    refineProducts,
    selectProduct,
    addToCart,
    toggleCart,
    proceedToCheckout,
    confirmOrder,
    updateInput,
    currentConfig,
    products
  };
}