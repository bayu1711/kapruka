/**
 * Kapruka MCP Client
 * Thin wrapper around the public Kapruka MCP endpoint.
 * Transport: Streamable HTTP (JSON-RPC 2.0)
 * Endpoint: https://mcp.kapruka.com/mcp
 * No auth required. Rate limits: 60 req/min, 30 orders/hr per IP.
 */

const MCP_ENDPOINT =
  import.meta.env.DEV
    ? '/api/mcp'                      // Vite proxy → avoids CORS in local dev
    : 'https://mcp.kapruka.com/mcp'; // Direct in production (server-side or deployed)
let _reqId = 1;

// ---------------------------------------------------------------------------
// Core JSON-RPC call
// ---------------------------------------------------------------------------

async function callTool<T = unknown>(
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<T> {
  const id = _reqId++;
  const body = {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: toolArgs,
    },
  };

  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`MCP HTTP error ${res.status}: ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type') ?? '';

  // Handle SSE streaming responses (text/event-stream)
  if (contentType.includes('text/event-stream')) {
    const text = await res.text();
    // Parse the last non-empty `data:` line that contains a result
    const lines = text.split('\n');
    let lastResult: T | null = null;
    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (json.result !== undefined) lastResult = extractContent<T>(json.result);
        } catch {
          // ignore parse errors for non-data SSE lines
        }
      }
    }
    if (lastResult === null) throw new Error('No result in MCP SSE stream');
    return lastResult;
  }

  // Standard JSON response
  const json = await res.json();
  if (json.error) {
    throw new Error(`MCP error [${json.error.code}]: ${json.error.message}`);
  }
  return extractContent<T>(json.result);
}

/** MCP returns content as an array of { type, text } blocks. Extract & parse. */
function extractContent<T>(result: unknown): T {
  if (!result || typeof result !== 'object') return result as T;
  const r = result as Record<string, unknown>;
  const content = r['content'];
  if (Array.isArray(content) && content.length > 0) {
    const block = content[0] as Record<string, unknown>;
    if (block['type'] === 'text' && typeof block['text'] === 'string') {
      try {
        return JSON.parse(block['text']) as T;
      } catch {
        return block['text'] as unknown as T;
      }
    }
  }
  return result as T;
}

// ---------------------------------------------------------------------------
// Public Product interface (mirrors the app's Product type)
// ---------------------------------------------------------------------------

export interface KaprukaMCPProduct {
  id: string;
  name: string;
  price: number;       // in LKR
  image: string;
  category: string;
  url?: string;
  inStock?: boolean;
  description?: string;
  variants?: Array<{ name: string; value: string }>;
}

export interface KaprukaSearchResult {
  products: KaprukaMCPProduct[];
  total: number;
  cursor?: string;
}

export interface KaprukaCategory {
  name: string;
  url?: string;
}

export interface KaprukaDeliveryResult {
  available: boolean;
  fee?: number;         // LKR
  perishableWarning?: boolean;
  message?: string;
}

export interface KaprukaOrderResult {
  orderId: string;
  payUrl: string;
  expiresAt?: string;
}

export interface KaprukaTrackingStep {
  status: string;
  timestamp: string;
  description?: string;
}

export interface KaprukaTrackResult {
  orderNumber: string;
  status: string;
  recipient?: string;
  items?: string[];
  steps: KaprukaTrackingStep[];
}

// ---------------------------------------------------------------------------
// Typed tool wrappers
// ---------------------------------------------------------------------------

/** Search the Kapruka catalog by keyword with optional filters. */
export async function searchProducts(
  q: string,
  opts: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    limit?: number;
    sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  } = {}
): Promise<KaprukaSearchResult> {
  const args: Record<string, unknown> = { q, currency: 'LKR', limit: opts.limit ?? 20 };
  if (opts.category) args['category'] = opts.category;
  if (opts.minPrice !== undefined) args['min_price'] = opts.minPrice;
  if (opts.maxPrice !== undefined) args['max_price'] = opts.maxPrice;
  if (opts.inStockOnly) args['in_stock_only'] = true;
  if (opts.sort) args['sort'] = opts.sort;

  const raw = await callTool<unknown>('kapruka_search_products', args);
  return normaliseSearchResult(raw);
}

/** Fetch full details for a single product. */
export async function getProduct(productId: string): Promise<KaprukaMCPProduct> {
  const raw = await callTool<unknown>('kapruka_get_product', {
    product_id: productId,
    currency: 'LKR',
  });
  return normaliseProduct(raw);
}

/** List top-level categories. */
export async function listCategories(): Promise<KaprukaCategory[]> {
  const raw = await callTool<unknown>('kapruka_list_categories', { depth: 1 });
  return normaliseCategories(raw);
}

/** Search delivery cities by name. */
export async function listDeliveryCities(query: string): Promise<string[]> {
  const raw = await callTool<unknown>('kapruka_list_delivery_cities', {
    query,
    limit: 10,
  });
  return normaliseCities(raw);
}

/** Check delivery availability for a city + date. */
export async function checkDelivery(
  city: string,
  deliveryDate: string, // YYYY-MM-DD
  productId?: string
): Promise<KaprukaDeliveryResult> {
  const args: Record<string, unknown> = { city, delivery_date: deliveryDate };
  if (productId) args['product_id'] = productId;
  const raw = await callTool<unknown>('kapruka_check_delivery', args);
  return normaliseDelivery(raw);
}

/** Create a guest-checkout order and return a click-to-pay URL. */
export async function createOrder(params: {
  productId: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  deliveryDate: string;
  senderName?: string;
  giftMessage?: string;
}): Promise<KaprukaOrderResult> {
  const args = {
    currency: 'LKR',
    cart: [{ product_id: params.productId, quantity: 1 }],
    recipient: {
      name: params.recipientName,
      phone: params.recipientPhone,
    },
    delivery: {
      city: params.city,
      date: params.deliveryDate,
    },
    sender: params.senderName ? { name: params.senderName } : undefined,
    gift_message: params.giftMessage,
  };
  const raw = await callTool<unknown>('kapruka_create_order', args);
  return normaliseOrder(raw);
}

/** Track an existing Kapruka order. */
export async function trackOrder(orderNumber: string): Promise<KaprukaTrackResult> {
  const raw = await callTool<unknown>('kapruka_track_order', { order_number: orderNumber });
  return normaliseTracking(raw);
}

// ---------------------------------------------------------------------------
// Normalisers (handle various MCP response shapes)
// ---------------------------------------------------------------------------

function normaliseSearchResult(raw: unknown): KaprukaSearchResult {
  if (!raw || typeof raw !== 'object') return { products: [], total: 0 };
  const r = raw as Record<string, unknown>;

  // Shape: { products: [...], total: N }
  if (Array.isArray(r['products'])) {
    return {
      products: (r['products'] as unknown[]).map(normaliseProduct),
      total: typeof r['total'] === 'number' ? r['total'] : (r['products'] as unknown[]).length,
      cursor: r['cursor'] as string | undefined,
    };
  }

  // Shape: flat array
  if (Array.isArray(raw)) {
    const arr = raw as unknown[];
    return { products: arr.map(normaliseProduct), total: arr.length };
  }

  // Shape: { items: [...] }
  if (Array.isArray(r['items'])) {
    const arr = r['items'] as unknown[];
    return { products: arr.map(normaliseProduct), total: arr.length };
  }

  return { products: [], total: 0 };
}

function normaliseProduct(raw: unknown): KaprukaMCPProduct {
  if (!raw || typeof raw !== 'object') {
    return { id: String(Date.now()), name: 'Unknown', price: 0, image: '', category: '' };
  }
  const r = raw as Record<string, unknown>;

  // Pick the first available image URL
  const imageUrl =
    (r['image'] as string) ||
    (r['image_url'] as string) ||
    (Array.isArray(r['images']) && (r['images'] as string[])[0]) ||
    '';

  return {
    id: String(r['id'] ?? r['product_id'] ?? Date.now()),
    name: String(r['name'] ?? r['title'] ?? 'Product'),
    price: Number(r['price'] ?? r['lkr_price'] ?? 0),
    image: imageUrl,
    category: String(r['category'] ?? r['category_name'] ?? ''),
    url: r['url'] as string | undefined,
    inStock: r['in_stock'] !== false,
    description: r['description'] as string | undefined,
    variants: r['variants'] as KaprukaMCPProduct['variants'],
  };
}

function normaliseCategories(raw: unknown): KaprukaCategory[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[]).map((c) => {
      if (typeof c === 'string') return { name: c };
      const r = c as Record<string, unknown>;
      return { name: String(r['name'] ?? ''), url: r['url'] as string | undefined };
    });
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const arr = (r['categories'] ?? r['items'] ?? []) as unknown[];
    return arr.map((c) => {
      if (typeof c === 'string') return { name: c };
      const rc = c as Record<string, unknown>;
      return { name: String(rc['name'] ?? ''), url: rc['url'] as string | undefined };
    });
  }
  return [];
}

function normaliseCities(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[]).map((c) => {
      if (typeof c === 'string') return c;
      const r = c as Record<string, unknown>;
      return String(r['name'] ?? r['city'] ?? '');
    }).filter(Boolean);
  }
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const arr = (r['cities'] ?? r['results'] ?? []) as unknown[];
    return arr.map((c) => {
      if (typeof c === 'string') return c;
      const rc = c as Record<string, unknown>;
      return String(rc['name'] ?? '');
    }).filter(Boolean);
  }
  return [];
}

function normaliseDelivery(raw: unknown): KaprukaDeliveryResult {
  if (!raw || typeof raw !== 'object') return { available: false };
  const r = raw as Record<string, unknown>;
  return {
    available: r['available'] !== false && r['deliverable'] !== false,
    fee: typeof r['fee'] === 'number' ? r['fee'] : (typeof r['delivery_fee'] === 'number' ? r['delivery_fee'] : undefined),
    perishableWarning: Boolean(r['perishable_warning'] ?? r['perishable']),
    message: r['message'] as string | undefined,
  };
}

function normaliseOrder(raw: unknown): KaprukaOrderResult {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid order response');
  const r = raw as Record<string, unknown>;
  return {
    orderId: String(r['order_id'] ?? r['orderId'] ?? ''),
    payUrl: String(r['pay_url'] ?? r['payUrl'] ?? r['payment_url'] ?? ''),
    expiresAt: r['expires_at'] as string | undefined,
  };
}

function normaliseTracking(raw: unknown): KaprukaTrackResult {
  if (!raw || typeof raw !== 'object') return { orderNumber: '', status: 'unknown', steps: [] };
  const r = raw as Record<string, unknown>;
  const steps: KaprukaTrackingStep[] = Array.isArray(r['steps']) || Array.isArray(r['timeline'])
    ? ((r['steps'] ?? r['timeline']) as unknown[]).map((s) => {
        const rs = s as Record<string, unknown>;
        return {
          status: String(rs['status'] ?? rs['label'] ?? ''),
          timestamp: String(rs['timestamp'] ?? rs['time'] ?? rs['date'] ?? ''),
          description: rs['description'] as string | undefined,
        };
      })
    : [];
  return {
    orderNumber: String(r['order_number'] ?? r['orderId'] ?? ''),
    status: String(r['status'] ?? 'unknown'),
    recipient: r['recipient'] as string | undefined,
    items: r['items'] as string[] | undefined,
    steps,
  };
}
