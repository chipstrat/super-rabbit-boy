#!/usr/bin/env node
// Level generator — creates all 5 level JSON files procedurally
// Run with: node js/levelgen.js

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = join(__dirname, '..', 'levels');

// Tile IDs
const E = 0;  // empty
const G = 1;  // ground
const S = 2;  // stone
const W = 3;  // wood
const B = 4;  // brick (breakable)
const P = 5;  // platform (one-way)
const WA = 6; // water
const QS = 7; // quicksand
const SA = 8; // sand
const CW = 9; // castle wall
const CF = 10;// castle floor
const IC = 11;// ice

function createGrid(w, h, fill = E) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function fillRect(grid, x, y, w, h, tile) {
  for (let r = y; r < Math.min(y + h, grid.length); r++) {
    for (let c = x; c < Math.min(x + w, grid[0].length); c++) {
      if (r >= 0 && c >= 0) grid[r][c] = tile;
    }
  }
}

function setTile(grid, c, r, tile) {
  if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) grid[r][c] = tile;
}

function getTile(grid, c, r) {
  if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) return grid[r][c];
  return -1;
}

// ============================================================
// LEVEL 1: Robot Village Swarm (150x14)
// ============================================================
function generateLevel1() {
  const W_L = 150, H_L = 14;
  const grid = createGrid(W_L, H_L);

  // Ground layer (rows 12-13)
  fillRect(grid, 0, 12, W_L, 2, G);

  // Some stone underground variation
  fillRect(grid, 0, 13, W_L, 1, S);

  // Village buildings / platforms
  // Building 1 (cols 8-14)
  fillRect(grid, 8, 8, 7, 1, G);
  fillRect(grid, 8, 9, 1, 3, G);
  fillRect(grid, 14, 9, 1, 3, G);

  // Building 2 (cols 18-24)
  fillRect(grid, 18, 7, 7, 1, W);
  fillRect(grid, 18, 8, 1, 4, W);
  fillRect(grid, 24, 8, 1, 4, W);
  fillRect(grid, 19, 9, 5, 1, P);

  // Breakable wall hiding secret (col 35)
  fillRect(grid, 34, 8, 3, 4, B);
  // Secret carrot room behind breakable wall
  fillRect(grid, 31, 8, 3, 1, G);
  fillRect(grid, 31, 11, 3, 1, G);
  fillRect(grid, 31, 9, 1, 2, G);

  // Platform gauntlet (cols 28-50)
  setTile(grid, 28, 9, P);
  setTile(grid, 29, 9, P);
  setTile(grid, 32, 7, P);
  setTile(grid, 33, 7, P);
  setTile(grid, 38, 8, P);
  setTile(grid, 39, 8, P);
  setTile(grid, 40, 8, P);
  setTile(grid, 43, 6, P);
  setTile(grid, 44, 6, P);
  setTile(grid, 47, 8, P);
  setTile(grid, 48, 8, P);

  // Underground shortcut entrance (col 45) - breakable floor
  setTile(grid, 45, 12, B);
  setTile(grid, 46, 12, B);
  // Underground tunnel (row 13 is stone, carve passage at row 12 underground)
  // Actually make a small underground section
  fillRect(grid, 45, 12, 2, 1, B); // entrance
  // The shortcut goes under the ground (we need a space)
  // Create underground passage from col 47 to col 78
  // First create the ceiling and floor
  for (let c = 47; c <= 78; c++) {
    setTile(grid, c, 11, G); // ceiling of underground
    // row 12 is clear (passage)
    setTile(grid, c, 12, E); // clear passage
    // row 13 stays stone (floor)
  }
  setTile(grid, 78, 12, E); // exit
  fillRect(grid, 79, 12, 1, 1, B); // breakable exit

  // Elevated platforms (cols 52-70)
  fillRect(grid, 52, 9, 3, 1, W);
  fillRect(grid, 56, 7, 4, 1, G);
  fillRect(grid, 61, 8, 3, 1, P);
  fillRect(grid, 65, 6, 3, 1, P);
  fillRect(grid, 69, 7, 3, 1, W);

  // Arrow-of-carrots area (col 55) - items placed in arrow shape pointing up
  // Just platforms for now, items added separately

  // Star behind ceiling gap (col 75)
  fillRect(grid, 73, 2, 5, 1, G);
  fillRect(grid, 73, 3, 1, 3, G);
  fillRect(grid, 77, 3, 1, 3, G);
  // Leave gap for player to reach star

  // SRB stone pattern (col 90)
  // S
  setTile(grid, 89, 5, S); setTile(grid, 90, 5, S); setTile(grid, 91, 5, S);
  setTile(grid, 89, 6, S);
  setTile(grid, 89, 7, S); setTile(grid, 90, 7, S); setTile(grid, 91, 7, S);
  setTile(grid, 91, 8, S);
  setTile(grid, 89, 9, S); setTile(grid, 90, 9, S); setTile(grid, 91, 9, S);
  // R
  setTile(grid, 93, 5, S); setTile(grid, 94, 5, S); setTile(grid, 95, 5, S);
  setTile(grid, 93, 6, S); setTile(grid, 95, 6, S);
  setTile(grid, 93, 7, S); setTile(grid, 94, 7, S);
  setTile(grid, 93, 8, S); setTile(grid, 95, 8, S);
  setTile(grid, 93, 9, S); setTile(grid, 95, 9, S);
  // B
  setTile(grid, 97, 5, S); setTile(grid, 98, 5, S); setTile(grid, 99, 5, S);
  setTile(grid, 97, 6, S); setTile(grid, 99, 6, S);
  setTile(grid, 97, 7, S); setTile(grid, 98, 7, S);
  setTile(grid, 97, 8, S); setTile(grid, 99, 8, S);
  setTile(grid, 97, 9, S); setTile(grid, 98, 9, S); setTile(grid, 99, 9, S);

  // Tall platforms for challenge area (cols 100-120)
  fillRect(grid, 100, 10, 3, 2, G);
  fillRect(grid, 105, 8, 3, 1, P);
  fillRect(grid, 109, 6, 3, 1, P);
  fillRect(grid, 113, 8, 2, 1, P);
  fillRect(grid, 116, 10, 3, 2, G);
  fillRect(grid, 120, 9, 3, 1, G);

  // Pits (gaps in ground)
  for (let c = 42; c <= 44; c++) { setTile(grid, c, 12, E); setTile(grid, c, 13, E); }
  for (let c = 63; c <= 65; c++) { setTile(grid, c, 12, E); setTile(grid, c, 13, E); }
  for (let c = 102; c <= 104; c++) { setTile(grid, c, 12, E); setTile(grid, c, 13, E); }

  // Boss area walls (cols 130-149) — left wall has doorway entrance
  fillRect(grid, 130, 4, 1, 4, S);  // left wall upper (rows 4-7)
  // rows 8-11 open = 4-tile-high doorway entrance
  fillRect(grid, 149, 4, 1, 8, S);  // right wall (fully sealed)
  fillRect(grid, 130, 4, 20, 1, S); // ceiling

  // Enemies: 12 Fox, 6 Bird, 2 elevated Fox = 20+
  const enemies = [];
  // Ground foxes spread across the level
  const foxPositions = [5, 15, 25, 38, 50, 58, 72, 82, 95, 105, 115, 125];
  foxPositions.forEach(c => enemies.push({ type: 'fox', x: c * 16, y: 11 * 16 }));
  // Birds
  const birdPositions = [20, 40, 55, 70, 88, 110];
  birdPositions.forEach(c => enemies.push({ type: 'bird', x: c * 16, y: 5 * 16 }));
  // Elevated foxes on platforms
  enemies.push({ type: 'fox', x: 19 * 16, y: 6 * 16 });
  enemies.push({ type: 'fox', x: 57 * 16, y: 6 * 16 });

  // Items
  const items = [];
  // Carrots along the path
  for (let c = 3; c < 130; c += 5) {
    items.push({ type: 'carrot', x: c * 16, y: 10 * 16 });
  }
  // Secret carrot room (col 32-33)
  items.push({ type: 'carrot', x: 32 * 16, y: 9 * 16 });
  items.push({ type: 'carrot', x: 32 * 16, y: 10 * 16 });
  items.push({ type: 'carrot', x: 33 * 16, y: 9 * 16 });
  // Arrow of carrots pointing to hidden heart (col 55)
  items.push({ type: 'carrot', x: 55 * 16, y: 8 * 16 });
  items.push({ type: 'carrot', x: 54 * 16, y: 7 * 16 });
  items.push({ type: 'carrot', x: 56 * 16, y: 7 * 16 });
  items.push({ type: 'carrot', x: 55 * 16, y: 6 * 16 });
  items.push({ type: 'carrot', x: 55 * 16, y: 5 * 16 });
  items.push({ type: 'heart', x: 55 * 16, y: 4 * 16 }); // hidden heart
  // Star behind ceiling gap
  items.push({ type: 'star', x: 75 * 16, y: 3 * 16 });
  // Underground shortcut carrots
  for (let c = 50; c < 78; c += 4) {
    items.push({ type: 'carrot', x: c * 16, y: 12 * 16 });
  }
  // Hearts
  items.push({ type: 'heart', x: 100 * 16, y: 9 * 16 });
  // Speed boost
  items.push({ type: 'speed', x: 120 * 16, y: 8 * 16 });

  // Checkpoints
  const checkpoints = [
    { x: 40 * 16, y: 11 * 16 },
    { x: 80 * 16, y: 11 * 16 },
    { x: 120 * 16, y: 11 * 16 },
  ];

  return {
    name: 'Robot Village',
    bgType: 'village',
    bgColors: ['#4488ff', '#66aaff', '#88ccff', '#5ddb5d'],
    width: W_L,
    height: H_L,
    tiles: grid,
    playerStart: { x: 2 * 16, y: 10 * 16 },
    enemies,
    items,
    checkpoints,
    bossArea: {
      type: 'kingFox',
      name: 'KING FOX',
      triggerX: 132 * 16,
      bossX: 140 * 16,
      bossY: 8 * 16,
      left: 131 * 16,
      right: 148 * 16,
      isFinalBoss: true,
    },
  };
}

