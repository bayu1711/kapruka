export interface AgentResult {
  intent?: 'search' | 'add_to_cart' | 'remove_from_cart' | 'checkout';
  targetProductId?: string;
  searchQuery: string;
  suggestedCategories: string[];
  aiStatusMessage: string;
  products?: any[];
  reasoning?: string;
  recipient?: string;
  actualSearchQuery?: string;
  originalSearchQuery?: string;
  postFilterReasoning?: string;
  followUpQuestions?: string[];
  searchParameters?: {key: string, value: string}[];
}

export async function parseUserQuery(
  userMessage: string, 
  history: { role: string; content: string }[] = [],
  enablePostFilter: boolean = false, 
  language: string = 'en-US',
  visibleProducts: any[] = [],
  cartItems: any[] = []
): Promise<AgentResult> {
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, history, enablePostFilter, language, visibleProducts, cartItems })
    });
    
    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    return {
      intent: data.intent,
      targetProductId: data.targetProductId,
      searchQuery: userMessage, 
      actualSearchQuery: data.searchQuery, // The actual query Gemini used
      originalSearchQuery: data.originalSearchQuery,
      suggestedCategories: data.categories || [],
      aiStatusMessage: data.intent && data.intent !== 'search' ? '' : `Found ${data.products ? data.products.length : 0} items`,
      products: data.products || [],
      reasoning: data.reasoning,
      recipient: data.recipient,
      postFilterReasoning: data.postFilterReasoning,
      followUpQuestions: data.followUpQuestions || [],
      searchParameters: data.searchParameters || []
    };

  } catch (err) {
    console.error('Backend agent processing failed:', err);
    // Fallback
    return {
      intent: 'search',
      searchQuery: userMessage,
      suggestedCategories: [],
      aiStatusMessage: 'Search failed',
      products: []
    };
  }
}
