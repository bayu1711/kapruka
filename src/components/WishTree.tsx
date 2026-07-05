import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3 } from 'lucide-react';
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
  showCanopy?: boolean;
  isSearching?: boolean;
  onAddToCart?: (id: string) => void;
  onRemoveFromCart?: (id: string) => void;
  cartItemIds?: string[];
  onQuickSearch?: (query: string) => void;
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

const Fireflies = () => {
  const fireflies = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 5,
    xDrift: Math.random() * 60 - 30,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {fireflies.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full bg-yellow-200"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            boxShadow: '0 0 10px 2px rgba(253, 224, 71, 0.6)',
          }}
          animate={{
            y: [0, -150],
            x: [0, f.xDrift, 0],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            delay: f.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

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
  showDebugGrid: showDebugGridProp,
  showCanopy = true,
  isSearching,
  onAddToCart,
  onRemoveFromCart,
  cartItemIds = [],
  onQuickSearch
}: WishTreeProps) {
  const { t } = useLanguage();
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const effectiveShowDebugGrid = showDebugGridProp ?? showDebugGrid;
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
      const multiplier = 0.70; // Shrunk to add organic spacing
      const width = cellWidth * cell.colSpan * multiplier;
      const height = cellHeight * cell.rowSpan * multiplier;
      // Center the resized tile inside its allocated grid slot
      const baseLeft = gridLeft + cell.col * cellWidth + (cellWidth * cell.colSpan * (1 - multiplier)) / 2;
      const baseTop = gridTop + cell.row * cellHeight + (cellHeight * cell.rowSpan * (1 - multiplier)) / 2;
      
      const rot = (seededRandom() - 0.5) * 12; // Random rotation between -6 and 6 deg
      const jx = (seededRandom() - 0.5) * 2; // Random X jitter %
      const jy = (seededRandom() - 0.5) * 2; // Random Y jitter %

      return {
        ...cell,
        left: `${baseLeft + jx}%`,
        top: `${baseTop + jy}%`,
        width: `${width}%`,
        height: `${height}%`,
        rotate: rot,
        delay: delayById[cell.id]
      };
    });
    const usedCoords = new Set(liveLayout.map(c => `${c.col},${c.row}`));
    const canopyCx = 50;
    const canopyCy = 35;
    const canopyRx = 45;
    const canopyRy = 33.75;
    const validProductCoords: { col: number; row: number }[] = [];
    const validFoliageCoords: { col: number; row: number; m: number; px: number; py: number }[] = [];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (usedCoords.has(`${c},${r}`)) continue;
        const left = gridLeft + c * cellWidth;
        const top = gridTop + r * cellHeight;
        
        const cellCorners = [
          { x: left, y: top },
          { x: left + cellWidth, y: top },
          { x: left, y: top + cellHeight },
          { x: left + cellWidth, y: top + cellHeight }
        ];

        const cellFullyInside = cellCorners.every((corner) => {
          const dx = (corner.x - canopyCx) / canopyRx;
          const dy = (corner.y - canopyCy) / canopyRy;
          return (dx * dx + dy * dy) <= 1;
        });

        if (cellFullyInside) {
          validProductCoords.push({ col: c, row: r });
          validFoliageCoords.push({ col: c, row: r, m: 0.85, px: left + cellWidth / 2, py: top + cellHeight / 2 });
        } else {
          let maxM = 0;
          let bestPx = left + cellWidth / 2;
          let bestPy = top + cellHeight / 2;

          for (let m = 0.85; m >= 0.35; m -= 0.05) {
            const hw = (cellWidth * m) / 2;
            const hh = (cellHeight * m) / 2;
            const minPx = left + hw;
            const maxPx = left + cellWidth - hw;
            const minPy = top + hh;
            const maxPy = top + cellHeight - hh;
            
            const px = Math.max(minPx, Math.min(canopyCx, maxPx));
            const py = Math.max(minPy, Math.min(canopyCy, maxPy));

            const corners = [
              { x: px - hw, y: py - hh },
              { x: px + hw, y: py - hh },
              { x: px - hw, y: py + hh },
              { x: px + hw, y: py + hh }
            ];

            const allInside = corners.every((corner) => {
              const dx = (corner.x - canopyCx) / canopyRx;
              const dy = (corner.y - canopyCy) / canopyRy;
              return (dx * dx + dy * dy) <= 1;
            });

            if (allInside) {
              maxM = m;
              bestPx = px;
              bestPy = py;
              break;
            }
          }

          if (maxM > 0) {
            validFoliageCoords.push({ col: c, row: r, m: maxM, px: bestPx, py: bestPy });
          }
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
      if (largeCount >= 4 || selectedProductSlots.length >= products.length) break;
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

    // Assign remaining slots as 1x1 products up to products.length total
    const shuffled1x1 = shuffleArray(validProductCoords);
    for (const cell of shuffled1x1) {
      if (selectedProductSlots.length >= products.length) break;
      if (!usedByProducts.has(`${cell.col},${cell.row}`)) {
        selectedProductSlots.push({ col: cell.col, row: cell.row, colSpan: 1, rowSpan: 1 });
        usedByProducts.add(`${cell.col},${cell.row}`);
      }
    }

    const foliageSlots = validFoliageCoords.filter(s => !usedByProducts.has(`${s.col},${s.row}`));

    // Keep only a few blue tiles adjacent to products — they frame the cluster
    const productGridCoords = new Set<string>();
    for (const slot of selectedProductSlots) {
      for (let dc = 0; dc < slot.colSpan; dc++) {
        for (let dr = 0; dr < slot.rowSpan; dr++) {
          productGridCoords.add(`${slot.col + dc},${slot.row + dr}`);
        }
      }
    }
    const countProductNeighbors = (col: number, row: number) => {
      let count = 0;
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (dc === 0 && dr === 0) continue;
          if (productGridCoords.has(`${col + dc},${row + dr}`)) count++;
        }
      }
      return count;
    };
    const MAX_FRAME_TILES = 10;
    let frameFoliageSlots = foliageSlots
      .filter((s) => countProductNeighbors(s.col, s.row) > 0)
      .sort(
        (a, b) =>
          countProductNeighbors(b.col, b.row) -
          countProductNeighbors(a.col, a.row)
      )
      .slice(0, MAX_FRAME_TILES);

    // Manual layout tuning (debug grid coordinates)
    const FOLIAGE_SIZE_OVERRIDES: Record<string, number> = {
      '0,3': 0.55
    };
    let finalProductSlots = [...selectedProductSlots];

    // Move product 2,6 → 5,1
    const moveIdx = finalProductSlots.findIndex(
      (s) => s.col === 2 && s.row === 6 && s.colSpan === 1
    );
    if (moveIdx >= 0) {
      finalProductSlots[moveIdx] = { ...finalProductSlots[moveIdx], col: 5, row: 1 };
      frameFoliageSlots = frameFoliageSlots.filter(s => !(s.col === 5 && s.row === 1));
    }

    // Swap product 6,3 ↔ blue frame tile 9,4
    const prod63Idx = finalProductSlots.findIndex(
      (s) => s.col === 6 && s.row === 3 && s.colSpan === 1
    );
    const fol94Idx = frameFoliageSlots.findIndex(
      (s) => s.col === 9 && s.row === 4
    );
    if (prod63Idx >= 0 && fol94Idx >= 0) {
      const fol = frameFoliageSlots[fol94Idx];
      finalProductSlots[prod63Idx] = { col: 9, row: 4, colSpan: 1, rowSpan: 1 };
      frameFoliageSlots[fol94Idx] = { ...fol, col: 6, row: 3 };
    }

    // Swap blue frame tiles 9,6 ↔ 3,1
    const swapFrameFoliage = (ac: number, ar: number, bc: number, br: number) => {
      const findSlot = (c: number, r: number) =>
        frameFoliageSlots.find((s) => s.col === c && s.row === r) ??
        foliageSlots.find((s) => s.col === c && s.row === r);
      const slotA = findSlot(ac, ar);
      const slotB = findSlot(bc, br);
      if (!slotA || !slotB) return;
      frameFoliageSlots = frameFoliageSlots.filter(
        (s) => !(s.col === ac && s.row === ar) && !(s.col === bc && s.row === br)
      );
      const mk = (col: number, row: number, src: typeof slotA) => {
        const left = gridLeft + col * cellWidth;
        const top = gridTop + row * cellHeight;
        return { col, row, m: src.m, px: left + cellWidth / 2, py: top + cellHeight / 2 };
      };
      frameFoliageSlots.push(mk(ac, ar, slotB));
      frameFoliageSlots.push(mk(bc, br, slotA));
    };
    swapFrameFoliage(9, 6, 3, 1);

    // Move white tile 9,6 -> 8,6
    const tile96Idx = frameFoliageSlots.findIndex(s => s.col === 9 && s.row === 6);
    if (tile96Idx >= 0) {
      const s = frameFoliageSlots[tile96Idx];
      const left = gridLeft + 8 * cellWidth;
      const top = gridTop + 6 * cellHeight;
      frameFoliageSlots[tile96Idx] = { ...s, col: 8, row: 6, px: left + cellWidth / 2, py: top + cellHeight / 2 };
    }

    // Move tile 1,5 -> 9,5
    const tile15FolIdx = frameFoliageSlots.findIndex(s => s.col === 1 && s.row === 5);
    if (tile15FolIdx >= 0) {
      const s = frameFoliageSlots[tile15FolIdx];
      const left = gridLeft + 9 * cellWidth;
      const top = gridTop + 5 * cellHeight;
      frameFoliageSlots[tile15FolIdx] = { ...s, col: 9, row: 5, px: left + cellWidth / 2, py: top + cellHeight / 2 };
    }
    const tile15ProdIdx = finalProductSlots.findIndex(s => s.col === 1 && s.row === 5);
    if (tile15ProdIdx >= 0) {
      finalProductSlots[tile15ProdIdx] = { ...finalProductSlots[tile15ProdIdx], col: 9, row: 5 };
    }

    const productCells: typeof baseCells = [];
    products.forEach((product, i) => {
      if (i >= finalProductSlots.length) return;
      const slot = finalProductSlots[i];
      const coordKey = `${slot.col},${slot.row}`;
      const isLargeOverride = ['9,2', '2,1', '7,6', '3,5', '9,4', '7,3'].includes(coordKey);
      let multiplier = slot.colSpan === 2 ? 0.85 : 0.75; // Provide padding
      if (isLargeOverride) {
        multiplier = 0.95; // Increase size for these specific green tiles
      }
      const pWidth = cellWidth * slot.colSpan * multiplier;
      const pHeight = cellHeight * slot.rowSpan * multiplier;

      const baseLeft = gridLeft + slot.col * cellWidth + (cellWidth * slot.colSpan * (1 - multiplier)) / 2;
      const baseTop = gridTop + slot.row * cellHeight + (cellHeight * slot.rowSpan * (1 - multiplier)) / 2;

      const dx = slot.col - originCol;
      const dy = slot.row - originRow;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const isCentered = coordKey === '3,5' || coordKey === '9,3';
      const rot = isCentered ? 0 : (seededRandom() - 0.5) * 16; // Random rotation
      const jx = isCentered ? 0 : (seededRandom() - 0.5) * 2.5;
      const jy = isCentered ? 0 : (seededRandom() - 0.5) * 2.5;

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
        left: `${baseLeft + jx}%`,
        top: `${baseTop + jy}%`,
        width: `${pWidth}%`,
        height: `${pHeight}%`,
        rotate: rot,
        delay: dist * 0.1
      } as (typeof baseCells)[number]);
    });

    const emptyBlueCells: typeof baseCells = frameFoliageSlots.map((slot, i) => {
      const coordKey = `${slot.col},${slot.row}`;
      const baseMultiplier = FOLIAGE_SIZE_OVERRIDES[coordKey] ?? slot.m;
      const multiplier = baseMultiplier * 0.8; // Shrink foliage slightly too
      const w = cellWidth * multiplier;
      const h = cellHeight * multiplier;
      let l: number;
      let t: number;
      if (coordKey === '0,3') {
        // Smaller tile, centered in grid space
        const cellLeft = gridLeft + slot.col * cellWidth;
        l = cellLeft + (cellWidth - w) / 2;
        t = slot.py - h / 2;
      } else {
        l = slot.px - w / 2;
        t = slot.py - h / 2;
      }
      const dx = slot.col - originCol;
      const dy = slot.row - originRow;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const rot = (seededRandom() - 0.5) * 18;
      const jx = (seededRandom() - 0.5) * 2;
      const jy = (seededRandom() - 0.5) * 2;

      return {
        id: `f_dyn_${i}`,
        type: 'foliage',
        color: 'white',
        stage: 2,
        col: slot.col,
        row: slot.row,
        colSpan: 1,
        rowSpan: 1,
        left: `${l + jx}%`,
        top: `${t + jy}%`,
        width: `${w}%`,
        height: `${h}%`,
        rotate: rot,
        delay: dist * 0.1
      } as (typeof baseCells)[number];
    });

    const allCells = [...baseCells, ...emptyBlueCells, ...productCells];

    return allCells;
  }, [products, liveCategories, searchParameters]);
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Responsive square container — kept strictly 1:1 so the % grid stays aligned to the canopy */}
      <div className="relative w-[min(150vw,68vh)] h-[min(150vw,68vh)] sm:w-[min(115vw,78vh)] sm:h-[min(115vw,78vh)] md:w-[800px] md:h-[800px] max-w-[800px] max-h-[800px] flex-shrink-0 origin-center">
        <Fireflies />
        
        {/* Trunk Extension to reach the bottom AI chat */}
        {showCanopy && (
          <div 
            className="absolute left-[45%] top-[95%] w-[10%] h-[100vh] bg-gradient-to-b from-[#451a03] to-[#1a0901]"
            aria-hidden="true"
          />
        )}
        
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
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.70" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.30" />
            </radialGradient>
          </defs>

          {showCanopy && (
            <>
              {/* Organic Trunk */}
              <path 
                d="M 360 420 C 350 550, 370 650, 360 800 L 440 800 C 430 650, 450 550, 440 420 Z" 
                fill="url(#trunkGrad)" 
              />
              {/* Bark texture lines */}
              <path d="M 375 420 C 365 550, 385 650, 375 800" stroke="#290f02" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M 395 420 C 385 550, 405 650, 395 800" stroke="#290f02" strokeWidth="3" fill="none" opacity="0.3" />
              <path d="M 415 420 C 405 550, 425 650, 415 800" stroke="#290f02" strokeWidth="2" fill="none" opacity="0.4" />

              {/* Canopy */}
              <rect
                x="40"
                y="40"
                width="720"
                height="480"
                rx="80"
                ry="80"
                fill="url(#canopyGrad)"
                filter="drop-shadow(0px 10px 30px rgba(16,185,129,0.5)) drop-shadow(0px -10px 40px rgba(16,185,129,0.2))"
              />
            </>
          )}

          {/* Kapruka 'u' smile (Yellow) */}
          <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.2))" opacity="0.85">
            {isSearching ? (
              <>
                <path
                  d="M 240 350 A 160 100 0 0 0 560 350"
                  stroke="#FDE047"
                  strokeWidth="54"
                  strokeLinecap="butt"
                  fill="none"
                  opacity="0.3"
                />
                <motion.path
                  animate={{ 
                    clipPath: [
                      'inset(100% 0% 0% 0%)',
                      'inset(0% 0% 0% 0%)',
                      'inset(0% 0% 0% 0%)'
                    ]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  d="M 240 350 A 160 100 0 0 0 560 350"
                  stroke="#FDE047"
                  strokeWidth="54"
                  strokeLinecap="butt"
                  fill="none"
                />
              </>
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
        {effectiveShowDebugGrid &&
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
          const hasSelection = selectedProduct !== null;
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
                  opacity: isSearching ? 0.7 : (hasSelection ? 0 : 0.95),
                  filter: isSearching ? 'blur(4px) grayscale(50%)' : 'blur(0px) grayscale(0%)',
                  rotate: (cell as any).rotate || 0,
                  pointerEvents: hasSelection ? 'none' : 'auto'
                }}
                transition={{
                  type: 'spring',
                  stiffness: 250,
                  damping: 22,
                  delay: cell.delay
                }}
                className={`absolute rounded-xl ${isWhite ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]' : isBlue ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]' : 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.9)]'}`}
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
                  opacity: isSearching ? 0.7 : (hasSelection ? 0 : 1),
                  filter: isSearching ? 'blur(4px) grayscale(50%)' : 'blur(0px) grayscale(0%)',
                  rotate: (cell as any).rotate || 0,
                  pointerEvents: hasSelection ? 'none' : 'auto'
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: cell.delay
                }}
                className={`absolute rounded-lg sm:rounded-xl flex items-center justify-center px-1 border backdrop-blur-md z-10 ${isWhite ? 'bg-white text-[#402970] shadow-[0_0_16px_rgba(255,255,255,0.6)] border-white' : 'bg-blue-600 text-white shadow-[0_0_16px_rgba(37,99,235,0.6)] border-blue-400/50'}`}
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
            const isCarted = cartItemIds.includes(product.id);
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
                  scale: isSelected ? 1 : 1,
                  opacity: isSearching ? 0.7 : (hasSelection && !isSelected ? 0 : 1),
                  filter: isSearching ? 'blur(4px) grayscale(50%)' : 'blur(0px) grayscale(0%)',
                  rotate: isSelected ? 0 : ((cell as any).rotate || 0),
                  zIndex: isSelected ? 50 : 20,
                  pointerEvents: hasSelection && !isSelected ? 'none' : 'auto'
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: isSearching ? 0 : cell.delay
                }}
                className={`absolute overflow-hidden cursor-pointer group z-20 transition-all duration-300 ${
                  isSelected 
                    ? 'z-50 bg-transparent' 
                    : (isCarted 
                        ? 'rounded-xl border-2 border-yellow-400/50 shadow-[0_0_16px_rgba(253,224,71,0.4)] hover:scale-105 hover:shadow-[0_0_20px_rgba(253,224,71,0.6)]'
                        : 'rounded-xl border-2 border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.4)] hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]')
                }`}
                style={{
                  left: isSelected ? '12%' : cell.left,
                  top: isSelected ? '8%' : cell.top,
                  width: isSelected ? '76%' : cell.width,
                  height: isSelected ? '52%' : cell.height,
                  transitionProperty: isPaging ? 'all' : 'box-shadow, border-color, opacity, left, top, width, height'
                }}
                onClick={() => {
                  if (!isSelected) {
                    onSelectProduct(product.id);
                  }
                }}>
                
                {!isSelected && (
                  <img
                    src={product.image || `https://placehold.co/400x400/1e293b/6ee7b7?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1e293b/6ee7b7?text=Kapruka';
                    }}
                  />
                )}
                
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 flex flex-col sm:flex-row p-4 sm:p-6 text-left z-10 gap-4 sm:gap-6"
                    >
                      <button
                        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(null as any);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      
                      {/* Left: Image */}
                      <div className="w-full sm:w-1/2 h-1/2 sm:h-full rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-[#402970]/[.98]">
                        <img 
                          src={product.image || `https://placehold.co/400x400/1e293b/6ee7b7?text=${encodeURIComponent(product.name)}`} 
                          alt={product.name}
                          className="w-full h-full object-cover shadow-2xl" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1e293b/6ee7b7?text=Kapruka';
                          }}
                        />
                      </div>
                      
                      {/* Right: Details (Scrollable on small screens) */}
                      <div className="flex flex-col flex-1 min-w-0 h-1/2 sm:h-full overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* Category Badge */}
                          {(product.category || product.details?.category) && (
                            <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-[#402970]/[.98] text-white border border-white/10 backdrop-blur-md shadow-sm">
                              {product.category || product.details?.category}
                            </span>
                          )}
                          {/* Stock Badge */}
                          <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-sm ${
                            product.details?.inStock !== false 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            {product.details?.inStock !== false ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-3xl font-bold text-white mb-2 leading-tight drop-shadow-md">{product.name}</h3>
                        <p className="text-emerald-300 font-bold text-lg sm:text-2xl mb-4 drop-shadow-md">LKR {product.price?.toLocaleString()}</p>
                        
                        {/* Description */}
                        {product.details?.description && (
                          <div className="text-white text-sm sm:text-base mb-4 leading-relaxed font-medium bg-[#402970]/[.98] p-3 sm:p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                            <p className="opacity-90">{product.details.description}</p>
                            {(product.details.description.trim().endsWith('...') || product.details.description.trim().endsWith('…')) && (
                              <a 
                                href={product.url || `https://www.kapruka.com/buyonline/${product.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}/kid/${product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Read full description &rarr;
                              </a>
                            )}
                          </div>
                        )}

                        {/* Variants / Attributes */}
                        {product.details?.variants && product.details.variants.length > 0 && (
                          <div className="mb-4 bg-[#402970]/[.98] border border-white/10 rounded-xl p-3 sm:p-4">
                            <h4 className="text-xs sm:text-sm font-semibold text-white/90 mb-2">Product Specifications:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-auto-fit gap-3 text-xs sm:text-sm" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                              {product.details.variants.map((v, i) => (
                                <div key={i} className="flex flex-col bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-lg border border-white/10 shadow-sm h-full">
                                  <span className="text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wider mb-1 font-semibold leading-tight">{v.name}</span>
                                  <span className="text-white/95 font-medium break-words leading-snug">{v.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* View on Kapruka URL */}
                        <a 
                          href={product.url || `https://www.kapruka.com/buyonline/${product.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}/kid/${product.id}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1.5 mb-6 w-fit transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>View details on Kapruka website</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                        </a>
                        
                        <div className="mt-auto pt-4 flex gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCarted) {
                                if (onRemoveFromCart) onRemoveFromCart(product.id);
                              } else {
                                if (onAddToCart) onAddToCart(product.id);
                              }
                            }}
                            className={`flex-1 px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                              isCarted 
                                ? 'bg-yellow-400 hover:bg-yellow-500 text-[#402970]' 
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                            {isCarted ? 'Added to Cart (Remove)' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
          
            <div className="text-center p-6 sm:p-12 mx-4 max-w-[90%] w-full max-w-4xl -mt-32 md:-mt-48">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl sm:text-7xl md:text-8xl font-heading font-bold mb-2 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
              >
                Hello, there
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl sm:text-4xl md:text-5xl font-heading font-medium text-white/95 mb-8 drop-shadow-lg"
              >
                {t('PLACEHOLDER')}
              </motion.h2>
            </div>
          </motion.div>
        }
      </div>
    </div>);

}