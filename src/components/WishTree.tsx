import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, Settings } from 'lucide-react';
import type { Product } from '../data/scenario';
import { useLanguage } from '../contexts/LanguageContext';

interface WishTreeProps {
  stage: number;
  products: Product[];
  selectedProduct: string | null;
  onSelectProduct: (id: string) => void;
  isPaging?: boolean;
  liveCategories?: string[];
  aiReasoning?: string;
  aiRecipient?: string;
  aiActualSearchQuery?: string;
  showDebugGrid?: boolean;
  isSearching?: boolean;
}
type CellType = 'foliage' | 'label' | 'product';
interface GridCell {
  id: string;
  type: CellType;
  color: 'white' | 'blue' | 'green';
  stage: number;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  contentId?: string; // block.label or product.id
}
// Unified grid layout for the canopy (11 cols x 8 rows)
// This explicitly places labeled cells and fills the rest with foliage
const GRID_LAYOUT: GridCell[] = [
// --- LABELS: user choices / preferences (White) ---
// Stage 1 — first choices sprout near the trunk/center
{
  id: 'l1',
  type: 'label',
  color: 'white',
  stage: 1,
  col: 4,
  row: 4,
  colSpan: 1,
  rowSpan: 1,
  contentId: 'Mother'
},
{
  id: 'l2',
  type: 'label',
  color: 'white',
  stage: 1,
  col: 5,
  row: 3,
  colSpan: 1,
  rowSpan: 1,
  contentId: 'Birthday'
},
{
  id: 'l3',
  type: 'label',
  color: 'white',
  stage: 1,
  col: 3,
  row: 3,
  colSpan: 1,
  rowSpan: 1,
  contentId: 'Colombo'
},
// Stage 2 — remaining choices fill outward
{
  id: 'l4',
  type: 'label',
  color: 'white',
  stage: 2,
  col: 6,
  row: 4,
  colSpan: 1,
  rowSpan: 1,
  contentId: 'Under LKR 10,000'
},
{
  id: 'l5',
  type: 'label',
  color: 'white',
  stage: 2,
  col: 2,
  row: 5,
  colSpan: 1,
  rowSpan: 1,
  contentId: 'Same Day'
},
{
  id: 'l6',
  type: 'label',
  color: 'white',
  stage: 2,
  col: 6,
  row: 2,
  colSpan: 1,
  rowSpan: 1,
  contentId: 'Gift Message'
}];

