const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { z } = require('zod');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from parent directory
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const OutputSchema = z.object({
  intent: z.enum(['search', 'add_to_cart', 'remove_from_cart', 'checkout', 'answer']).optional().describe("The user's core intent. Default is 'search'. Use 'add_to_cart' or 'remove_from_cart' if they want to manage items they see on the screen. Use 'checkout' if they want to finalize their order or pay. Use 'answer' if the user is asking a question about a product or seeking information rather than taking an action."),
  targetProductIds: z.array(z.string()).optional().describe("If intent is add_to_cart or remove_from_cart, the exact IDs of the products from the current screen context."),
  answer: z.string().optional().describe("If intent is 'answer', provide the answer to the user's question here. Be conversational, concise, and helpful."),
  reasoning: z.string().describe("Analyze the recipient and occasion. Explain what types of gifts are appropriate vs inappropriate, and why you are choosing the specific Kapruka search query."),
  recipient: z.string().describe("Who the gift is for (e.g. mother, friend, self, unspecified)"),
  searchQuery: z.string().describe("The specific Kapruka search term (e.g. 'roses', 'birthday cake', 'saree')"),
  categories: z.array(z.string()).describe("4-6 matching categories"),
  searchParameters: z.array(z.object({
    key: z.string().describe("The name of the parameter, e.g. 'occasion', 'recipient', 'max_price', 'color'"),
    value: z.string().describe("The value of the parameter, e.g. 'Birthday', 'Mother', '200000', 'red'")
  })).describe("An array of ALL extracted contextual facts and constraints (occasion, recipient, relationship, budget, style, etc). This MUST be populated if any context exists."),
  followUpQuestions: z.array(z.string()).describe("2 to 3 leading/follow-up questions to ask the user next, to help refine their wish. e.g. 'Under what budget?' or 'Is it for a boy or a girl?'")
});

const PostFilterSchema = z.object({
  postFilterReasoning: z.string().describe("Reasoning for which products are irrelevant/wrong model and why they are being removed."),
  invalidProductIds: z.array(z.string()).describe("Array of product IDs that should be deleted because they are completely irrelevant to the user's specific request.")
});

const KAPRUKA_MCP_URL = 'https://mcp.kapruka.com/mcp';

async function executeKaprukaSearch(args, debugLogs = []) {
  try {
    // 1. Initialize session
    const initBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'agent', version: '1.0' } }
    };
    debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'request', tool: 'initialize', payload: initBody });

    const initRes = await fetch(KAPRUKA_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(initBody)
    });
    
    if (!initRes.ok) throw new Error('Init failed');
    const sessionId = initRes.headers.get('mcp-session-id');
    const initText = await initRes.text();
    debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'response', tool: 'initialize', payload: { sessionId, rawSSE: initText } });

    // 2. Initialized notification
    if (sessionId) {
      const notifyBody = { jsonrpc: '2.0', method: 'notifications/initialized', params: {} };
      debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'request', tool: 'notifications/initialized', payload: notifyBody });
      await fetch(KAPRUKA_MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'mcp-session-id': sessionId
        },
        body: JSON.stringify(notifyBody)
      }).catch(() => {});
    }

    // 3. Call tool
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };
    if (sessionId) headers['mcp-session-id'] = sessionId;

    const callBody = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'kapruka_search_products',
        arguments: { params: { currency: 'LKR', limit: 40, ...args } }
      }
    };
    debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'request', tool: 'kapruka_search_products', payload: callBody });

    const callRes = await fetch(KAPRUKA_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(callBody)
    });
    
    if (!callRes.ok) {
        if (callRes.status === 429 || callRes.status === 400) {
            const errText = `Rate limit or Bad Request from Kapruka API. Status: ${callRes.status}`;
            debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'error', tool: 'kapruka_search_products', payload: { message: errText } });
            return `Rate limit or Bad Request from Kapruka API. Status: ${callRes.status}. Please try a broader query or wait a moment.`;
        }
        throw new Error(`MCP HTTP error ${callRes.status}`);
    }

    const contentType = callRes.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      const text = await callRes.text();
      debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'response', tool: 'kapruka_search_products', payload: { rawSSE: text } });
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
    debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'response', tool: 'kapruka_search_products', payload: json });
    if (json.error) {
      throw new Error(`MCP error: ${json.error.message}`);
    }
    
    if (json.result && json.result.content && json.result.content.length > 0) {
        return json.result.content[0].text;
    }
    return 'No products found.';
  } catch (error) {
    console.error('Kapruka MCP execution failed:', error);
    debugLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'error', tool: 'kapruka_search_products', payload: { message: error.message } });
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

    const urlMatch = block.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
    const url = urlMatch ? urlMatch[1] : undefined;
    
    // Extract image directly from markdown if MCP provided it (e.g., **Image**: https://... or ![Image](https://...))
    const imgExplicitMatch = block.match(/\*\*Image\*\*:\s*(https?:\/\/\S+)/) || block.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
    let image = '';
    if (imgExplicitMatch) {
      image = imgExplicitMatch[1].trim();
    } else {
      const parts = urlMatch ? urlMatch[1].split('/kid/') : [];
      const imgId = parts.length > 1 ? parts[1].split('/').pop() : null; // Get only the ID part, drop category prefix
      image = imgId ? `https://www.kapruka.com/cdn-cgi/image/width=300,quality=90,format=auto/shops/specialGifts/productImages/${imgId}.jpg` : '';
    }

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
    const imgId = parts.length > 1 ? parts[1].split('/').pop() : null;
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