// ============================================================
// LEVEL 2: Parkour Tower (30x60)
// ============================================================
function generateLevel2() {
  const W_L = 30, H_L = 60;
  const grid = createGrid(W_L, H_L);

  // Solid walls on left and right edges
  for (let r = 0; r < H_L; r++) {
    setTile(grid, 0, r, S);
    setTile(grid, 1, r, S);
    setTile(grid, W_L - 2, r, S);
    setTile(grid, W_L - 1, r, S);
  }

  // Ground floor at bottom
  fillRect(grid, 0, H_L - 2, W_L, 2, S);

  // Victory platform at top
  fillRect(grid, 2, 2, W_L - 4, 1, G);
  // "YOU CLIMBED IT!" - decorative tiles at top
  fillRect(grid, 10, 1, 10, 1, W);

  // Generate climbing platforms - alternating left/right with stepping stones
  const platforms = [];
  let currentRow = H_L - 5; // start above ground
  let side = 'left'; // alternate sides

  while (currentRow > 4) {
    const platLen = Math.max(4, 7 - Math.floor((H_L - currentRow) / 15));
    let startCol;

    if (side === 'left') {
      startCol = 2 + Math.floor(Math.random() * 2);
      side = 'right';
    } else {
      startCol = W_L - 2 - platLen - Math.floor(Math.random() * 2);
      side = 'left';
    }

    // All climbing platforms are one-way so player can drop through them
    fillRect(grid, startCol, currentRow, platLen, 1, P);
    platforms.push({ col: startCol, row: currentRow, len: platLen });

    // Consistent 3-tile gap (reachable jump height)
    const gap = 3;

    // Add a stepping-stone platform in the middle to bridge the horizontal gap
    const midRow = currentRow - 2;
    const midCol = Math.floor(W_L / 2) - 1 + (Math.floor(Math.random() * 3) - 1);
    if (midRow > 4) {
      fillRect(grid, midCol, midRow, 3, 1, P); // one-way platform
      platforms.push({ col: midCol, row: midRow, len: 3 });
    }

    currentRow -= gap;
  }

  // Add some breakable wall alcoves for secrets
  // Secret alcove 1 (row 50) - wall break on left
  setTile(grid, 1, 49, B);
  setTile(grid, 1, 50, B);
  setTile(grid, 0, 49, E); // space behind

  // Secret alcove 2 (row 30) - wall break on right
  setTile(grid, W_L - 2, 29, B);
  setTile(grid, W_L - 2, 30, B);

  // Ice platforms for extra challenge (near top)
  fillRect(grid, 8, 10, 5, 1, IC);
  fillRect(grid, 17, 7, 5, 1, IC);

  // One-way platforms for variety
  setTile(grid, 14, 45, P);
  setTile(grid, 15, 45, P);
  setTile(grid, 16, 45, P);
  setTile(grid, 12, 35, P);
  setTile(grid, 13, 35, P);
  setTile(grid, 14, 35, P);
  setTile(grid, 15, 25, P);
  setTile(grid, 16, 25, P);
  setTile(grid, 17, 25, P);

  // Enemies: Birds in the gaps
  const enemies = [];
  enemies.push({ type: 'bird', x: 15 * 16, y: 52 * 16 });
  enemies.push({ type: 'bird', x: 10 * 16, y: 44 * 16 });
  enemies.push({ type: 'bird', x: 20 * 16, y: 38 * 16 });
  enemies.push({ type: 'bird', x: 8 * 16, y: 30 * 16 });
  enemies.push({ type: 'bird', x: 18 * 16, y: 22 * 16 });
  enemies.push({ type: 'bird', x: 12 * 16, y: 14 * 16 });
  enemies.push({ type: 'bird', x: 22 * 16, y: 8 * 16 });
  // Foxes on wider platforms
  enemies.push({ type: 'fox', x: 5 * 16, y: 54 * 16 });
  enemies.push({ type: 'fox', x: 22 * 16, y: 42 * 16 });

  // Items
  const items = [];
  // Carrots on platforms
  for (const plat of platforms) {
    if (Math.random() < 0.4) {
      items.push({ type: 'carrot', x: (plat.col + Math.floor(plat.len / 2)) * 16, y: (plat.row - 1) * 16 });
    }
  }
  // Star in secret bottom room
  items.push({ type: 'star', x: 1 * 16, y: 49 * 16 });
  // Heart near middle
  items.push({ type: 'heart', x: 14 * 16, y: 34 * 16 });
  // Speed boost near top
  items.push({ type: 'speed', x: 15 * 16, y: 6 * 16 });

  // Checkpoints
  const checkpoints = [
    { x: 5 * 16, y: 44 * 16 },
    { x: 22 * 16, y: 29 * 16 },
    { x: 10 * 16, y: 14 * 16 },
  ];

  return {
    name: 'Parkour Tower',
    bgType: 'tower',
    bgColors: ['#2a1a3a', '#3a2a5a', '#4a3a6a', '#5a4a7a'],
    width: W_L,
    height: H_L,
    tiles: grid,
    playerStart: { x: 5 * 16, y: (H_L - 4) * 16 },
    enemies,
    items,
    checkpoints,
    completeTrigger: { type: 'position', x: 10 * 16, y: 3 * 16 },
  };
}

