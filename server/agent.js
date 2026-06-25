const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from parent directory
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

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
    const sessionId = initRes.headers.get('mcp-session-id');

    // 2. Call tool
    const callRes = await fetch(KAPRUKA_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId || ''
      },
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

    // Handle SSE chunked response parsing
    const reader = callRes.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.result && data.result.content) {
              result += data.result.content.map(c => c.text).join('');
            }
          } catch (e) {
            // ignore JSON parse errors in chunks
          }
        }
      }
    }
    
    return result || 'No products found.';
  } catch (error) {
    console.error('Kapruka MCP execution failed:', error);
    return `Search failed: ${error.message}`;
  }
}

const searchTool = {
  functionDeclarations: [
    {
      name: 'kapruka_search_products',
      description: 'Search for products on Kapruka. Use this to find items the user wants. If it returns 0 products, you should retry with a different or broader query (e.g. if "flower clock" fails, try "flower" or "clock").',
      parameters: {
        type: 'OBJECT',
        properties: {
          q: { type: 'STRING', description: 'The search query' }
        },
        required: ['q']
      }
    }
  ]
};

async function processChat(message, history) {
  let context = "Conversation History:\n";
  if (history && history.length > 0) {
    context += history.join('\n') + '\n\n';
  }
  
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are the Kapruka AI Shopping Assistant. The user wants to find products on Kapruka (Sri Lanka's largest e-commerce platform).
Your job is to search for what they want using the kapruka_search_products tool.
IMPORTANT: You MUST search using the tool first. 
If the tool returns "No products found", you MUST call the tool again with a DIFFERENT, broader query. Do not give up immediately. Keep trying different synonyms up to 3 times.
Once you have found products (or exhausted your retries), you must output a JSON response matching exactly this schema:
{
  "products": [ { "id": "...", "name": "...", "price": ..., "image": "...", "category": "...", "stock": true } ],
  "categories": ["Flowers", "Cakes", "Giftsets", "Electronics", "Clothing"] // 4-6 categories that match the user's occasion/intent
}
Extract the product array exactly as returned by the tool (it returns markdown JSON).
DO NOT wrap the output in markdown \`\`\`json blocks. Just raw JSON text.`,
      tools: [searchTool],
      temperature: 0.2
    }
  });

  const prompt = `${context}User: ${message}`;
  let response = await chat.sendMessage({ message: prompt });
  
  // Agent loop for tool calls
  let maxTurns = 5;
  while (response.functionCalls && response.functionCalls.length > 0 && maxTurns > 0) {
    const call = response.functionCalls[0];
    if (call.name === 'kapruka_search_products') {
      console.log(`[Agent] Calling tool: ${call.name} with args:`, call.args);
      const toolResult = await executeKaprukaSearch(call.args);
      console.log(`[Agent] Tool returned: ${toolResult.substring(0, 100)}...`);
      
      response = await chat.sendMessage({
        message: [{
          functionResponse: {
            name: call.name,
            response: { result: toolResult }
          }
        }]
      });
    }
    maxTurns--;
  }

  let finalOutput = response.text;
  
  // Clean up markdown block if present
  finalOutput = finalOutput.trim();
  if (finalOutput.startsWith('```json')) finalOutput = finalOutput.slice(7);
  if (finalOutput.startsWith('```')) finalOutput = finalOutput.slice(3);
  if (finalOutput.endsWith('```')) finalOutput = finalOutput.slice(0, -3);

  try {
    return JSON.parse(finalOutput.trim());
  } catch (e) {
    console.error("Failed to parse JSON response from agent. Raw response:", finalOutput);
    return { products: [], categories: [] };
  }
}

module.exports = { processChat };
