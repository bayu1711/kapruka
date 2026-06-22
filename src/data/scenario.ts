export interface Block {
  id: string;
  type: 'category' | 'preference' | 'product';
  label: string;
  color: 'white' | 'blue' | 'green';
  stage: number;
  position: {x: number;y: number;};
  delay?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  position: {x: number;y: number;};
}

// LocalStorage key for product catalog
const PRODUCTS_STORAGE_KEY = 'kapruka_products_catalog';

// Default product catalog (40 items for 2 pages of 20)
const defaultProducts: Product[] = [
{
  id: 'p1',
  name: 'Premium Rose Bouquet',
  price: 8500,
  image:
  'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 420, y: 180 }
},
{
  id: 'p2',
  name: 'Luxury Chocolate Box',
  price: 6500,
  image:
  'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop',
  category: 'Chocolates',
  position: { x: 500, y: 300 }
},
{
  id: 'p3',
  name: 'Deluxe Gift Basket',
  price: 9500,
  image:
  'https://images.unsplash.com/photo-1558298827-a4d7f0c0f0e7?w=400&h=400&fit=crop',
  category: 'Gift Baskets',
  position: { x: 380, y: 380 }
},
{
  id: 'p4',
  name: 'Orchid Arrangement',
  price: 7500,
  image:
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 480, y: 120 }
},
{
  id: 'p5',
  name: 'Tulip Bunch',
  price: 5500,
  image:
  'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 0, y: 0 }
},
{
  id: 'p6',
  name: 'Sunflower Bouquet',
  price: 4800,
  image:
  'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 0, y: 0 }
},
{
  id: 'p7',
  name: 'Birthday Cake',
  price: 6900,
  image:
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
  category: 'Cakes',
  position: { x: 0, y: 0 }
},
{
  id: 'p8',
  name: 'Cupcake Set',
  price: 3500,
  image:
  'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop',
  category: 'Cakes',
  position: { x: 0, y: 0 }
},
{
  id: 'p9',
  name: 'Scented Candle Set',
  price: 4200,
  image:
  'https://images.unsplash.com/photo-1602874801006-e26c4c5b5b6a?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p10',
  name: 'Teddy Bear',
  price: 3900,
  image:
  'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=400&h=400&fit=crop',
  category: 'Toys',
  position: { x: 0, y: 0 }
},
{
  id: 'p11',
  name: 'Perfume Gift Set',
  price: 9200,
  image:
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
  category: 'Beauty',
  position: { x: 0, y: 0 }
},
{
  id: 'p12',
  name: 'Jewellery Box',
  price: 8800,
  image:
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
  category: 'Jewellery',
  position: { x: 0, y: 0 }
},
{
  id: 'p13',
  name: 'Coffee Hamper',
  price: 7200,
  image:
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p14',
  name: 'Tea Collection',
  price: 5900,
  image:
  'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p15',
  name: 'Macaron Box',
  price: 6100,
  image:
  'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=400&fit=crop',
  category: 'Sweets',
  position: { x: 0, y: 0 }
},
{
  id: 'p16',
  name: 'Silk Scarf',
  price: 4700,
  image:
  'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop',
  category: 'Fashion',
  position: { x: 0, y: 0 }
},
{
  id: 'p17',
  name: 'Photo Frame',
  price: 3200,
  image:
  'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p18',
  name: 'Spa Gift Kit',
  price: 8100,
  image:
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
  category: 'Beauty',
  position: { x: 0, y: 0 }
},
{
  id: 'p19',
  name: 'Wine & Cheese',
  price: 9700,
  image:
  'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p20',
  name: 'Lily Bouquet',
  price: 6700,
  image:
  'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 0, y: 0 }
},
{
  id: 'p21',
  name: 'Gourmet Cookie Jar',
  price: 4500,
  image:
  'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
  category: 'Sweets',
  position: { x: 0, y: 0 }
},
{
  id: 'p22',
  name: 'Handmade Soap Set',
  price: 3800,
  image:
  'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop',
  category: 'Beauty',
  position: { x: 0, y: 0 }
},
{
  id: 'p23',
  name: 'Ceramic Vase',
  price: 5200,
  image:
  'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p24',
  name: 'Artisan Bread Basket',
  price: 6300,
  image:
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p25',
  name: 'Luxury Pen Set',
  price: 7800,
  image:
  'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=400&fit=crop',
  category: 'Stationery',
  position: { x: 0, y: 0 }
},
{
  id: 'p26',
  name: 'Succulent Garden',
  price: 4100,
  image:
  'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
  category: 'Plants',
  position: { x: 0, y: 0 }
},
{
  id: 'p27',
  name: 'Gourmet Nuts Mix',
  price: 5600,
  image:
  'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p28',
  name: 'Crystal Decanter',
  price: 9300,
  image:
  'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p29',
  name: 'Lavender Bouquet',
  price: 5100,
  image:
  'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 0, y: 0 }
},
{
  id: 'p30',
  name: 'Bamboo Tea Set',
  price: 6800,
  image:
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p31',
  name: 'Gourmet Olive Oil',
  price: 4900,
  image:
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p32',
  name: 'Cashmere Throw',
  price: 8900,
  image:
  'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p33',
  name: 'Artisan Cheese Board',
  price: 7400,
  image:
  'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p34',
  name: 'Orchid Plant',
  price: 6200,
  image:
  'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=400&h=400&fit=crop',
  category: 'Plants',
  position: { x: 0, y: 0 }
},
{
  id: 'p35',
  name: 'Gourmet Honey Set',
  price: 5400,
  image:
  'https://images.unsplash.com/photo-1587049352846-4a222e784720?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p36',
  name: 'Silk Pillowcase',
  price: 4600,
  image:
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p37',
  name: 'Peony Bouquet',
  price: 7900,
  image:
  'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 0, y: 0 }
},
{
  id: 'p38',
  name: 'Gourmet Jam Collection',
  price: 5800,
  image:
  'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=400&h=400&fit=crop',
  category: 'Gourmet',
  position: { x: 0, y: 0 }
},
{
  id: 'p39',
  name: 'Marble Coaster Set',
  price: 3600,
  image:
  'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=400&h=400&fit=crop',
  category: 'Home',
  position: { x: 0, y: 0 }
},
{
  id: 'p40',
  name: 'Hydrangea Arrangement',
  price: 6400,
  image:
  'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=400&fit=crop',
  category: 'Flowers',
  position: { x: 0, y: 0 }
}];