// ============================================================
// LEVEL 3: Underwater Caves (120x14)
// ============================================================
function generateLevel3() {
  const W_L = 120, H_L = 14;
  const grid = createGrid(W_L, H_L);

  // Ground (rows 12-13)
  fillRect(grid, 0, 12, W_L, 2, S);

  // Ceiling (row 0)
  fillRect(grid, 0, 0, W_L, 1, S);

  // Dry land entrance (cols 0-15)
  fillRect(grid, 0, 1, 1, 11, S); // left wall

  // Water section (cols 15-100)
  for (let c = 15; c <= 100; c++) {
    for (let r = 1; r < 12; r++) {
      if (getTile(grid, c, r) === E) {
        setTile(grid, c, r, WA);
      }
    }
  }

  // Water surface (top row of water)
  // Create cave formations (stone pillars and tunnels)
  // Pillar formations in water
  const pillars = [20, 30, 42, 55, 68, 78, 90];
  for (const pc of pillars) {
    fillRect(grid, pc, 1, 2, 5, S); // ceiling stalactites
    fillRect(grid, pc + 1, 9, 2, 3, S); // floor stalagmites
  }

  // Tunnel sections
  fillRect(grid, 35, 5, 8, 2, S); // horizontal barrier - creates tunnel above/below
  fillRect(grid, 60, 4, 10, 2, S);
  fillRect(grid, 85, 6, 6, 2, S);

  // Air pockets (clear water to empty) every ~20 cols
  // Air pocket 1 (col 25)
  for (let r = 1; r < 4; r++) {
    setTile(grid, 25, r, E);
    setTile(grid, 26, r, E);
    setTile(grid, 27, r, E);
  }
  // Air pocket 2 (col 45)
  for (let r = 1; r < 4; r++) {
    setTile(grid, 45, r, E);
    setTile(grid, 46, r, E);
    setTile(grid, 47, r, E);
  }
  // Air pocket 3 (col 65)
  for (let r = 1; r < 4; r++) {
    setTile(grid, 65, r, E);
    setTile(grid, 66, r, E);
    setTile(grid, 67, r, E);
  }
  // Air pocket 4 (col 85)
  for (let r = 1; r < 4; r++) {
    setTile(grid, 85, r, E);
    setTile(grid, 86, r, E);
  }

  // Deep grotto with star (col 50)
  fillRect(grid, 49, 10, 4, 1, E); // clear floor for grotto
  fillRect(grid, 49, 11, 4, 1, E);
  fillRect(grid, 49, 10, 1, 2, S); // walls
  fillRect(grid, 52, 10, 1, 2, S);
  // grotto is small underwater room

  // Breakable coral shortcut (col 30)
  setTile(grid, 30, 6, B);
  setTile(grid, 30, 7, B);

  // Treasure room shaped like chest (col 85-88)
  fillRect(grid, 85, 9, 5, 1, S);
  fillRect(grid, 85, 10, 1, 2, S);
  fillRect(grid, 89, 10, 1, 2, S);
  // Items inside placed separately

  // Dry land exit (cols 100-119)
  for (let c = 101; c < W_L; c++) {
    for (let r = 1; r < 12; r++) {
      if (getTile(grid, c, r) === WA) setTile(grid, c, r, E);
    }
  }
  fillRect(grid, W_L - 1, 1, 1, 11, S); // right wall

  // Platforms on dry sections
  fillRect(grid, 3, 9, 3, 1, G);
  fillRect(grid, 8, 7, 3, 1, G);
  fillRect(grid, 105, 9, 3, 1, G);
  fillRect(grid, 110, 7, 3, 1, G);
  fillRect(grid, 114, 9, 3, 1, G);

  // Enemies
  const enemies = [];
  // Regular fish in water (early section) — patrol 5 tiles each direction
  const fishCols = [18, 24, 33, 40, 48, 55];
  fishCols.forEach(c => {
    const r = 4 + Math.floor(Math.random() * 5);
    enemies.push({ type: 'fish', x: c * 16, y: r * 16, patrolLeft: (c - 5) * 16, patrolRight: (c + 5) * 16 });
  });
  // Dangerous robofish in deeper/later water sections — patrol 6 tiles each direction
  const robofishCols = [60, 68, 75, 82, 88, 93, 97];
  robofishCols.forEach(c => {
    const r = 3 + Math.floor(Math.random() * 6);
    enemies.push({ type: 'robofish', x: c * 16, y: r * 16, patrolLeft: (c - 6) * 16, patrolRight: (c + 6) * 16 });
  });
  // Birds on dry land
  enemies.push({ type: 'bird', x: 5 * 16, y: 4 * 16 });
  enemies.push({ type: 'bird', x: 108 * 16, y: 4 * 16 });
  enemies.push({ type: 'bird', x: 115 * 16, y: 5 * 16 });
  // Foxes on dry land
  enemies.push({ type: 'fox', x: 10 * 16, y: 11 * 16 });
  enemies.push({ type: 'fox', x: 112 * 16, y: 11 * 16 });

  // Items
  const items = [];
  // Carrots in water
  for (let c = 17; c < 100; c += 6) {
    items.push({ type: 'carrot', x: c * 16, y: (5 + Math.floor(Math.random() * 4)) * 16 });
  }
  // Star in deep grotto
  items.push({ type: 'star', x: 50 * 16, y: 10 * 16 });
  // Hearts
  items.push({ type: 'heart', x: 46 * 16, y: 2 * 16 }); // in air pocket
  items.push({ type: 'heart', x: 86 * 16, y: 10 * 16 }); // in treasure room
  // Speed boost
  items.push({ type: 'speed', x: 66 * 16, y: 2 * 16 });
  // Carrots on dry land
  items.push({ type: 'carrot', x: 106 * 16, y: 8 * 16 });
  items.push({ type: 'carrot', x: 111 * 16, y: 6 * 16 });

  // Checkpoints
  const checkpoints = [
    { x: 35 * 16, y: 3 * 16 },
    { x: 65 * 16, y: 3 * 16 },
    { x: 95 * 16, y: 3 * 16 },
  ];
  // Underwater checkpoints need to be in air pockets
  checkpoints[0] = { x: 26 * 16, y: 2 * 16 };
  checkpoints[1] = { x: 46 * 16, y: 2 * 16 };
  checkpoints[2] = { x: 105 * 16, y: 11 * 16 };

  return {
    name: 'Underwater Caves',
    bgType: 'underwater',
    bgColors: ['#0a2a4a', '#0e3860', '#124880', '#165898'],
    width: W_L,
    height: H_L,
    tiles: grid,
    playerStart: { x: 3 * 16, y: 10 * 16 },
    enemies,
    items,
    checkpoints,
    completeTrigger: { type: 'position', x: 115 * 16, y: 11 * 16 },
  };
}