let currentKeyIndex = 0;

async function invokeWithFallback(schema, outputName, messages) {
  let apiKeys = [];
  if (process.env.VITE_GEMINI_API_KEYS) {
    apiKeys = process.env.VITE_GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
  } else if (process.env.VITE_GEMINI_API_KEY) {
    apiKeys = [process.env.VITE_GEMINI_API_KEY];
  }
  
  if (apiKeys.length === 0) throw new Error('No API keys found');

  let attempts = 0;
  while (attempts < apiKeys.length) {
    try {
      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0.3,
        apiKey: apiKeys[currentKeyIndex]
      });
      const structuredLlm = llm.withStructuredOutput(schema, { name: outputName });
      return await structuredLlm.invoke(messages);
    } catch (e) {
      console.error(`[Agent] Error with API key index ${currentKeyIndex}:`, e.message);
      if (e.message && e.message.includes('429')) {
        console.log('[Agent] Rate limit hit (429). Switching to next API key...');
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        attempts++;
      } else {
        throw e;
      }
    }
  }
  throw new Error('All available API keys have hit their rate limits.');
}

async function processChat(message, history, enablePostFilter = false, language = 'en-US', visibleProducts = [], cartItems = [], selectedProduct = null) {
  let internalSystemLog = "";
  let finalProducts = [];
  let suggestedCategories = [];
  let finalReasoning = "";
  let finalRecipient = "";
  let finalSearchQuery = "";
  let finalOriginalSearchQuery = "";
  let finalPostFilterReasoning = "";
  let finalFollowUpQuestions = [];
  let finalSearchParameters = [];
  let attempt = 0;
  const debugLogs = [];

  while (attempt < 3 && finalProducts.length === 0) {
    attempt++;
    
    const messages = [
      new SystemMessage(`You are the Kapruka AI Shopping Assistant. The user wants to find products on Kapruka (Sri Lanka's largest e-commerce platform).
Your job is to determine the absolute BEST precise search phrase (can be multiple words) based on the user's LATEST request, while using the conversation history for context.

CURRENT SCREEN CONTEXT:
Selected Product (in focus): ${JSON.stringify(selectedProduct)}
Visible Products (user sees these right now): ${JSON.stringify(visibleProducts)}
Cart Items: ${JSON.stringify(cartItems)}

CRITICAL RULES FOR INTENT:
1. If the user wants to buy, add, or get items that are CURRENTLY in the "Visible Products" or "Selected Product", set intent="add_to_cart" and extract their exact IDs into "targetProductIds".
2. If the user wants to remove items from their cart, set intent="remove_from_cart" and set "targetProductIds" to the items' IDs from "Cart Items".
3. If the user says "checkout", "buy now" (without specifying a product), or "pay", set intent="checkout".
4. If the user asks to compare items (e.g., in their cart or visible products), set intent="answer" and write a detailed text comparison of the items' prices, names, and features using the data provided in the context. Do NOT refuse to compare them.
5. If the user is asking a question (e.g. "what is the warranty?", "can this be delivered today?", "tell me about this product") especially when a product is selected, set intent="answer" and provide the answer in the "answer" field. Use information from the "Selected Product" context if available.
6. For all other requests (looking for gifts, exploring, etc), set intent="search".

CRITICAL RULES FOR SEARCH QUERY:
1. NEVER output generic category names like 'toys', 'electronics', 'flowers', or 'gifts'. Kapruka's search engine works best with specific items.
2. If the user intent is vague (e.g. "gift for 5 year old boy"), pick ONE highly specific, popular item type. E.g. use "remote control car" or "lego" instead of "toys".
3. If the user intent is "gift for mom", pick "saree", "handbag", "perfume", or "mother's day cake" instead of "flowers".
4. Extract ALL contextual facts and constraints (like occasion, recipient, budget, brand, style, color, relationship) into the searchParameters array as discrete key-value pairs (e.g. [{key: "occasion", value: "Birthday"}, {key: "recipient", value: "Father"}]). DO NOT write lengthy reasoning paragraphs explaining the context. DO NOT include these constraints in the query itself.
5. The user's preferred language is ${language}. You MUST translate your 'reasoning', 'postFilterReasoning', and 'followUpQuestions' into ${language}. DO NOT translate the 'searchQuery' or 'categories' keys.`)
    ];

    if (history && history.length > 0) {
      history.forEach(msg => {
        if (typeof msg === 'string') {
          messages.push(new HumanMessage(msg));
        } else if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
          messages.push(new AIMessage(msg.content));
        }
      });
    }
    
    const finalUserMessage = internalSystemLog ? `${internalSystemLog}\nUser: ${message}` : `User: ${message}`;
    messages.push(new HumanMessage(finalUserMessage));

    let parsed;
    try {
      parsed = await invokeWithFallback(OutputSchema, "ShoppingPlan", messages);
    } catch (e) {
      console.error("Failed to parse Gemini output via LangChain:", e);
      return { products: [], categories: [], reasoning: '', recipient: '', searchQuery: '' };
    }

    const { intent, targetProductIds, reasoning, recipient, searchQuery, categories, searchParameters, followUpQuestions, answer } = parsed;
    
    let finalIntent = intent || 'search';
    let finalTargetProductIds = targetProductIds || [];
    
    suggestedCategories = categories || [];
    finalReasoning = reasoning || '';
    finalRecipient = recipient || '';
    finalOriginalSearchQuery = searchQuery || '';
    finalSearchQuery = searchQuery || '';
    finalFollowUpQuestions = followUpQuestions || [];
    finalSearchParameters = searchParameters || [];
    
    if (finalIntent === 'add_to_cart' || finalIntent === 'remove_from_cart' || finalIntent === 'checkout' || finalIntent === 'answer') {
      return {
        intent: finalIntent,
        targetProductIds: finalTargetProductIds,
        answer: answer,
        searchQuery: finalSearchQuery,
        originalSearchQuery: finalOriginalSearchQuery,
        categories: suggestedCategories,
        products: [], // no products needed for cart/checkout/answer actions
        reasoning: finalReasoning,
        recipient: finalRecipient,
        postFilterReasoning: finalPostFilterReasoning,
        followUpQuestions: finalFollowUpQuestions,
        searchParameters: finalSearchParameters,
        debugLogs
      };
    }
    
    let finalQueryStr = searchQuery || '';
    const params = {};
    if (searchParameters) {
      searchParameters.forEach(p => {
        if (p.key === 'max_price' || p.key === 'min_price') {
          params[p.key] = p.value;
        } else {
          // Bundle unsupported parameters directly into the main query string
          // Deduplication logic below will handle duplicates
          finalQueryStr += ` ${p.value}`;
        }
      });
    }
    
    
    // Deduplicate words case-insensitively
    const words = finalQueryStr.trim().split(/\s+/);
    const uniqueWords = [];
    const seen = new Set();
    for (const w of words) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueWords.push(w);
      }
    }
    finalQueryStr = uniqueWords.join(' ');
    
    finalSearchQuery = finalQueryStr;

    console.log(`[Agent Attempt ${attempt}] Searching Kapruka for: "${finalQueryStr}" with params:`, params);
    const mcpRawText = await executeKaprukaSearch({ q: finalQueryStr, ...params }, debugLogs);

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
            const filterMessages = [
              new SystemMessage(`The user explicitly asked for: "${message}". You must strictly filter the following Kapruka products. Remove any products that are completely irrelevant or the wrong model (e.g., remove iPhone 17 if they asked for iPhone 13). ONLY remove items that are definitely wrong.`),
              new HumanMessage(JSON.stringify(productListForAi))
            ];
            
            const filterResult = await invokeWithFallback(PostFilterSchema, "PostFilter", filterMessages);
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
    intent: 'search',
    targetProductId: '',
    products: finalProducts, 
    categories: suggestedCategories,
    reasoning: finalReasoning,
    recipient: finalRecipient,
    searchQuery: finalSearchQuery,
    originalSearchQuery: finalOriginalSearchQuery,
    postFilterReasoning: finalPostFilterReasoning,
    followUpQuestions: finalFollowUpQuestions,
    searchParameters: finalSearchParameters,
    debugLogs
  };
}

module.exports = { processChat };
