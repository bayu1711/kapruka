export interface AgentResult {
  searchQuery: string;
  suggestedCategories: string[];
  aiStatusMessage: string;
  products?: any[];
  reasoning?: string;
  recipient?: string;
  actualSearchQuery?: string;
  postFilterReasoning?: string;
}

const chatHistory: string[] = [];

export async function parseUserQuery(userMessage: string, enablePostFilter: boolean = false): Promise<AgentResult> {
  // Keep last 6 messages for context
  chatHistory.push(`User: ${userMessage}`);
  if (chatHistory.length > 6) chatHistory.shift();

  try {
    const res = await fetch('http://localhost:3001/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, history: chatHistory.slice(0, -1), enablePostFilter })
    });
    
    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    return {
      searchQuery: userMessage, 
      actualSearchQuery: data.searchQuery, // The actual query Gemini used
      suggestedCategories: data.categories || [],
      aiStatusMessage: `Found ${data.products ? data.products.length : 0} items`,
      products: data.products || [],
      reasoning: data.reasoning,
      recipient: data.recipient,
      postFilterReasoning: data.postFilterReasoning
    };

  } catch (err) {
    console.error('Backend agent processing failed:', err);
    // Fallback
    return {
      searchQuery: userMessage,
      suggestedCategories: [],
      aiStatusMessage: 'Search failed',
      products: []
    };
  }
}