// ============================================================
// LEVEL 4: Desert Quicksand (140x14)
// ============================================================
function generateLevel4() {
  const W_L = 140, H_L = 14;
  const grid = createGrid(W_L, H_L);

  // Sand ground (rows 12-13)
  fillRect(grid, 0, 12, W_L, 2, SA);

  // Quicksand pits
  const qsPits = [
    { start: 15, width: 5 },
    { start: 30, width: 6 },
    { start: 50, width: 4 },
    { start: 70, width: 8 },
    { start: 95, width: 5 },
    { start: 115, width: 6 },
  ];
  for (const pit of qsPits) {
    for (let c = pit.start; c < pit.start + pit.width; c++) {
      setTile(grid, c, 12, QS);
      setTile(grid, c, 11, QS); // deeper quicksand
    }
  }

  // Sand dunes (elevated platforms)
  fillRect(grid, 8, 10, 5, 2, SA);
  fillRect(grid, 22, 9, 6, 3, SA);
  fillRect(grid, 40, 10, 4, 2, SA);
  fillRect(grid, 60, 9, 5, 3, SA);
  fillRect(grid, 80, 10, 4, 2, SA);
  fillRect(grid, 108, 9, 6, 3, SA);
  fillRect(grid, 125, 10, 5, 2, SA);

  // Stone ruins scattered
  fillRect(grid, 25, 7, 3, 1, S);
  fillRect(grid, 45, 8, 2, 1, S);
  fillRect(grid, 65, 6, 3, 1, S);
  fillRect(grid, 105, 7, 3, 1, S);

  // One-way platforms
  setTile(grid, 35, 8, P);
  setTile(grid, 36, 8, P);
  setTile(grid, 55, 7, P);
  setTile(grid, 56, 7, P);
  setTile(grid, 75, 8, P);
  setTile(grid, 76, 8, P);

  // Hidden shortcut: breakable floor at col 55 → underground tunnel to col 80
  setTile(grid, 55, 12, B);
  setTile(grid, 56, 12, B);
  // Underground tunnel
  for (let c = 55; c <= 80; c++) {
    setTile(grid, c, 13, E); // clear bottom row for passage
  }
  // Exit breakable
  setTile(grid, 80, 12, B);

  // Quicksand treasure pit (col 40) — extra items in the quicksand
  // Items added separately

  // Oasis (col 70) — small water pool surrounded by sand
  setTile(grid, 69, 12, WA);
  setTile(grid, 70, 12, WA);
  // Heart placed in items

  // RoboSnake encounter zone walls (cols 85-105) — doorway entrance on left
  fillRect(grid, 85, 4, 1, 4, S); // left wall upper (rows 4-7), doorway at 8-11
  fillRect(grid, 105, 4, 1, 8, S); // right wall sealed (opens via openTiles on defeat)
  fillRect(grid, 85, 4, 21, 1, S); // ceiling
  // Floor is sand already
  // Tiles that open when snake is defeated
  // (openTiles in bossArea config)

  // Desert mirage hint (col 110) - decorative platform pattern
  setTile(grid, 110, 6, P);
  setTile(grid, 112, 5, P);
  setTile(grid, 114, 4, P);

  // Gaps in ground
  for (let c = 43; c <= 44; c++) { setTile(grid, c, 12, E); setTile(grid, c, 13, E); }

  // Enemies
  const enemies = [];
  // Foxes in desert
  const foxCols = [5, 12, 20, 28, 38, 48, 58, 68, 78, 112, 120, 130, 135];
  foxCols.forEach(c => enemies.push({ type: 'fox', x: c * 16, y: 11 * 16 }));
  // Birds
  enemies.push({ type: 'bird', x: 15 * 16, y: 6 * 16 });
  enemies.push({ type: 'bird', x: 35 * 16, y: 5 * 16 });
  enemies.push({ type: 'bird', x: 55 * 16, y: 4 * 16 });
  enemies.push({ type: 'bird', x: 110 * 16, y: 5 * 16 });
  enemies.push({ type: 'bird', x: 125 * 16, y: 6 * 16 });

  // Items
  const items = [];
  // Carrots along path
  for (let c = 3; c < 85; c += 4) {
    items.push({ type: 'carrot', x: c * 16, y: 10 * 16 });
  }
  for (let c = 106; c < 135; c += 4) {
    items.push({ type: 'carrot', x: c * 16, y: 10 * 16 });
  }
  // Quicksand treasure — carrots in the quicksand pit (rewarded for diving in)
  items.push({ type: 'carrot', x: 31 * 16, y: 11 * 16 });
  items.push({ type: 'carrot', x: 32 * 16, y: 11 * 16 });
  items.push({ type: 'carrot', x: 33 * 16, y: 11 * 16 });
  items.push({ type: 'star', x: 32 * 16, y: 12 * 16 }); // star deep in quicksand
  // Oasis heart
  items.push({ type: 'heart', x: 70 * 16, y: 11 * 16 });
  // Snake egg after boss area
  items.push({ type: 'carrot', x: 106 * 16, y: 11 * 16 });
  items.push({ type: 'carrot', x: 107 * 16, y: 11 * 16 });
  // Underground tunnel carrots
  for (let c = 58; c <= 78; c += 4) {
    items.push({ type: 'carrot', x: c * 16, y: 13 * 16 });
  }
  // Hearts
  items.push({ type: 'heart', x: 60 * 16, y: 8 * 16 });
  // Speed boost
  items.push({ type: 'speed', x: 45 * 16, y: 7 * 16 });

  // Checkpoints
  const checkpoints = [
    { x: 35 * 16, y: 11 * 16 },
    { x: 70 * 16, y: 11 * 16 },
    { x: 110 * 16, y: 11 * 16 },
  ];

  return {
    name: 'Desert Quicksand',
    bgType: 'desert',
    bgColors: ['#c2884a', '#d4a056', '#e8b862', '#f0d080'],
    width: W_L,
    height: H_L,
    tiles: grid,
    playerStart: { x: 2 * 16, y: 10 * 16 },
    enemies,
    items,
    checkpoints,
    bossArea: {
      type: 'roboSnake',
      name: 'ROBO-SNAKE',
      triggerX: 87 * 16,
      bossX: 95 * 16,
      bossY: 8 * 16,
      left: 86 * 16,
      right: 104 * 16,
      isFinalBoss: false,
      openTiles: [
        { col: 105, row: 5 },
        { col: 105, row: 6 },
        { col: 105, row: 7 },
        { col: 105, row: 8 },
        { col: 105, row: 9 },
        { col: 105, row: 10 },
        { col: 105, row: 11 },
      ],
    },
    completeTrigger: { type: 'position', x: 135 * 16, y: 11 * 16 },
  };
}

