const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { z } = require('zod');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from parent directory
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const OutputSchema = z.object({
  reasoning: z.string().describe("Analyze the recipient and occasion. Explain what types of gifts are appropriate vs inappropriate, and why you are choosing the specific Kapruka search query."),
  recipient: z.string().describe("Who the gift is for (e.g. mother, friend, self, unspecified)"),
  searchQuery: z.string().describe("The specific Kapruka search term (e.g. 'roses', 'birthday cake', 'saree')"),
  categories: z.array(z.string()).describe("4-6 matching categories"),
  searchParameters: z.array(z.object({
    key: z.string().describe("The name of the filter, e.g. 'max_price', 'color', 'brand'"),
    value: z.string().describe("The value of the filter, e.g. '200000', 'red', 'Apple'")
  })).optional().describe("Any additional dynamic constraints/filters the user specified")
});

const PostFilterSchema = z.object({
  postFilterReasoning: z.string().describe("Reasoning for which products are irrelevant/wrong model and why they are being removed."),
  invalidProductIds: z.array(z.string()).describe("Array of product IDs that should be deleted because they are completely irrelevant to the user's specific request.")
});

const KAPRUKA_MCP_URL = 'https://mcp.kapruka.com/mcp';

async function executeKaprukaSearch(args) {
  try {
    // 1. Initialize session
    const initRes = await fetch(KAPRUKA_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agent', version: '1.0' } }
      })
    });
    
    if (!initRes.ok) throw new Error('Init failed');
    const sessionId = initRes.headers.get('mcp-session-id');
    await initRes.text(); // drain

    // 2. Initialized notification
    if (sessionId) {
      await fetch(KAPRUKA_MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'mcp-session-id': sessionId
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })
      }).catch(() => {});
    }

    // 3. Call tool
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };
    if (sessionId) headers['mcp-session-id'] = sessionId;

    const callRes = await fetch(KAPRUKA_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'kapruka_search_products',
          arguments: { params: { currency: 'LKR', limit: 40, ...args } }
        }
      })
    });
    
    if (!callRes.ok) {
        if (callRes.status === 429 || callRes.status === 400) {
            return `Rate limit or Bad Request from Kapruka API. Status: ${callRes.status}. Please try a broader query or wait a moment.`;
        }
        throw new Error(`MCP HTTP error ${callRes.status}`);
    }

    const contentType = callRes.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      const text = await callRes.text();
      const lines = text.split('\n');
      let finalResult = null;
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const json = JSON.parse(line.slice(5).trim());
            console.log('[SSE Chunk JSON]', JSON.stringify(json).substring(0, 300));
            if (json.result && json.result.content && json.result.content.length > 0) {
              finalResult = json.result.content[0].text;
            }
          } catch (e) {
            console.error('[SSE JSON Parse Error]', e.message, 'on chunk:', line.substring(0, 100));
          }
        }
      }
      return finalResult || 'No products found.';
    }

    const json = await callRes.json();
    console.log('[Kapruka API]', JSON.stringify(json).substring(0, 500));
    if (json.error) {
      throw new Error(`MCP error: ${json.error.message}`);
    }
    
    if (json.result && json.result.content && json.result.content.length > 0) {
        return json.result.content[0].text;
    }
    return 'No products found.';
  } catch (error) {
    console.error('Kapruka MCP execution failed:', error);
    return `Search failed: ${error.message}`;
  }
}

function parseMarkdownProducts(text) {
  const products = [];
  const blocks = text.split(/\n(?=\*\*\d+\.)/g);
  for (const block of blocks) {
    const titleMatch = block.match(/\*\*\d+\.\s+(.+?)\*\*/);
    if (!titleMatch) continue;
    const name = titleMatch[1].trim();

    const idMatch = block.match(/ID:\s*`([^`]+)`/);
    const id = idMatch ? idMatch[1] : String(Date.now() + Math.random());

    const priceMatch = block.match(/LKR\s*([\d,]+)/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;

    const urlMatch = block.match(/\[View product\]\(([^)]+)\)/);
    const url = urlMatch ? urlMatch[1] : undefined;
    
    // Extract image if we can, or just let frontend handle placeholder
    const parts = urlMatch ? urlMatch[1].split('/kid/') : [];
    const imgId = parts.length > 1 ? parts[1] : null;
    const image = imgId ? `https://www.kapruka.com/cdn-cgi/image/width=300,quality=90,format=auto/shops/specialGifts/productImages/${imgId}.jpg` : '';

    const inStock = !block.toLowerCase().includes('out of stock');

    products.push({ id, name, price, image, category: '', url, stock: inStock });
  }
  return products;
}const imageCache = new Map();

async function fetchImageForUrl(url) {
  if (!url) return '';
  if (imageCache.has(url)) return imageCache.get(url);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    const html = await res.text();
    const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    let imageUrl = '';
    
    if (match && match[1]) {
      imageUrl = match[1];
    } else {
      const parts = url.split('/kid/');
      const imgId = parts.length > 1 ? parts[1].replace(/[^a-zA-Z0-9]/g, '') : null;
      if (imgId) {
        imageUrl = `https://www.kapruka.com/cdn-cgi/image/width=300,quality=90,format=auto/shops/specialGifts/productImages/${imgId}.jpg`;
      }
    }
    
    imageCache.set(url, imageUrl);
    return imageUrl;
  } catch (e) {
    console.error('Error fetching image for URL', url, e.message);
    const parts = url.split('/kid/');
    const imgId = parts.length > 1 ? parts[1].replace(/[^a-zA-Z0-9]/g, '') : null;
    let fallback = '';
    if (imgId) {
       fallback = `https://www.kapruka.com/cdn-cgi/image/width=300,quality=90,format=auto/shops/specialGifts/productImages/${imgId}.jpg`;
    }
    return fallback;
  }
}

