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
  aiPostFilterReasoning?: string;
  followUpQuestions?: string[];
  searchParameters?: {key: string, value: string}[];
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
  aiPostFilterReasoning?: string;
  followUpQuestions?: string[];
  searchParameters?: {key: string, value: string}[];
  page: number;
  liveProducts: Product[];
  liveCategories: string[];
  history: HistorySnapshot[];
}

export interface GlobalState {
  cartItems: Product[];
  showCart: boolean;
  showCheckout: boolean;
  showConfirmation: boolean;
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
    if (saved) return JSON.parse(saved);
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

  const [globalState, setGlobalState] = useState<GlobalState>({
    cartItems: loadCart(),
    showCart: screenInit.showCart ?? false,
    showCheckout: screenInit.showCheckout ?? false,
    showConfirmation: screenInit.showConfirmation ?? false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(globalState.cartItems));
    }
  }, [globalState.cartItems]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      localStorage.setItem(SESSION_INDEX_KEY, currentSessionIndex.toString());
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

  const handleSubmit = useCallback(async (query: string, enablePostFilter: boolean = false) => {
    if (!query.trim()) return;

    updateSession((prev) => ({
      ...prev,
      stage: 3,
      visibleBlocks: scenarioBlocks.filter((b) => b.stage <= 3),
      isSearching: true,
      aiStatus: t('SEARCHING'),
      searchQuery: query,
      inputValue: '',
      productSeed: prev.productSeed + 1,
      selectedProduct: null,
      page: 0,
    }));

    const session = sessions[currentSessionIndex];
    const formattedHistory = session?.history.flatMap(h => [
      { role: 'user', content: h.query },
      { role: 'assistant', content: h.aiReasoning ? `Reasoning: ${h.aiReasoning}\nSearched for: ${h.aiActualSearchQuery || 'Unknown'}\nFound: ${h.products.length} products.` : `Found ${h.products.length} products.` }
    ]) || [];

    try {
      const agentResult = await parseUserQuery(query, formattedHistory, enablePostFilter, locale);
      updateSession((prev) => ({ ...prev, aiStatus: agentResult.aiStatusMessage }));

      const cats = agentResult.suggestedCategories && agentResult.suggestedCategories.length > 0
          ? agentResult.suggestedCategories
          : [];

      if (cats.length > 0) {
        updateSession(prev => ({ ...prev, liveCategories: cats }));
      }

      const mapped: Product[] = (agentResult.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        position: { x: 0, y: 0 },
      }));

      updateSession(prev => ({ ...prev, liveProducts: mapped }));

      // Background fetch
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
      
      const statusMsg = `Found ${mapped.length} results for "${agentResult.searchQuery}"`;
      
      updateSession((prev) => ({
        ...prev,
        isSearching: false,
        aiStatus: statusMsg,
        productSeed: prev.productSeed + 1,
        aiReasoning: agentResult.reasoning,
        aiRecipient: agentResult.recipient,
        aiActualSearchQuery: agentResult.actualSearchQuery,
        aiPostFilterReasoning: agentResult.postFilterReasoning,
        followUpQuestions: agentResult.followUpQuestions,
        searchParameters: agentResult.searchParameters,
        history: [
          ...prev.history,
          {
            query: query,
            aiStatus: statusMsg,
            products: mapped,
            categories: cats.length > 0 ? cats : prev.liveCategories,
            aiReasoning: agentResult.reasoning,
            aiRecipient: agentResult.recipient,
            aiActualSearchQuery: agentResult.actualSearchQuery,
            aiPostFilterReasoning: agentResult.postFilterReasoning,
            followUpQuestions: agentResult.followUpQuestions,
            searchParameters: agentResult.searchParameters,
          }
        ]
      }));

      setTimeout(() => {
        updateSession((prev) => ({ ...prev, aiStatus: '' }));
      }, 3000);
    } catch (err) {
      console.error('[Kapruka MCP] search failed:', err);
      updateSession((prev) => ({
        ...prev,
        isSearching: false,
        aiStatus: 'Search failed — showing cached products',
      }));
      setTimeout(() => {
        updateSession((prev) => ({ ...prev, aiStatus: '' }));
      }, 3000);
    }
  }, [updateSession, locale, t, sessions, currentSessionIndex]);

  const refineProducts = useCallback(async (query?: string) => {
    const session = sessions[currentSessionIndex];
    if (!session) return;
    const q = query || session.searchQuery;
    updateSession(prev => ({ ...prev, productSeed: prev.productSeed + 1 }));
    handleSubmit(q);
  }, [sessions, currentSessionIndex, updateSession, handleSubmit]);

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
        history: prev.history.slice(0, index + 1)
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
      setCurrentSessionIndex(prev => prev + 1);
    }
  }, [currentSessionIndex, sessions.length]);

  const goToPrevSession = useCallback(() => {
    if (currentSessionIndex > 0) {
      setCurrentSessionIndex(prev => prev - 1);
    }
  }, [currentSessionIndex]);

  const deleteSession = useCallback(() => {
    setSessions(prevSessions => {
      const newSessions = [...prevSessions];
      newSessions.splice(currentSessionIndex, 1);
      if (newSessions.length === 0) {
        newSessions.push(createNewSession(0));
      }
      
      setCurrentSessionIndex(current => {
        if (current >= newSessions.length) {
          return Math.max(0, newSessions.length - 1);
        }
        return current;
      });
      
      return newSessions;
    });
  }, [currentSessionIndex]);

  const currentSession = sessions[currentSessionIndex];
  const currentConfig = currentSession ? stageConfigs[currentSession.stage] : stageConfigs[0];
  const pageSize = 20;

  const state = useMemo(() => {
    return {
      ...(currentSession || createNewSession(0)),
      ...globalState,
    };
  }, [currentSession, globalState]);

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
    goToNextSession,
    goToPrevSession,
    deleteSession,
  };
}