export function WishTree({
  stage,
  products,
  selectedProduct,
  onSelectProduct,
  isPaging = false,
  liveCategories = [],
  aiReasoning,
  aiRecipient,
  aiActualSearchQuery,
  searchParameters,
  showDebugGrid,
  isSearching
}: WishTreeProps) {
  const { t } = useLanguage();
  const showProducts = stage >= 3;
  // Calculate cell positions based on the 11x8 grid
  const gridCells = useMemo(() => {
    const cols = 11;
    const rows = 8;
    // Bounding box of the canopy region over the enlarged cartoon tree (% of container)
    const gridLeft = 5;
    const gridTop = 1.25;
    const gridWidth = 90;
    const gridHeight = 67.5;
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;
    // Blocks should grow OUTWARD from where the branches meet the trunk
    // (the bottom-center of the canopy) toward the branch tips. So we order
    // each cell by its spatial distance from that trunk origin: the closer a
    // block is to the base, the earlier it sprouts. The sequence restarts each
    // stage so every new stage grows out from the trunk again.
    const originCol = 5; // center of canopy, above the trunk
    const originRow = 6.5; // just below the lowest canopy row (the branch base)
    const distFromTrunk = (cell: GridCell) => {
      // Use each cell's center so wide/tall labeled cells sort fairly
      const cx = cell.col + (cell.colSpan - 1) / 2;
      const cy = cell.row + (cell.rowSpan - 1) / 2;
      const dx = cx - originCol;
      const dy = cy - originRow;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const ordered = [...GRID_LAYOUT].sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage;
      return distFromTrunk(a) - distFromTrunk(b);
    });
    const STEP = 0.1;
    const delayById: Record<string, number> = {};
    let currentStage = -1;
    let seqInStage = 0;
    ordered.forEach((cell) => {
      if (cell.stage !== currentStage) {
        currentStage = cell.stage;
        seqInStage = 0;
      }
      delayById[cell.id] = seqInStage * STEP;
      seqInStage += 1;
    });
    let seed = 12345;
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const labelCells = GRID_LAYOUT.filter((c) => c.type === 'label');
    const liveLayout: GridCell[] = GRID_LAYOUT.map((cell) => {
      if (cell.type !== 'label') return cell;
      const idx = labelCells.indexOf(cell);
      const texts = [];
      if (searchParameters && searchParameters.length > 0) {
        searchParameters.forEach(p => {
          const key = p.key.toLowerCase();
          if (key === 'max_price' || key === 'budget') {
            texts.push(`Maximum ${p.value} LKR`);
          } else if (key === 'min_price') {
            texts.push(`Minimum ${p.value} LKR`);
          } else if (key === 'occasion' || key === 'recipient') {
            texts.push(p.value.charAt(0).toUpperCase() + p.value.slice(1));
          } else {
            const displayKey = key.replace(/_/g, ' ');
            texts.push(`${displayKey.charAt(0).toUpperCase() + displayKey.slice(1)}: ${p.value}`);
          }
        });
      }
      
      const remaining = liveCategories || [];
      const usedCategories = remaining.filter(c => !texts.includes(c));
      const allTexts = [...texts, ...usedCategories];
      
      if (idx >= 0 && idx < allTexts.length) {
        return { ...cell, contentId: allTexts[idx] };
      }
      return { ...cell, contentId: '' };
    });

    const baseCells = liveLayout.map((cell) => {
      const multiplier = 0.98; // Almost full width, tiny gap
      const width = cellWidth * cell.colSpan * multiplier;
      const height = cellHeight * cell.rowSpan * multiplier;
      
      const baseLeft = gridLeft + cell.col * cellWidth + (cellWidth * cell.colSpan * (1 - multiplier)) / 2;
      const baseTop = gridTop + cell.row * cellHeight + (cellHeight * cell.rowSpan * (1 - multiplier)) / 2;
      
      return {
        ...cell,
        left: `${baseLeft}%`,
        top: `${baseTop}%`,
        width: `${width}%`,
        height: `${height}%`,
        rotate: 0,
        delay: delayById[cell.id]
      };
    });
    const usedCoords = new Set(liveLayout.map(c => `${c.col},${c.row}`));
    const validProductCoords: { col: number; row: number }[] = [];

    const treeMask = [
      [3, 7],   // row 0
      [2, 8],   // row 1
      [1, 9],   // row 2
      [0, 10],  // row 3
      [0, 10],  // row 4
      [1, 9],   // row 5
      [2, 8],   // row 6
      [3, 7]    // row 7
    ];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (usedCoords.has(`${c},${r}`)) continue;
        
        const [minC, maxC] = treeMask[r] || [0, cols - 1];
        if (c >= minC && c <= maxC) {
          validProductCoords.push({ col: c, row: r });
        }
      }
    }

    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const productFullCoordsSet = new Set(validProductCoords.map(c => `${c.col},${c.row}`));
    const possible2x2Anchors = validProductCoords.filter(c => 
      productFullCoordsSet.has(`${c.col+1},${c.row}`) &&
      productFullCoordsSet.has(`${c.col},${c.row+1}`) &&
      productFullCoordsSet.has(`${c.col+1},${c.row+1}`)
    );

    const shuffledAnchors = shuffleArray(possible2x2Anchors);
    
    const selectedProductSlots: { col: number; row: number; colSpan: number; rowSpan: number }[] = [];
    const usedByProducts = new Set<string>();

    // Assign 4 slots as 2x2 large products
    let largeCount = 0;
    for (const anchor of shuffledAnchors) {
      if (largeCount >= 4) break;
      const { col, row } = anchor;
      if (
        !usedByProducts.has(`${col},${row}`) &&
        !usedByProducts.has(`${col+1},${row}`) &&
        !usedByProducts.has(`${col},${row+1}`) &&
        !usedByProducts.has(`${col+1},${row+1}`)
      ) {
        selectedProductSlots.push({ col, row, colSpan: 2, rowSpan: 2 });
        usedByProducts.add(`${col},${row}`);
        usedByProducts.add(`${col+1},${row}`);
        usedByProducts.add(`${col},${row+1}`);
        usedByProducts.add(`${col+1},${row+1}`);
        largeCount++;
      }
    }

    // Assign remaining slots as 1x1 products up to 20 total products
    const shuffled1x1 = shuffleArray(validProductCoords);
    for (const cell of shuffled1x1) {
      if (selectedProductSlots.length >= 20) break;
      if (!usedByProducts.has(`${cell.col},${cell.row}`)) {
        selectedProductSlots.push({ col: cell.col, row: cell.row, colSpan: 1, rowSpan: 1 });
        usedByProducts.add(`${cell.col},${cell.row}`);
      }
    }

    // If user wants products to mostly take 4 spaces (2x2), we can just try to assign as many 2x2 as possible
    const productCells: typeof baseCells = [];
    products.forEach((product, i) => {
      if (i >= selectedProductSlots.length) return;
      const slot = selectedProductSlots[i];
      
      const multiplier = 0.98; // Full width with tiny gap
      const pWidth = cellWidth * slot.colSpan * multiplier;
      const pHeight = cellHeight * slot.rowSpan * multiplier;

      const baseLeft = gridLeft + slot.col * cellWidth + (cellWidth * slot.colSpan * (1 - multiplier)) / 2;
      const baseTop = gridTop + slot.row * cellHeight + (cellHeight * slot.rowSpan * (1 - multiplier)) / 2;

      const dx = slot.col - originCol;
      const dy = slot.row - originRow;
      const dist = Math.sqrt(dx * dx + dy * dy);

      productCells.push({
        id: product.id,
        type: 'product',
        color: 'green',
        stage: 3,
        col: slot.col,
        row: slot.row,
        colSpan: slot.colSpan,
        rowSpan: slot.rowSpan,
        contentId: product.id,
        left: `${baseLeft}%`,
        top: `${baseTop}%`,
        width: `${pWidth}%`,
        height: `${pHeight}%`,
        rotate: 0,
        delay: dist * 0.1
      } as (typeof baseCells)[number]);
    });

    const unusedSlots = validProductCoords.filter(s => !usedByProducts.has(`${s.col},${s.row}`));
    
    const depthCells: typeof baseCells = unusedSlots.map((slot, i) => {
      const multiplier = 0.98; // Full width with tiny gap
      const width = cellWidth * 1 * multiplier;
      const height = cellHeight * 1 * multiplier;
      const baseLeft = gridLeft + slot.col * cellWidth + (cellWidth * (1 - multiplier)) / 2;
      const baseTop = gridTop + slot.row * cellHeight + (cellHeight * (1 - multiplier)) / 2;
      
      const dx = slot.col - originCol;
      const dy = slot.row - originRow;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const rand = seededRandom();
      let shade: 'white' | 'blue' | 'green' = 'white';
      if (rand > 0.66) shade = 'blue';
      else if (rand > 0.33) shade = 'green';

      return {
        id: `f_dyn_${i}`,
        type: 'foliage',
        color: shade, // We'll map these to 3 shades of green in rendering
        stage: 2,
        col: slot.col,
        row: slot.row,
        colSpan: 1,
        rowSpan: 1,
        contentId: '',
        left: `${baseLeft}%`,
        top: `${baseTop}%`,
        width: `${width}%`,
        height: `${height}%`,
        rotate: 0,
        delay: dist * 0.1
      } as (typeof baseCells)[number];
    });

    const allCells = [...baseCells, ...depthCells, ...productCells];

    return allCells;
  }, [products, liveCategories]);
  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden" style={{ containerType: 'size' }}>
      {/* Responsive square container — slightly scaled on mobile to avoid cutting sides, strict 1:1 on desktop */}
      {/* Responsive square container — slightly scaled on mobile to avoid cutting sides, strict 1:1 on desktop */}
      <div 
        className="relative flex-shrink-0 origin-bottom translate-y-4 sm:translate-y-12 w-[115vw] h-[115vw] sm:w-[min(100cqmin,1000px)] sm:h-[min(100cqmin,1000px)]"
      >
        {/* Soft glows behind the tree */}
        <div className="absolute inset-x-0 top-0 h-2/3 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-90 pointer-events-none" />

        {/* Base layer: cartoon tree with branches (inline SVG) scaled to 800x800 */}
        <svg
          viewBox="0 0 800 800"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true">
          
          <defs>
            <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <radialGradient id="canopyGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </radialGradient>
          </defs>

          {/* No solid canopy backing, letting grid blocks show the shape */}
          

          {/* Trunk (squared for a Minecraft look) */}
          <rect
            x="350"
            y="550"
            width="100"
            height="250"
            fill="url(#trunkGrad)" />
          
          {/* Kapruka 'u' smile (Yellow) */}
          <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.2))">
            {isSearching ? (
              <motion.path
                initial={{ pathLength: 0, opacity: 0.5 }}
                animate={{ pathLength: [0, 1, 0], pathOffset: [0, 0, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                d="M 240 350 A 160 100 0 0 0 560 350"
                stroke="#FDE047"
                strokeWidth="54"
                strokeLinecap="butt"
                fill="none" />
            ) : (
              <path
                d="M 240 350 A 160 100 0 0 0 560 350"
                stroke="#FDE047"
                strokeWidth="54"
                strokeLinecap="butt"
                fill="none" />
            )}
          </g>
        </svg>

        {/* Debug Grid Overlay */}
        {showDebugGrid &&
        Array.from({ length: 8 * 11 }).map((_, i) => {
          const col = i % 11;
          const row = Math.floor(i / 11);
          const gridLeft = 5;
          const gridTop = 1.25;
          const gridWidth = 90;
          const gridHeight = 67.5;
          const cellWidth = gridWidth / 11;
          const cellHeight = gridHeight / 8;
          return (
            <div
              key={`grid-${i}`}
              className="absolute border border-white/20 pointer-events-none z-50 flex items-center justify-center"
              style={{
                left: `${gridLeft + col * cellWidth}%`,
                top: `${gridTop + row * cellHeight}%`,
                width: `${cellWidth}%`,
                height: `${cellHeight}%`,
              }}
            >
              <span className="text-[6px] text-white/40">{col},{row}</span>
            </div>
          );
        })}

        {/* Unified Grid: Foliage, Labels, and Products */}
        {gridCells.
        filter((cell) => cell.stage <= stage).
        map((cell) => {
          const isWhite = cell.color === 'white';
          const isBlue = cell.color === 'blue';
          // Render Foliage Cell
          if (cell.type === 'foliage') {
            return (
              <motion.div
                key={cell.id}
                initial={{
                  scale: 0,
                  opacity: 0,
                  filter: 'blur(4px)',
                  rotate: (cell as any).rotate || 0
                }}
                animate={{
                  scale: 1,
                  opacity: isSearching ? 0.7 : 0.95,
                  filter: isSearching ? 'blur(4px) grayscale(50%)' : 'blur(0px) grayscale(0%)',
                  rotate: (cell as any).rotate || 0
                }}
                transition={{
                  type: 'spring',
                  stiffness: 250,
                  damping: 22,
                  delay: cell.delay
                }}
                className={`absolute rounded-none ${cell.color === 'white' ? 'bg-[#10b981]' : cell.color === 'blue' ? 'bg-[#059669]' : 'bg-[#064e3b]'}`}
                style={{
                  left: cell.left,
                  top: cell.top,
                  width: cell.width,
                  height: cell.height
                }} />);


          }
          // Render Label Cell (blue = user choices / preferences)
          if (cell.type === 'label') {
            return (
              <motion.div
                key={cell.id}
                initial={{
                  scale: 0,
                  opacity: 0,
                  filter: 'blur(8px)',
                  rotate: (cell as any).rotate || 0
                }}
                animate={{
                  scale: 1,
                  opacity: isSearching ? 0.7 : 1,
                  filter: isSearching ? 'blur(4px) grayscale(50%)' : 'blur(0px) grayscale(0%)',
                  rotate: (cell as any).rotate || 0
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: cell.delay
                }}
                className={`absolute rounded-none flex items-center justify-center px-1 border backdrop-blur-md z-10 ${isWhite ? 'bg-white text-[#402970] shadow-[0_0_16px_rgba(255,255,255,0.6)] border-white' : 'bg-blue-600 text-white shadow-[0_0_16px_rgba(37,99,235,0.6)] border-blue-400/50'}`}
                style={{
                  left: cell.left,
                  top: cell.top,
                  width: cell.width,
                  height: cell.height
                }}>
                
                  <span className="text-[5px] sm:text-[7px] md:text-[8px] font-mono font-bold tracking-tight text-center leading-tight">
                    {cell.contentId}
                  </span>
                </motion.div>);

          }
          // Render Product Cell
          if (cell.type === 'product' && showProducts) {
            const product = products.find((p) => p.id === cell.contentId);
            if (!product) return null;
            const isSelected = selectedProduct === product.id;
            return (
              <motion.div
                key={cell.id}
                initial={{
                  scale: 0,
                  opacity: 0,
                  filter: 'blur(8px)',
                  rotate: (cell as any).rotate || 0
                }}
                animate={{
                  scale: isSelected ? 1.1 : 1,
                  opacity: isSearching ? 0.7 : 1,
                  filter: isSearching ? 'blur(4px) grayscale(50%)' : 'blur(0px) grayscale(0%)',
                  rotate: isSelected ? 0 : ((cell as any).rotate || 0)
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: isSearching ? 0 : cell.delay
                }}
                className={`absolute rounded-none overflow-hidden cursor-pointer group z-20 duration-300 border-2 ${isSelected ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.8)] z-30' : 'border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.4)] hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]'}`}
                style={{
                  left: cell.left,
                  top: cell.top,
                  width: cell.width,
                  height: cell.height,
                  transitionProperty: isPaging ? 'all' : 'box-shadow, transform, border-color, opacity'
                }}
                onClick={() => onSelectProduct(product.id)}>
                
                <img
                  src={product.image || `https://placehold.co/400x400/1e293b/6ee7b7?text=${encodeURIComponent(product.name)}`}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity [image-rendering:pixelated]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1e293b/6ee7b7?text=Kapruka';
                  }}
                />
                </motion.div>);

          }
          return null;
        })}

        {/* Welcome overlay for stage 0 */}
        {stage === 0 &&
        <motion.div
          initial={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          
            <div className="text-center bg-slate-950/60 backdrop-blur-md p-6 sm:p-12 rounded-2xl sm:rounded-3xl border border-white/10 mx-4 max-w-[90%]">
              <motion.h1
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.2
              }}
              className="text-4xl sm:text-6xl font-heading font-bold text-white mb-2 sm:mb-4">
              
                {t('KAPRUKA')}
              </motion.h1>
              <motion.h2
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.4
              }}
              className="text-4xl sm:text-7xl font-heading font-bold text-emerald-400 mb-4 sm:mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              
                {t('WISH_TREE_TITLE')}
              </motion.h2>
              <motion.p
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.6
              }}
              className="text-sm sm:text-xl text-white/80 font-heading">
              
                {t('TREE_SUBTITLE')}
              </motion.p>
            </div>
          </motion.div>
        }
      </div>
    </div>);

}