async function enrichProductsWithImages(products) {
  // Fetch up to 20 images at a time (chunked to avoid overwhelming the network)
  return await Promise.all(products.map(async (p) => {
    if (!p.image && p.url) {
      p.image = await fetchImageForUrl(p.url);
    }
    return p;
  }));
}

async function processChat(message, history, enablePostFilter = false) {
  let internalSystemLog = "";
  let finalProducts = [];
  let suggestedCategories = [];
  let finalReasoning = "";
  let finalRecipient = "";
  let finalSearchQuery = "";
  let finalPostFilterReasoning = "";
  let attempt = 0;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.3,
    apiKey: process.env.VITE_GEMINI_API_KEY
  });
  
  const structuredLlm = llm.withStructuredOutput(OutputSchema, { name: "ShoppingPlan" });

  while (attempt < 3 && finalProducts.length === 0) {
    attempt++;
    
    const messages = [
      new SystemMessage(`You are the Kapruka AI Shopping Assistant. The user wants to find products on Kapruka (Sri Lanka's largest e-commerce platform).
Your job is to determine the absolute BEST single search query keyword based on the user's LATEST request, while using the conversation history for context.
Before picking a query, analyze the intent and recipient. Avoid generic terms like 'gift'. Pick concrete, appropriate categories or items (e.g. 'saree', 'perfume', 'cake', 'iPhone').
If the user specifies constraints like budget, brand, or color (e.g., "under 200000", "Apple", "red"), put them in the searchParameters array with clear keys (e.g. "max_price", "brand", "color").`)
    ];

    if (history && history.length > 0) {
      history.forEach(msg => messages.push(new HumanMessage(msg)));
    }
    
    if (internalSystemLog) {
      messages.push(new SystemMessage(internalSystemLog));
    }
    messages.push(new HumanMessage(`User: ${message}`));

    let parsed;
    try {
      parsed = await structuredLlm.invoke(messages);
    } catch (e) {
      console.error("Failed to parse Gemini output via LangChain:", e);
      return { products: [], categories: [], reasoning: '', recipient: '', searchQuery: '' };
    }

    const { reasoning, recipient, searchQuery, categories, searchParameters } = parsed;
    suggestedCategories = categories || [];
    finalReasoning = reasoning || '';
    finalRecipient = recipient || '';
    finalSearchQuery = searchQuery || '';
    const params = {};
    if (searchParameters) {
      searchParameters.forEach(p => { params[p.key] = p.value; });
    }

    console.log(`[Agent Attempt ${attempt}] Searching Kapruka for: "${searchQuery}" with params:`, params);
    const mcpRawText = await executeKaprukaSearch({ q: searchQuery, ...params });

    if (mcpRawText === 'No products found.') {
      console.log(`[Agent Attempt ${attempt}] 0 products. Retrying...`);
      internalSystemLog += `[System Note]: The search query '${searchQuery}' returned 0 products. Please try a completely different, broader synonym or related term.\n`;
    } else {
      let parsedProducts = parseMarkdownProducts(mcpRawText);
      // Wait to fetch the images (will resolve cached or scrape)
      finalProducts = await enrichProductsWithImages(parsedProducts);
      if (finalProducts.length === 0) {
        internalSystemLog += `[System Note]: The search query '${searchQuery}' returned 0 parseable products. Please try a different query.\n`;
      } else {
        console.log(`[Agent Attempt ${attempt}] Found ${finalProducts.length} products!`);
        
        if (enablePostFilter) {
          console.log(`[Agent Attempt ${attempt}] Executing Post-Filter...`);
          try {
            const productListForAi = finalProducts.map(p => ({ id: p.id, name: p.name }));
            const postFilterLlm = llm.withStructuredOutput(PostFilterSchema, { name: "PostFilter" });
            const filterMessages = [
              new SystemMessage(`The user explicitly asked for: "${message}". You must strictly filter the following Kapruka products. Remove any products that are completely irrelevant or the wrong model (e.g., remove iPhone 17 if they asked for iPhone 13). ONLY remove items that are definitely wrong.`),
              new HumanMessage(JSON.stringify(productListForAi))
            ];
            
            const filterResult = await postFilterLlm.invoke(filterMessages);
            finalPostFilterReasoning = filterResult.postFilterReasoning || '';
            const invalidIds = new Set(filterResult.invalidProductIds || []);
            
            console.log(`[Agent Post-Filter] Flagged ${invalidIds.size} products for removal.`);
            finalProducts = finalProducts.filter(p => !invalidIds.has(p.id));
          } catch (err) {
            console.error("Post-Filter failed, skipping:", err);
            finalPostFilterReasoning = "Post-Filter failed to execute.";
          }
        }
        
        break; // Success!
      }
    }
  }

  return { 
    products: finalProducts, 
    categories: suggestedCategories,
    reasoning: finalReasoning,
    recipient: finalRecipient,
    searchQuery: finalSearchQuery,
    postFilterReasoning: finalPostFilterReasoning
  };
}

module.exports = { processChat };
