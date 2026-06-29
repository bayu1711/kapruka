export interface AgentResult {
  searchQuery: string;
  suggestedCategories: string[];
  aiStatusMessage: string;
  products?: any[];
  reasoning?: string;
  recipient?: string;
  actualSearchQuery?: string;
  postFilterReasoning?: string;
  followUpQuestions?: string[];
}

export async function parseUserQuery(
  userMessage: string, 
  history: { role: string; content: string }[] = [],
  enablePostFilter: boolean = false, 
  language: string = 'en-US'
): Promise<AgentResult> {
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, history, enablePostFilter, language })
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
      postFilterReasoning: data.postFilterReasoning,
      followUpQuestions: data.followUpQuestions || []
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
