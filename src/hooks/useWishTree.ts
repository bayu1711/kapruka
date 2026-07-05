import { useState, useCallback, useEffect, useMemo } from 'react';
import { scenarioBlocks, stageConfigs } from '../data/scenario';
import type { Product } from '../data/scenario';
import { useScreenInit } from '../useScreenInit.js';
import { searchProducts, listCategories } from '../lib/kapruka-mcp';
import { parseUserQuery } from './useKaprukaAgent';
import { useLanguage } from '../contexts/LanguageContext';

export interface HistorySnapshot {
  query: string;
  aiStatus: string;
  products: Product[];
  categories: string[];
  aiReasoning?: string;
  aiRecipient?: string;
  aiActualSearchQuery?: string;
  aiOriginalSearchQuery?: string;
  aiPostFilterReasoning?: string;
  followUpQuestions?: string[];
  searchParameters?: {key: string, value: string}[];
  errorMessage?: string;
}

export interface Session {
  id: number;
  stage: number;
  visibleBlocks: typeof scenarioBlocks;
  selectedProduct: string | null;
  inputValue: string;
  productSeed: number;
  aiStatus: string;
  isSearching: boolean;
  searchQuery: string;
  aiReasoning?: string;
  aiRecipient?: string;
  aiActualSearchQuery?: string;
  aiOriginalSearchQuery?: string;
  aiPostFilterReasoning?: string;
  followUpQuestions?: string[];
  searchParameters?: {key: string, value: string}[];
  page: number;
  liveProducts: Product[];
  liveCategories: string[];
  history: HistorySnapshot[];
}

export interface CheckoutDetails {
  recipientName: string;
  recipientPhone: string;
  city: string;
  deliveryDate: string;
  giftMessage: string;
}

export interface GlobalState {
  cartItems: Product[];
  showCart: boolean;
  showCheckout: boolean;
  showConfirmation: boolean;
  cartHistory: HistorySnapshot[];
  selectedCartItems: string[];
  isSearchingCart?: boolean;
  checkoutDetails: CheckoutDetails;
}

const CART_STORAGE_KEY = 'kapruka_magic_cart';
const SESSIONS_STORAGE_KEY = 'kapruka_magic_sessions';
const SESSION_INDEX_KEY = 'kapruka_magic_session_idx';

function loadCart(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && typeof parsed[0] === 'string') return [];
      return parsed;
    }
  } catch (e) {}
  return [];
}

function loadSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (saved) {
      const parsed: Session[] = JSON.parse(saved);
      const filtered = parsed.filter(s => s.history.length > 0 || s.stage > 0);
      return filtered.length > 0 ? filtered : [];
    }
  } catch (e) {}
  return [];
}

function loadSessionIndex(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem(SESSION_INDEX_KEY);
    if (saved) return parseInt(saved, 10) || 0;
  } catch (e) {}
  return 0;
}

