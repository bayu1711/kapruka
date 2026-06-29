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
  onOpenDevTools: () => void;
  showDebugGrid: boolean;
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
  onOpenDevTools,
  showDebugGrid
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

    // Apply live category names to label cells if we have them from MCP
    const labelCells = GRID_LAYOUT.filter((c) => c.type === 'label');
    const liveLayout: GridCell[] = GRID_LAYOUT.map((cell) => {
      if (cell.type !== 'label' || liveCategories.length === 0) return cell;
      const idx = labelCells.indexOf(cell);
      if (idx >= 0 && idx < liveCategories.length) {
        return { ...cell, contentId: liveCategories[idx] };
      }
      return cell;
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

    // Move product 2,6 → 5,0
    const moveIdx = finalProductSlots.findIndex(
      (s) => s.col === 2 && s.row === 6 && s.colSpan === 1
    );
    if (moveIdx >= 0) {
      finalProductSlots[moveIdx] = { ...finalProductSlots[moveIdx], col: 5, row: 0 };
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

      const isCentered = coordKey === '3,5' || coordKey === '9,3' || coordKey === '5,0';
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
  }, [products, liveCategories]);
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Responsive square container — kept strictly 1:1 so the % grid stays aligned to the canopy */}
      <div className="relative w-[min(150vw,68vh)] h-[min(150vw,68vh)] sm:w-[min(115vw,78vh)] sm:h-[min(115vw,78vh)] md:w-[800px] md:h-[800px] max-w-[800px] max-h-[800px] flex-shrink-0 origin-center">
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
              <stop offset="0%" stopColor="#402970" />
              <stop offset="100%" stopColor="#241740" />
            </linearGradient>
            <radialGradient id="canopyGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.15" />
            </radialGradient>
          </defs>

          {/* Soft canopy backing (enlarged so product tiles stay inside) */}
          <ellipse
            cx="400"
            cy="280"
            rx="360"
            ry="270"
            fill="url(#canopyGrad)" />
          

          {/* Trunk */}
          <path
            d="M370 750 C 370 650, 352 560, 380 480 L 420 480 C 448 560, 430 650, 430 750 Z"
            fill="url(#trunkGrad)" />
          

          {/* Branches (reach higher into the bigger canopy) */}
          <g stroke="url(#trunkGrad)" strokeLinecap="round" fill="none">
            <path d="M400 500 C 300 430, 230 340, 180 250" strokeWidth="32" />
            <path d="M400 500 C 500 430, 570 340, 620 250" strokeWidth="32" />
            <path d="M388 480 C 360 390, 350 290, 350 200" strokeWidth="28" />
            <path d="M412 480 C 440 390, 452 300, 470 210" strokeWidth="26" />
            <path d="M250 320 C 215 285, 195 255, 175 215" strokeWidth="16" />
            <path d="M550 320 C 585 285, 605 255, 625 215" strokeWidth="16" />
          </g>
        </svg>

        <button
          type="button"
          onClick={onOpenDevTools}
          aria-label="Open Developer Tools"
          className="absolute top-2 right-2 z-[60] flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] sm:text-xs font-mono font-semibold transition-colors border-white/30 bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
          Dev Tools
        </button>

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
                  opacity: 0.95,
                  filter: 'blur(0px)',
                  rotate: (cell as any).rotate || 0
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
                  opacity: 1,
                  filter: 'blur(0px)',
                  rotate: (cell as any).rotate || 0
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
                  opacity: 1,
                  filter: 'blur(0px)',
                  rotate: isSelected ? 0 : ((cell as any).rotate || 0)
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: cell.delay
                }}
                className={`absolute rounded-xl overflow-hidden cursor-pointer group z-20 duration-300 border-2 ${isSelected ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.8)] z-30' : 'border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.4)] hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]'}`}
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
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
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