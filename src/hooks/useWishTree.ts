import { useState, useCallback, useEffect } from 'react';
import { scenarioBlocks, stageConfigs } from '../data/scenario';
import type { Product } from '../data/scenario';
import { useScreenInit } from '../useScreenInit.js';
import { searchProducts, listCategories } from '../lib/kapruka-mcp';
import { parseUserQuery } from './useKaprukaAgent';

export interface HistorySnapshot {
  query: string;
  aiStatus: string;
  products: Product[];
  categories: string[];
}

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
  aiStatus: string;
  isSearching: boolean;
  searchQuery: string;
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
      screenInit.showCart || screenInit.showCheckout || screenInit.showConfirmation
        ? ['p1']
        : [],
    showCart: screenInit.showCart ?? false,
    showCheckout: screenInit.showCheckout ?? false,
    showConfirmation: screenInit.showConfirmation ?? false,
    inputValue: stageConfigs[initialStage]?.suggestedInput || '',
    productSeed: 0,
    aiStatus: '',
    isSearching: false,
    searchQuery: '',
  });

  // Live products fetched from Kapruka MCP (replaces static mock data)
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  // Live categories from Kapruka MCP (used by tree label chips)
  const [liveCategories, setLiveCategories] = useState<string[]>([]);

  // History snapshots to restore previous conversational states
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  // Fetch categories on mount — these power the stage-1 white chips in WishTree
  useEffect(() => {
    listCategories()
      .then((cats) => {
        // Take the first 6 category names for the tree label positions
        const initialCats = cats.slice(0, 6).map((c) => c.name).filter(Boolean);
        setLiveCategories(initialCats);
      })
      .catch((err) => {
        console.warn('[MCP] listCategories failed, using defaults:', err);
      });
  }, []);

  const advanceStage = useCallback((targetStage?: number) => {
    setState((prev) => {
      const nextStage = Math.min(targetStage ?? prev.stage + 1, 3);
      const newBlocks = scenarioBlocks.filter((b) => b.stage <= nextStage);
      const nextConfig = stageConfigs[nextStage];
      return {
        ...prev,
        stage: nextStage,
        visibleBlocks: newBlocks,
        inputValue: nextConfig?.suggestedInput || '',
      };
    });
  }, []);

  /**
   * Core action: user submits a wish/query.
   * - First call: sets stage 3 and kicks off real product search via MCP.
   * - Subsequent calls: re-searches with the full accumulated query.
   */
  const handleSubmit = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setState((prev) => ({
      ...prev,
      stage: 3,
      visibleBlocks: scenarioBlocks.filter((b) => b.stage <= 3),
      isSearching: true,
      aiStatus: 'Searching Kapruka...',
      searchQuery: query,
      inputValue: '',
      productSeed: prev.productSeed + 1,
      selectedProduct: null,
    }));

    try {
      // 1. Let Gemini AI parse the query to understand context
      const agentResult = await parseUserQuery(query);
      
      // Update UI with AI's understanding
      setState((prev) => ({
        ...prev,
        aiStatus: agentResult.aiStatusMessage,
      }));

      if (agentResult.suggestedCategories.length > 0) {
        setLiveCategories(agentResult.suggestedCategories);
      }

      // 2. Fetch from MCP using the optimized search keyword
      const result = await searchProducts(agentResult.searchQuery, { limit: 40 });
      const mapped: Product[] = result.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        // position is unused by the grid layout but required by the interface
        position: { x: 0, y: 0 },
      }));

      setLiveProducts(mapped);
      
      const statusMsg = `Found ${mapped.length} results for "${agentResult.searchQuery}"`;
      
      setState((prev) => ({
        ...prev,
        isSearching: false,
        aiStatus: statusMsg,
        productSeed: prev.productSeed + 1, // trigger reshuffle with new products
      }));

      // Save a snapshot to history
      setHistory((prev) => [
        ...prev,
        {
          query: query,
          aiStatus: statusMsg,
          products: mapped,
          categories: agentResult.suggestedCategories.length > 0 ? agentResult.suggestedCategories : liveCategories,
        }
      ]);

      // Clear status after 3 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, aiStatus: '' }));
      }, 3000);
    } catch (err) {
      console.error('[Kapruka MCP] search failed:', err);
      setState((prev) => ({
        ...prev,
        isSearching: false,
        aiStatus: 'Search failed — showing cached products',
      }));
      setTimeout(() => {
        setState((prev) => ({ ...prev, aiStatus: '' }));
      }, 3000);
    }
  }, []);

  const refineProducts = useCallback(async (query?: string) => {
    setState((prev) => {
      const q = query || prev.searchQuery;
      // Kick off async search using latest query
      handleSubmit(q);
      return { ...prev, productSeed: prev.productSeed + 1 };
    });
  }, [handleSubmit]);

  const restoreHistory = useCallback((index: number) => {
    setHistory(prev => {
      const snap = prev[index];
      if (!snap) return prev;
      setLiveProducts(snap.products);
      setLiveCategories(snap.categories);
      setState(s => ({
        ...s,
        aiStatus: snap.aiStatus,
        searchQuery: snap.query,
      }));
      // Truncate history to forked point
      return prev.slice(0, index + 1);
    });
  }, []);

  const selectProduct = useCallback((productId: string | null) => {
    setState((prev) => ({ ...prev, selectedProduct: productId }));
  }, []);

  const addToCart = useCallback((productId: string) => {
    setState((prev) => ({
      ...prev,
      cartItems: [...prev.cartItems, productId],
      showCart: true,
    }));
  }, []);

  const toggleCart = useCallback(() => {
    setState((prev) => ({ ...prev, showCart: !prev.showCart }));
  }, []);

  const proceedToCheckout = useCallback(() => {
    setState((prev) => ({ ...prev, showCheckout: true }));
  }, []);

  const confirmOrder = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showConfirmation: true,
      showCheckout: false,
      showCart: false,
    }));
  }, []);

  const updateInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, inputValue: value }));
  }, []);

  const currentConfig = stageConfigs[state.stage];

  return {
    state,
    advanceStage,
    refineProducts,
    handleSubmit,
    selectProduct,
    addToCart,
    toggleCart,
    proceedToCheckout,
    confirmOrder,
    updateInput,
    currentConfig,
    products: liveProducts,
    liveCategories,
    history,
    restoreHistory,
  };
}