// Load products from localStorage or use defaults
function loadProducts(): Product[] {
  if (typeof window === 'undefined') return defaultProducts;

  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load products from localStorage:', error);
  }

  // Save defaults to localStorage
  saveProducts(defaultProducts);
  return defaultProducts;
}

// Save products to localStorage
function saveProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save products to localStorage:', error);
  }
}

// Export the loaded products
export const products: Product[] = loadProducts();

export const scenarioBlocks: Block[] = [
// Stage 1: Understanding - White category chips (Stacked on the left)
{
  id: 'b1',
  type: 'category',
  label: 'Gifts',
  color: 'white',
  stage: 1,
  position: { x: 180, y: 150 },
  delay: 0
},
{
  id: 'b2',
  type: 'category',
  label: 'Occasion',
  color: 'white',
  stage: 1,
  position: { x: 160, y: 200 },
  delay: 0.1
},
{
  id: 'b3',
  type: 'category',
  label: 'Recipient',
  color: 'white',
  stage: 1,
  position: { x: 150, y: 250 },
  delay: 0.2
},
{
  id: 'b4',
  type: 'category',
  label: 'Budget',
  color: 'white',
  stage: 1,
  position: { x: 160, y: 300 },
  delay: 0.3
},
{
  id: 'b5',
  type: 'category',
  label: 'Delivery',
  color: 'white',
  stage: 1,
  position: { x: 180, y: 350 },
  delay: 0.4
},

// Stage 2: Preferences - Blue chips (Paired beside the white ones)
{
  id: 'b6',
  type: 'preference',
  label: 'Mother',
  color: 'blue',
  stage: 2,
  position: { x: 260, y: 250 },
  delay: 0
},
{
  id: 'b7',
  type: 'preference',
  label: 'Birthday',
  color: 'blue',
  stage: 2,
  position: { x: 270, y: 200 },
  delay: 0.1
},
{
  id: 'b8',
  type: 'preference',
  label: 'Under LKR 10,000',
  color: 'blue',
  stage: 2,
  position: { x: 280, y: 300 },
  delay: 0.2
},
{
  id: 'b9',
  type: 'preference',
  label: 'Colombo',
  color: 'blue',
  stage: 2,
  position: { x: 270, y: 350 },
  delay: 0.3
},

// Stage 3: Additional context blocks
{
  id: 'b10',
  type: 'category',
  label: 'Same Day',
  color: 'white',
  stage: 2,
  position: { x: 190, y: 400 },
  delay: 0.4
},
{
  id: 'b11',
  type: 'preference',
  label: 'Gift Message',
  color: 'blue',
  stage: 2,
  position: { x: 290, y: 400 },
  delay: 0.5
}];


export interface StageConfig {
  stage: number;
  prompt: string;
  aiStatus: string;
  suggestedInput?: string;
}

export const stageConfigs: StageConfig[] = [
{
  stage: 0,
  prompt: 'What are you wishing for today?',
  aiStatus: '',
  suggestedInput: 'I need a birthday gift for my mother'
},
{
  stage: 1,
  prompt: 'Tell me more about your wish...',
  aiStatus: 'Understanding your wish...',
  suggestedInput: 'Under Rs. 10,000 in Colombo'
},
{
  stage: 2,
  prompt: 'Any preferences or special requests?',
  aiStatus: 'Finding perfect matches...',
  suggestedInput: 'Show me the best options'
},
{
  stage: 3,
  prompt: 'Refine your selection or add details...',
  aiStatus: '',
  suggestedInput: 'Add a birthday message'
}];