export function useWishTree() {
  const { locale, t } = useLanguage();
  const screenInit = useScreenInit() as Partial<{
    stage: number;
    showCart: boolean;
    showCheckout: boolean;
    showConfirmation: boolean;
  }>;
  const initialStage = screenInit.stage ?? 0;

  const createNewSession = (stage: number = 0): Session => ({
    id: Date.now(),
    stage,
    visibleBlocks: scenarioBlocks.filter((b) => b.stage <= stage),
    selectedProduct: null,
    inputValue: stageConfigs[stage]?.suggestedInput || '',
    productSeed: 0,
    aiStatus: '',
    isSearching: false,
    searchQuery: '',
    page: 0,
    liveProducts: [],
    liveCategories: [],
    history: [],
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) return loaded;
    return [createNewSession(initialStage)];
  });

  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(() => {
    const idx = loadSessionIndex();
    return Math.min(idx, sessions.length > 0 ? sessions.length - 1 : 0);
  });

  const [globalState, setGlobalState] = useState<GlobalState>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      cartItems: loadCart(),
      showCart: screenInit.showCart ?? false,
      showCheckout: screenInit.showCheckout ?? false,
      showConfirmation: screenInit.showConfirmation ?? false,
      cartHistory: [],
      selectedCartItems: [],
      isSearchingCart: false,
      checkoutDetails: {
        recipientName: '',
        recipientPhone: '',
        city: 'Colombo',
        deliveryDate: tomorrow.toISOString().split('T')[0],
        giftMessage: 'Happy Birthday! 🎉',
      }
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(globalState.cartItems));
    }
  }, [globalState.cartItems]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === CART_STORAGE_KEY) {
          setGlobalState(prev => ({ ...prev, cartItems: loadCart() }));
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const MAX_SESSIONS = 5;
        let sessionsToSave = sessions;
        let indexToSave = currentSessionIndex;
        if (sessions.length > MAX_SESSIONS) {
          sessionsToSave = sessions.slice(sessions.length - MAX_SESSIONS);
          indexToSave = Math.max(0, currentSessionIndex - (sessions.length - MAX_SESSIONS));
        }
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsToSave));
        localStorage.setItem(SESSION_INDEX_KEY, indexToSave.toString());
      } catch (e) {
        console.warn('Failed to save sessions to localStorage, quota may be exceeded:', e);
      }
    }
  }, [sessions, currentSessionIndex]);

  // Provide initial categories to any session that needs it
  useEffect(() => {
    listCategories()
      .then((cats) => {
        const initialCats = cats.slice(0, 6).map((c) => c.name).filter(Boolean);
        setSessions(prev => {
           const newSessions = [...prev];
           const curr = newSessions[currentSessionIndex];
           if (curr && curr.liveCategories.length === 0) {
             newSessions[currentSessionIndex] = { ...curr, liveCategories: initialCats };
           }
           return newSessions;
        });
      })
      .catch((err) => {
        console.warn('[MCP] listCategories failed, using defaults:', err);
      });
  }, [currentSessionIndex]);

  const updateSession = useCallback((updater: (session: Session) => Session) => {
    setSessions(prev => {
      const next = [...prev];
      if (next[currentSessionIndex]) {
        next[currentSessionIndex] = updater(next[currentSessionIndex]);
      }
      return next;
    });
  }, [currentSessionIndex]);

  const advanceStage = useCallback((targetStage?: number) => {
    updateSession((prev) => {
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
  }, [updateSession]);

  const handleSubmit = useCallback(async (query: string, enablePostFilter: boolean = false, isFallback: boolean = false, originalQuery?: string) => {
    if (!query.trim()) return;

    const inCart = globalState.showCart || globalState.showCheckout || globalState.showConfirmation;

    if (!isFallback && !inCart) {
      updateSession((prev) => ({
        ...prev,
        stage: 3,
        visibleBlocks: scenarioBlocks.filter((b) => b.stage <= 3),
        isSearching: !prev.selectedProduct,
        aiStatus: t('SEARCHING'),
        searchQuery: query,
        inputValue: '',
        productSeed: prev.productSeed + 1,
        page: 0,
      }));
    } else if (!isFallback && inCart) {
      setGlobalState(prev => ({ ...prev, isSearchingCart: true, aiStatus: t('SEARCHING') })); 
    }

    const session = sessions[currentSessionIndex];
    const currentProducts = inCart ? globalState.cartItems : (session?.liveProducts || []);
    
    // For cart, selectedProductObj might be one of the selected cart items if we are chatting about it
    // If only one item is selected in cart, we can use that as context, else null.
    let selectedProductObj = null;
    if (inCart && globalState.selectedCartItems.length === 1) {
      selectedProductObj = currentProducts.find(p => p.id === globalState.selectedCartItems[0]) || null;
    } else if (!inCart) {
      selectedProductObj = session?.liveProducts?.find(p => p.id === session?.selectedProduct) || null;
    }

    const currentHistory = inCart ? globalState.cartHistory : (session?.history || []);
    const formattedHistory = currentHistory.flatMap(h => [
      { role: 'user', content: h.query },
      { role: 'assistant', content: h.aiReasoning ? `Reasoning: ${h.aiReasoning}\nSearched for: ${h.aiActualSearchQuery || 'Unknown'}\nFound: ${h.products.length} products.` : `Found ${h.products.length} products.` }
    ]) || [];

    try {
      const agentResult = await parseUserQuery(query, formattedHistory, enablePostFilter, locale, currentProducts, globalState.cartItems, selectedProductObj);
      
      if (agentResult.debugLogs && agentResult.debugLogs.length > 0) {
        const mcpModule = await import('../lib/kapruka-mcp');
        agentResult.debugLogs.forEach((log: any) => {
          mcpModule.addDebugLog(log.type, log.tool, log.payload);
        });
      }

      if (agentResult.intent && agentResult.intent !== 'search') {
        if (!inCart) {
          updateSession((prev) => ({ ...prev, isSearching: false, aiStatus: '' }));
        }
        
        let actionMessage = '';
        if (agentResult.intent === 'add_to_cart') {
          setGlobalState((prev) => {
            const ids = agentResult.targetProductIds || [];
            const newProducts = currentProducts.filter(p => ids.includes(p.id));
            if (newProducts.length === 0) return prev;
            return { ...prev, cartItems: [...prev.cartItems, ...newProducts], showCart: true };
          });
          const count = agentResult.targetProductIds?.length || 0;
          actionMessage = count > 1 ? `${count} items added to cart.` : 'Item added to cart.';
        } else if (agentResult.intent === 'remove_from_cart') {
          setGlobalState(prev => {
            const ids = agentResult.targetProductIds || [];
            return { ...prev, cartItems: prev.cartItems.filter(item => !ids.includes(item.id)) };
          });
          const count = agentResult.targetProductIds?.length || 0;
          actionMessage = count > 1 ? `${count} items removed from cart.` : 'Item removed from cart.';
        } else if (agentResult.intent === 'checkout') {
          setGlobalState(prev => ({ ...prev, showCheckout: true }));
          actionMessage = 'Proceeding to checkout.';
        } else if (agentResult.intent === 'update_checkout') {
          setGlobalState(prev => {
            const newDetails = { ...prev.checkoutDetails };
            if (agentResult.checkoutDetails?.recipientName) newDetails.recipientName = agentResult.checkoutDetails.recipientName;
            if (agentResult.checkoutDetails?.recipientPhone) newDetails.recipientPhone = agentResult.checkoutDetails.recipientPhone;
            if (agentResult.checkoutDetails?.city) newDetails.city = agentResult.checkoutDetails.city;
            if (agentResult.checkoutDetails?.deliveryDate) newDetails.deliveryDate = agentResult.checkoutDetails.deliveryDate;
            if (agentResult.checkoutDetails?.giftMessage) newDetails.giftMessage = agentResult.checkoutDetails.giftMessage;
            return { ...prev, checkoutDetails: newDetails };
          });
          actionMessage = 'Checkout details updated based on your input.';
        } else if (agentResult.intent === 'answer') {
          actionMessage = agentResult.aiStatusMessage || 'Here is the information you requested.';
        }

        const newHistoryItem = {
          query: originalQuery || query,
          aiStatus: actionMessage,
          products: currentProducts,
          categories: inCart ? [] : session?.liveCategories || []
        };

        if (inCart) {
          setGlobalState(prev => ({ ...prev, isSearchingCart: false, cartHistory: [...prev.cartHistory, newHistoryItem] }));
        } else {
          updateSession(prev => ({
            ...prev,
            history: [...prev.history, newHistoryItem]
          }));
        }
        return;
      }

      if (!inCart) {
        updateSession((prev) => ({ ...prev, aiStatus: agentResult.aiStatusMessage }));

        const cats = agentResult.suggestedCategories && agentResult.suggestedCategories.length > 0
            ? agentResult.suggestedCategories
            : [];

        if (cats.length > 0) {
          updateSession(prev => ({ ...prev, liveCategories: cats, selectedProduct: null }));
        } else {
          updateSession(prev => ({ ...prev, selectedProduct: null }));
        }
      }

      const mapped: Product[] = (agentResult.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        position: { x: 0, y: 0 },
      }));

      if (mapped.length === 0 && !isFallback) {
        const hasHistory = currentHistory.length > 0;
        let fallbackQuery = '';
        if (hasHistory) {
            fallbackQuery = "The previous search returned 0 products. Based on our past conversation, please suggest a completely different alternative gift that is very popular and likely to be in stock.";
        } else {
            const randomQueries = ["Surprise me with completely different gift ideas!", "Show me random best sellers", "I'm not sure, inspire me!"];
            fallbackQuery = randomQueries[Math.floor(Math.random() * randomQueries.length)];
        }
        
        // Trigger fallback search and return
        handleSubmit(fallbackQuery, enablePostFilter, true, originalQuery || query);
        return;
      }

      if (mapped.length > 0) {
        if (!inCart) {
          updateSession(prev => ({ ...prev, liveProducts: mapped }));
        }
      }

      // Background fetch
      if (!inCart) {
        (async () => {
          const updatedProducts = [...mapped];
          for (let i = 0; i < mapped.length; i++) {
            try {
              const details = await import('../lib/kapruka-mcp').then(m => m.getProduct(mapped[i].id));
              if (details) {
                updatedProducts[i] = { 
                  ...updatedProducts[i], 
                  details, 
                  image: details.image || updatedProducts[i].image
                };
                updateSession(prev => ({ ...prev, liveProducts: [...updatedProducts] }));
              }
            } catch (e) {}
            await new Promise((r) => setTimeout(r, 800));
          }
        })();
      }
      
      const statusMsg = agentResult.aiStatusMessage || `Found ${mapped.length} results for "${agentResult.searchQuery}"`;
      
      const newHistoryItemFull = {
        query: originalQuery || query,
        aiStatus: mapped.length === 0 ? '' : statusMsg,
        products: mapped.length === 0 ? currentProducts : mapped,
        categories: (!inCart && agentResult.suggestedCategories && agentResult.suggestedCategories.length > 0) ? agentResult.suggestedCategories : (session?.liveCategories || []),
        errorMessage: mapped.length === 0 
          ? (currentProducts.length > 0 ? '0 products found. Reverting to previous search.' : (agentResult.reasoning || '0 products found. Try a different wish.'))
          : undefined,
        aiReasoning: mapped.length > 0 ? agentResult.reasoning : undefined,
        aiRecipient: mapped.length > 0 ? agentResult.recipient : undefined,
        aiActualSearchQuery: mapped.length > 0 ? agentResult.actualSearchQuery : undefined,
        aiOriginalSearchQuery: mapped.length > 0 ? agentResult.originalSearchQuery : undefined,
        aiPostFilterReasoning: mapped.length > 0 ? agentResult.postFilterReasoning : undefined,
        followUpQuestions: mapped.length > 0 ? agentResult.followUpQuestions : undefined,
        searchParameters: mapped.length > 0 ? agentResult.searchParameters : undefined,
      };

      if (inCart) {
         setGlobalState(prev => ({
           ...prev,
           isSearchingCart: false,
           cartHistory: [...prev.cartHistory, newHistoryItemFull]
         }));
      } else {
         updateSession((prev) => {
           if (mapped.length === 0) {
             return {
               ...prev,
               isSearching: false,
               aiStatus: '',
               history: [...prev.history, newHistoryItemFull]
             };
           }
           
           return {
             ...prev,
             isSearching: false,
             aiStatus: '',
             productSeed: prev.productSeed + 1,
             aiReasoning: agentResult.reasoning,
             aiRecipient: agentResult.recipient,
             aiActualSearchQuery: agentResult.actualSearchQuery,
             aiOriginalSearchQuery: agentResult.originalSearchQuery,
             aiPostFilterReasoning: agentResult.postFilterReasoning,
             followUpQuestions: agentResult.followUpQuestions,
             searchParameters: agentResult.searchParameters,
             history: [...prev.history, newHistoryItemFull]
           };
         });
      }
    } catch (err) {
      console.error('[Kapruka MCP] search failed:', err);
      const errorItem = {
        query: originalQuery || query,
        aiStatus: '',
        products: currentProducts,
        categories: inCart ? [] : session?.liveCategories || [],
        errorMessage: 'Search failed due to an API error (Rate limit exceeded). Please try again in a minute.',
      };
      
      if (inCart) {
        setGlobalState(prev => ({ ...prev, isSearchingCart: false, cartHistory: [...prev.cartHistory, errorItem] }));
      } else {
        updateSession((prev) => ({
          ...prev,
          isSearching: false,
          aiStatus: '',
          history: [...prev.history, errorItem]
        }));
      }
    }
  }, [updateSession, locale, t, sessions, currentSessionIndex, globalState]);

  const refineProducts = useCallback(async (query?: string) => {
    const session = sessions[currentSessionIndex];
    if (!session) return;
    const q = query || session.searchQuery;
    updateSession(prev => ({ ...prev, productSeed: prev.productSeed + 1 }));
    handleSubmit(q);
  }, [sessions, currentSessionIndex, updateSession, handleSubmit]);



  const removeFromCart = useCallback((productId: string) => {
    setGlobalState(prev => {
      return { ...prev, cartItems: prev.cartItems.filter(item => item.id !== productId) };
    });
  }, []);

  const restoreHistory = useCallback((index: number) => {
    updateSession(prev => {
      const snap = prev.history[index];
      if (!snap) return prev;
      return {
        ...prev,
        liveProducts: snap.products,
        liveCategories: snap.categories,
        aiStatus: snap.aiStatus,
        searchQuery: snap.query,
        aiReasoning: snap.aiReasoning,
        aiRecipient: snap.aiRecipient,
        aiActualSearchQuery: snap.aiActualSearchQuery,
        aiOriginalSearchQuery: snap.aiOriginalSearchQuery,
        aiPostFilterReasoning: snap.aiPostFilterReasoning,
        followUpQuestions: snap.followUpQuestions,
        searchParameters: snap.searchParameters,
        history: prev.history // do not truncate
      };
    });
  }, [updateSession]);

  const selectProduct = useCallback((productId: string | null) => {
    updateSession((prev) => ({ ...prev, selectedProduct: productId }));
  }, [updateSession]);

  const addToCart = useCallback((productId: string) => {
    const session = sessions[currentSessionIndex];
    const product = session?.liveProducts.find(p => p.id === productId);
    if (!product) return;

    setGlobalState((prev) => ({
      ...prev,
      cartItems: [...prev.cartItems, product],
      showCart: true,
    }));
  }, [sessions, currentSessionIndex]);

  const toggleCart = useCallback(() => {
    setGlobalState((prev) => ({ ...prev, showCart: !prev.showCart }));
  }, []);

  const toggleCartItemSelection = useCallback((productId: string) => {
    setGlobalState((prev) => {
      const isSelected = prev.selectedCartItems.includes(productId);
      if (isSelected) {
        return { ...prev, selectedCartItems: prev.selectedCartItems.filter(id => id !== productId) };
      } else {
        return { ...prev, selectedCartItems: [...prev.selectedCartItems, productId] };
      }
    });
  }, []);

  const clearCartSelection = useCallback(() => {
    setGlobalState(prev => ({ ...prev, selectedCartItems: [] }));
  }, []);

  const proceedToCheckout = useCallback(() => {
    setGlobalState((prev) => ({ ...prev, showCheckout: true }));
  }, []);

  const confirmOrder = useCallback(() => {
    setGlobalState((prev) => ({
      ...prev,
      showConfirmation: true,
      showCheckout: false,
      showCart: false,
    }));
  }, []);

  const cancelCheckout = useCallback(() => {
    setGlobalState((prev) => ({ ...prev, showCheckout: false }));
  }, []);

  const closeConfirmation = useCallback(() => {
    setGlobalState((prev) => ({ ...prev, showConfirmation: false }));
  }, []);

  const updateCheckoutDetails = useCallback((updates: Partial<CheckoutDetails>) => {
    setGlobalState((prev) => ({
      ...prev,
      checkoutDetails: { ...prev.checkoutDetails, ...updates }
    }));
  }, []);

  const updateInput = useCallback((value: string) => {
    updateSession((prev) => ({ ...prev, inputValue: value }));
  }, [updateSession]);

  const nextPage = useCallback(() => {
    updateSession((prev) => ({ ...prev, page: prev.page + 1, productSeed: prev.productSeed + 1 }));
  }, [updateSession]);

  const prevPage = useCallback(() => {
    updateSession((prev) => ({ ...prev, page: Math.max(0, prev.page - 1), productSeed: prev.productSeed + 1 }));
  }, [updateSession]);

  const goToNextSession = useCallback(() => {
    if (currentSessionIndex === sessions.length - 1) {
      const newSession = createNewSession(0);
      setSessions(prev => [...prev, newSession]);
      setCurrentSessionIndex(sessions.length);
    } else {
      setSessions(prev => {
        const current = prev[currentSessionIndex];
        if (current && current.history.length === 0 && current.stage === 0) {
          const newSessions = [...prev];
          newSessions.splice(currentSessionIndex, 1);
          return newSessions;
        }
        return prev;
      });
      // If we deleted the current session, the next session is now at the same index
      // If we didn't, the next session is at currentSessionIndex + 1
      setCurrentSessionIndex(prevIdx => {
        const current = sessions[prevIdx];
        if (current && current.history.length === 0 && current.stage === 0) {
          return prevIdx;
        }
        return prevIdx + 1;
      });
    }
  }, [currentSessionIndex, sessions]);

  const goToPrevSession = useCallback(() => {
    if (currentSessionIndex > 0) {
      setSessions(prev => {
        const current = prev[currentSessionIndex];
        if (current && current.history.length === 0 && current.stage === 0) {
          const newSessions = [...prev];
          newSessions.splice(currentSessionIndex, 1);
          return newSessions;
        }
        return prev;
      });
      setCurrentSessionIndex(prev => prev - 1);
    }
  }, [currentSessionIndex]);

  const deleteSessionByIndex = useCallback((indexToDelete: number) => {
    setSessions(prevSessions => {
      const newSessions = [...prevSessions];
      newSessions.splice(indexToDelete, 1);
      if (newSessions.length === 0) {
        newSessions.push(createNewSession(0));
      }
      
      setCurrentSessionIndex(current => {
        if (current === indexToDelete) {
          return Math.max(0, Math.min(current, newSessions.length - 1));
        } else if (current > indexToDelete) {
          return current - 1;
        }
        return current;
      });
      
      return newSessions;
    });
  }, []);

  const deleteSession = useCallback(() => {
    deleteSessionByIndex(currentSessionIndex);
  }, [currentSessionIndex, deleteSessionByIndex]);

  const currentSession = sessions[currentSessionIndex];
  const currentConfig = currentSession ? stageConfigs[currentSession.stage] : stageConfigs[0];
  const pageSize = 20;

  const state = useMemo(() => {
    return {
      ...(currentSession || createNewSession(0)),
      ...globalState,
      isSearching: globalState.showCart ? !!globalState.isSearchingCart : (currentSession?.isSearching || false)
    };
  }, [currentSession, globalState]);

  const selectSession = useCallback((index: number) => {
    if (index === currentSessionIndex) return;
    const current = sessions[currentSessionIndex];
    const isCurrentEmpty = current && current.history.length === 0 && current.stage === 0;
    
    if (isCurrentEmpty) {
      setSessions(prev => {
        const newSessions = [...prev];
        newSessions.splice(currentSessionIndex, 1);
        return newSessions;
      });
      setCurrentSessionIndex(index > currentSessionIndex ? index - 1 : index);
    } else {
      setCurrentSessionIndex(index);
    }
  }, [currentSessionIndex, sessions]);

  return {
    state,
    updateCheckoutDetails,
    advanceStage,
    refineProducts,
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
    nextPage,
    prevPage,
    pageSize,
    currentConfig,
    products: currentSession ? currentSession.liveProducts.slice(currentSession.page * pageSize, (currentSession.page + 1) * pageSize) : [],
    totalProducts: currentSession ? currentSession.liveProducts.length : 0,
    liveCategories: currentSession ? currentSession.liveCategories : [],
    history: currentSession ? currentSession.history : [],
    restoreHistory,
    sessions,
    currentSessionIndex,
    selectSession,
    goToNextSession,
    goToPrevSession,
    deleteSession,
    deleteSessionByIndex,
    toggleCartItemSelection,
    clearCartSelection,
  };
}