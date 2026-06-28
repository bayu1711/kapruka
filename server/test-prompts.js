const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { z } = require('zod');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const dotenv = require('dotenv');
const path = require('path');

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

const testCases = [
  "I need a gift for my mom",
  "A birthday gift for a 5-year-old boy under LKR 5000",
  "Anniversary present",
  "Red roses",
  "I want to buy something for myself, maybe electronics",
  "cheap birthday present"
];

async function runTests() {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.3,
    apiKey: process.env.VITE_GEMINI_API_KEY
  });
  
  const structuredLlm = llm.withStructuredOutput(OutputSchema, { name: "ShoppingPlan" });

  console.log("=== RUNNING BASELINE PROMPT TESTS ===\n");

  for (const message of testCases) {
    console.log(`\n--- TEST CASE: "${message}" ---`);
    
    // Exact system message from agent.js
    const messages = [
      new SystemMessage(`You are the Kapruka AI Shopping Assistant. The user wants to find products on Kapruka (Sri Lanka's largest e-commerce platform).
Your job is to determine the absolute BEST precise search phrase (can be multiple words) based on the user's LATEST request, while using the conversation history for context.

CRITICAL RULES FOR SEARCH QUERY:
1. NEVER output generic category names like 'toys', 'electronics', 'flowers', or 'gifts'. Kapruka's search engine works best with specific items.
2. If the user intent is vague (e.g. "gift for 5 year old boy"), pick ONE highly specific, popular item type. E.g. use "remote control car" or "lego" instead of "toys".
3. If the user intent is "gift for mom", pick "saree", "handbag", "perfume", or "mother's day cake" instead of "flowers".
4. If the user specifies constraints like budget, brand, or color, put them in the searchParameters array with clear keys (e.g. "max_price", "brand", "color") and DO NOT include them in the query itself.`),
      new HumanMessage(`User: ${message}`)
    ];

    try {
      const parsed = await structuredLlm.invoke(messages);
      console.log(`Search Query:   "${parsed.searchQuery}"`);
      console.log(`Reasoning:      ${parsed.reasoning}`);
      console.log(`Recipient:      ${parsed.recipient}`);
      if (parsed.searchParameters && parsed.searchParameters.length > 0) {
        console.log(`Filters:        ${JSON.stringify(parsed.searchParameters)}`);
      }
    } catch (e) {
      console.error("Test failed:", e.message);
    }
  }
}

runTests();