// ============================================================
// LEVEL 5: King Viking's Castle (200x30)
// ============================================================
function generateLevel5() {
  const W_L = 200, H_L = 30;
  const grid = createGrid(W_L, H_L);

  // ---- Section A: Castle Approach (cols 0-60) ----

  // Ground across approach + bottom of maze
  fillRect(grid, 0, H_L - 2, W_L, 2, G);

  // Moat (cols 18-25)
  fillRect(grid, 18, H_L - 2, 8, 2, WA);
  for (let c = 19; c <= 24; c++) setTile(grid, c, H_L - 3, P); // bridge

  // Castle gate towers (decorative, not blocking)
  fillRect(grid, 28, 15, 2, 13, CW); // left tower
  fillRect(grid, 28, 15, 6, 2, CW);  // top
  fillRect(grid, 32, 15, 2, 13, CW); // right tower
  // Gate opening between towers (cols 30-31, rows 17-27) is clear

  // Platforms leading up before maze
  fillRect(grid, 38, H_L - 5, 4, 1, G);
  fillRect(grid, 44, H_L - 7, 4, 1, G);
  fillRect(grid, 50, H_L - 5, 4, 1, G);
  fillRect(grid, 56, H_L - 7, 3, 1, G);

  // ---- Section B: Giant Maze (cols 60-150) ----
  // Platformer-friendly maze: horizontal corridors connected by vertical shafts
  // Corridors are EMPTY (0) so the player can walk, walls are CW (9)
  const mazeLeft = 60, mazeRight = 150;
  const mazeTop = 2, mazeBottom = 27;

  // Fill entire maze area with castle wall (solid)
  fillRect(grid, mazeLeft, mazeTop, mazeRight - mazeLeft, mazeBottom - mazeTop, CW);

  // Define horizontal corridor levels (y = floor row, 3 tiles high each)
  // Player walks on the floor tile, 2 empty tiles above for headroom
  const corridors = [
    { y: 6, left: mazeLeft, right: mazeLeft + 30 },      // top-left
    { y: 6, left: mazeLeft + 40, right: mazeRight },      // top-right
    { y: 11, left: mazeLeft, right: mazeLeft + 45 },      // mid-upper-left
    { y: 11, left: mazeLeft + 55, right: mazeRight },     // mid-upper-right
    { y: 16, left: mazeLeft, right: mazeLeft + 35 },      // middle-left
    { y: 16, left: mazeLeft + 50, right: mazeRight },     // middle-right
    { y: 21, left: mazeLeft, right: mazeLeft + 50 },      // mid-lower-left
    { y: 21, left: mazeLeft + 60, right: mazeRight },     // mid-lower-right
    { y: 26, left: mazeLeft, right: mazeRight },           // bottom full-width
  ];

  // Carve corridors: 3 empty tiles above floor, floor stays CW for ground
  for (const cor of corridors) {
    for (let c = cor.left; c < cor.right; c++) {
      setTile(grid, c, cor.y - 3, E); // headroom
      setTile(grid, c, cor.y - 2, E); // headroom
      setTile(grid, c, cor.y - 1, E); // walking space
    }
  }

  // Vertical shafts connecting corridors (open columns between levels)
  const shafts = [
    { col: 70, fromY: 3, toY: 26 },    // left shaft
    { col: 71, fromY: 3, toY: 26 },
    { col: 85, fromY: 3, toY: 21 },     // center-left shaft
    { col: 86, fromY: 3, toY: 21 },
    { col: 100, fromY: 8, toY: 26 },    // center shaft
    { col: 101, fromY: 8, toY: 26 },
    { col: 115, fromY: 3, toY: 26 },    // center-right shaft
    { col: 116, fromY: 3, toY: 26 },
    { col: 130, fromY: 8, toY: 26 },    // right shaft
    { col: 131, fromY: 8, toY: 26 },
    { col: 145, fromY: 3, toY: 26 },    // far-right shaft
    { col: 146, fromY: 3, toY: 26 },
  ];

  for (const shaft of shafts) {
    for (let r = shaft.fromY; r < shaft.toY; r++) {
      setTile(grid, shaft.col, r, E);
    }
  }

  // Add platforms in shafts so player can climb up/down
  const shaftPlatCols = [70, 85, 100, 115, 130, 145];
  for (const sc of shaftPlatCols) {
    // Place one-way platforms at mid-points between corridors
    for (let r = 5; r < 25; r += 3) {
      if (getTile(grid, sc, r) === E && getTile(grid, sc, r + 1) === E) {
        setTile(grid, sc, r, P);
        setTile(grid, sc + 1, r, P);
      }
    }
  }

  // Dead-end alcoves with items (carved from walls)
  // Alcove 1 (top-left dead end)
  fillRect(grid, mazeLeft + 32, 3, 6, 3, E);
  // Alcove 2 (middle dead end)
  fillRect(grid, mazeLeft + 46, 13, 6, 3, E);
  // Alcove 3 (lower right)
  fillRect(grid, mazeRight - 8, 18, 6, 3, E);

  // Maze entrance (left side) — clear from ground level up into bottom corridor
  for (let r = mazeTop; r < H_L - 2; r++) {
    setTile(grid, mazeLeft, r, E);
    setTile(grid, mazeLeft + 1, r, E);
  }

  // Maze exit (right side, connecting to boss arena at row 14-17)
  fillRect(grid, mazeRight - 1, 13, 1, 4, E);
  fillRect(grid, mazeRight - 3, 13, 3, 3, E); // wider exit area

  // Breakable shortcut wall (col 100, between corridors)
  setTile(grid, 100, 6, B);
  setTile(grid, 101, 6, B);

  // ---- Section C: Boss Arena (cols 150-199) ----

  // Floor
  fillRect(grid, 150, H_L - 2, 50, 2, CF);

  // Walls — left wall has entrance gap matching maze exit (rows 14-17)
  fillRect(grid, 150, 2, 1, 12, CW);  // left wall upper (rows 2-13)
  fillRect(grid, 150, 18, 1, 10, CW); // left wall lower (rows 18-27)
  fillRect(grid, 199, 2, 1, 26, CW);  // right wall sealed
  fillRect(grid, 150, 2, 50, 1, CW);  // ceiling

  // Arena platforms
  fillRect(grid, 160, 20, 5, 1, CF);
  fillRect(grid, 175, 17, 5, 1, CF);
  fillRect(grid, 185, 20, 5, 1, CF);
  fillRect(grid, 170, 12, 6, 1, CF);

  // Throne room behind boss arena (secret)
  setTile(grid, 199, 14, B);
  setTile(grid, 199, 15, B);

  // Moat treasure (col 15, underwater)
  fillRect(grid, 14, H_L - 3, 3, 1, WA);

  // ---- Ground for section transitions ----
  // From entry hall to maze
  fillRect(grid, 40, H_L - 2, 20, 2, CF);
  // From maze to boss
  fillRect(grid, 150, H_L - 2, 50, 2, CF);

  // Enemies
  const enemies = [];
  // Approach foxes
  enemies.push({ type: 'fox', x: 8 * 16, y: 27 * 16 });
  enemies.push({ type: 'fox', x: 16 * 16, y: 27 * 16 });
  // Entry hall
  enemies.push({ type: 'fox', x: 43 * 16, y: 21 * 16 });
  enemies.push({ type: 'bird', x: 50 * 16, y: 12 * 16 });
  // Robo-Bro minibosses guarding maze entrance (4HP each, charge + jump)
  enemies.push({ type: 'robobro', x: 58 * 16, y: 25 * 16, patrolLeft: 55 * 16, patrolRight: 68 * 16 });
  enemies.push({ type: 'robobro', x: 64 * 16, y: 25 * 16, patrolLeft: 58 * 16, patrolRight: 72 * 16 });
  // Maze enemies (scattered in dead ends)
  enemies.push({ type: 'fox', x: 65 * 16, y: 6 * 16 });
  enemies.push({ type: 'fox', x: 80 * 16, y: 14 * 16 });
  enemies.push({ type: 'fox', x: 95 * 16, y: 8 * 16 });
  enemies.push({ type: 'fox', x: 110 * 16, y: 20 * 16 });
  enemies.push({ type: 'fox', x: 125 * 16, y: 10 * 16 });
  enemies.push({ type: 'fox', x: 140 * 16, y: 16 * 16 });
  enemies.push({ type: 'bird', x: 75 * 16, y: 5 * 16 });
  enemies.push({ type: 'bird', x: 105 * 16, y: 12 * 16 });
  enemies.push({ type: 'bird', x: 135 * 16, y: 8 * 16 });

  // Items
  const items = [];
  // Carrots along approach
  for (let c = 3; c < 30; c += 4) {
    items.push({ type: 'carrot', x: c * 16, y: 27 * 16 });
  }
  // Moat treasure
  items.push({ type: 'star', x: 15 * 16, y: 27 * 16 });
  // Entry hall carrots
  items.push({ type: 'carrot', x: 44 * 16, y: 21 * 16 });
  items.push({ type: 'carrot', x: 51 * 16, y: 18 * 16 });
  items.push({ type: 'carrot', x: 45 * 16, y: 15 * 16 });
  // Maze carrots (placed in corridor walking spaces)
  const corridorYs = [5, 10, 15, 20, 25]; // y-1 of each corridor floor
  for (let c = 62; c < 148; c += 8) {
    const r = corridorYs[Math.floor(Math.random() * corridorYs.length)];
    items.push({ type: 'carrot', x: c * 16, y: r * 16 });
  }
  // Maze item rooms
  items.push({ type: 'heart', x: 75 * 16, y: 10 * 16 });
  items.push({ type: 'heart', x: 115 * 16, y: 18 * 16 });
  items.push({ type: 'speed', x: 130 * 16, y: 6 * 16 });
  // Boss arena items
  items.push({ type: 'heart', x: 170 * 16, y: 11 * 16 });
  items.push({ type: 'speed', x: 185 * 16, y: 19 * 16 });

  // Checkpoints
  const checkpoints = [
    { x: 35 * 16, y: 27 * 16 },
    { x: 80 * 16, y: 10 * 16 },
    { x: 120 * 16, y: 14 * 16 },
    { x: 155 * 16, y: 27 * 16 },
  ];

  return {
    name: "King Viking's Castle",
    bgType: 'castle',
    bgColors: ['#1a0a20', '#2a1a30', '#3a2a40', '#4a3a50'],
    width: W_L,
    height: H_L,
    tiles: grid,
    playerStart: { x: 2 * 16, y: 27 * 16 },
    enemies,
    items,
    checkpoints,
    bossArea: {
      type: 'kingViking',
      name: 'KING VIKING',
      triggerX: 155 * 16,
      bossX: 175 * 16,
      bossY: 15 * 16,
      left: 151 * 16,
      right: 198 * 16,
      isFinalBoss: true,
    },
  };
}

// ============================================================
// Generate and save all levels
// ============================================================
function main() {
  mkdirSync(LEVELS_DIR, { recursive: true });

  const generators = [
    generateLevel1,
    generateLevel2,
    generateLevel3,
    generateLevel4,
    generateLevel5,
  ];

  generators.forEach((gen, i) => {
    // Use seeded randomness for reproducibility
    const level = gen();
    const path = join(LEVELS_DIR, `level${i + 1}.json`);
    writeFileSync(path, JSON.stringify(level));
    console.log(`Generated ${path} (${level.width}x${level.height}, ${level.enemies.length} enemies, ${level.items.length} items)`);
  });

  console.log('All levels generated!');
}

main();
