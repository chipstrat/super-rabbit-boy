// Sprite system — hybrid: procedural cartoon drawing for characters,
// pixel arrays for tiles and small items.
// Style: bold outlines, smooth shapes, inspired by children's graphic novels

const C = null;

// Colors
const BLACK = '#222034';
const WHITE = '#ffffff';
const RABBIT_WHITE = '#f8f8f8';
const RABBIT_PINK = '#ffaacc';
const RABBIT_EYE = '#222034';
const GRASS_TOP = '#5ddb5d';
const GRASS_DARK = '#3dbd3d';
const DIRT = '#c4813a';
const DIRT_DARK = '#a06828';
const STONE = '#8a8a9a';
const STONE_DARK = '#6a6a7a';
const STONE_LIGHT = '#aaaaba';
const PLATFORM = '#d4a340';
const PLATFORM_LIGHT = '#f0c060';
const CARROT_ORANGE = '#ff8c00';
const CARROT_GREEN = '#3ac73a';
const HEART_RED = '#ff3b3b';
const STAR_YELLOW = '#ffe347';
const STAR_BRIGHT = '#fff8a0';
const BRICK = '#e04040';
const BRICK_DARK = '#b03030';
const SPRING_GREEN = '#3be8e8';
const ROBOT_GRAY = '#8899aa';
const ROBOT_DARK = '#556677';
const ROBOT_LIGHT = '#aabbcc';
const ROBOT_EYE = '#ff3333';
const ROBOT_BODY = '#667788';
const FLY_ROBOT = '#7788cc';
const FLY_DARK = '#5566aa';
const FLY_LIGHT = '#99aadd';
const FLY_PROP = '#ccccdd';
const VIKING_SKIN = '#ffb899';
const VIKING_SKIN_DARK = '#e09878';
const VIKING_HELMET = '#6644cc';
const VIKING_HELMET_DARK = '#4422aa';
const VIKING_HORN = '#ddcc44';
const VIKING_MUSTACHE = '#222034';
const VIKING_SHIRT = '#4488dd';
const VIKING_BELT = '#ffcc33';
const VIKING_BOOT = '#4422aa';

// ── Tile pixel arrays (kept as-is for tiles) ──

const TILE_GRASS = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(DIRT));
  for (let x = 0; x < 16; x++) {
    t[0][x] = GRASS_TOP; t[1][x] = GRASS_TOP;
    t[2][x] = (x % 3 === 0) ? GRASS_DARK : GRASS_TOP;
    t[3][x] = (x % 5 === 1) ? GRASS_DARK : GRASS_TOP;
  }
  for (let y = 4; y < 16; y++)
    for (let x = 0; x < 16; x++)
      t[y][x] = ((x + y) % 7 === 0) ? DIRT_DARK : DIRT;
  return t;
})();

const TILE_DIRT = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(DIRT));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++)
      if ((x + y) % 7 === 0) t[y][x] = DIRT_DARK;
  return t;
})();

const TILE_STONE = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(STONE));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if ((x * 3 + y * 5) % 11 === 0) t[y][x] = STONE_LIGHT;
      if ((x * 7 + y * 2) % 13 === 0) t[y][x] = STONE_DARK;
    }
  for (let x = 0; x < 16; x++) { t[7][x] = STONE_DARK; t[15][x] = STONE_DARK; }
  for (let y = 0; y < 8; y++) t[y][7] = STONE_DARK;
  for (let y = 8; y < 16; y++) { t[y][0] = STONE_DARK; t[y][15] = STONE_DARK; }
  return t;
})();

const TILE_BRICK = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(BRICK));
  for (let x = 0; x < 16; x++) { t[3][x] = BRICK_DARK; t[7][x] = BRICK_DARK; t[11][x] = BRICK_DARK; t[15][x] = BRICK_DARK; }
  for (let y = 0; y < 4; y++) t[y][7] = BRICK_DARK;
  for (let y = 4; y < 8; y++) { t[y][3] = BRICK_DARK; t[y][11] = BRICK_DARK; }
  for (let y = 8; y < 12; y++) t[y][7] = BRICK_DARK;
  for (let y = 12; y < 16; y++) { t[y][3] = BRICK_DARK; t[y][11] = BRICK_DARK; }
  return t;
})();

const TILE_PLATFORM = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(C));
  for (let x = 0; x < 16; x++) {
    t[0][x] = PLATFORM; t[1][x] = PLATFORM;
    t[2][x] = PLATFORM_LIGHT; t[3][x] = PLATFORM;
  }
  for (let y = 4; y < 16; y++) {
    t[y][2] = PLATFORM; t[y][3] = PLATFORM_LIGHT;
    t[y][12] = PLATFORM; t[y][13] = PLATFORM_LIGHT;
  }
  return t;
})();

// Checkpoint flag pixel array
const SPRITE_CHECKPOINT = [
  [C,C,C,HEART_RED,HEART_RED,HEART_RED,HEART_RED,HEART_RED,C,C,C,C,C,C,C,C],
  [C,C,C,HEART_RED,HEART_RED,HEART_RED,HEART_RED,HEART_RED,C,C,C,C,C,C,C,C],
  [C,C,C,HEART_RED,HEART_RED,'#ff9999',HEART_RED,HEART_RED,C,C,C,C,C,C,C,C],
  [C,C,C,HEART_RED,HEART_RED,HEART_RED,HEART_RED,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,STONE,C,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,STONE,STONE,STONE,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,STONE,STONE,STONE,C,C,C,C,C,C,C,C,C,C,C],
  [C,C,C,C,C,C,C,C,C,C,C,C,C,C,C,C],
];


// ── New tile pixel arrays for expanded levels ──

const WATER = '#3388cc';
const WATER_LIGHT = '#55aaee';
const WATER_DARK = '#2266aa';
const SAND_COLOR = '#e8d088';
const SAND_DARK = '#c8b068';
const SAND_LIGHT = '#f8e0a8';
const QS_COLOR = '#b89858';
const QS_DARK = '#987838';
const CASTLE_W = '#555566';
const CASTLE_D = '#444455';
const CASTLE_L = '#666677';
const ICE_COLOR = '#ccddff';
const ICE_LIGHT = '#eef4ff';
const ICE_DARK = '#aabbdd';

const TILE_WATER = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(WATER));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 5 === 0) t[y][x] = WATER_LIGHT;
      if ((x * 3 + y * 7) % 11 === 0) t[y][x] = WATER_DARK;
    }
  // Surface ripple on top row
  for (let x = 0; x < 16; x++) { t[0][x] = WATER_LIGHT; t[1][x] = WATER_LIGHT; }
  return t;
})();

const TILE_QUICKSAND = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(QS_COLOR));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if ((x + y * 3) % 7 === 0) t[y][x] = QS_DARK;
      if ((x * 5 + y) % 9 === 0) t[y][x] = SAND_COLOR;
    }
  return t;
})();

const TILE_SAND = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(SAND_COLOR));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 7 === 0) t[y][x] = SAND_DARK;
      if ((x * 3 + y * 2) % 11 === 0) t[y][x] = SAND_LIGHT;
    }
  // Top edge slightly lighter
  for (let x = 0; x < 16; x++) { t[0][x] = SAND_LIGHT; t[1][x] = SAND_LIGHT; }
  return t;
})();

const TILE_CASTLE_WALL = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(CASTLE_W));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if ((x * 3 + y * 5) % 11 === 0) t[y][x] = CASTLE_L;
      if ((x * 7 + y * 2) % 13 === 0) t[y][x] = CASTLE_D;
    }
  // Mortar lines
  for (let x = 0; x < 16; x++) { t[7][x] = CASTLE_D; t[15][x] = CASTLE_D; }
  for (let y = 0; y < 8; y++) t[y][7] = CASTLE_D;
  for (let y = 8; y < 16; y++) { t[y][0] = CASTLE_D; t[y][15] = CASTLE_D; }
  return t;
})();

const TILE_CASTLE_FLOOR = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(CASTLE_L));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 4 === 0) t[y][x] = CASTLE_W;
    }
  for (let x = 0; x < 16; x++) { t[0][x] = '#777788'; }
  return t;
})();

const TILE_ICE = (() => {
  const t = Array.from({ length: 16 }, () => Array(16).fill(ICE_COLOR));
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 5 === 0) t[y][x] = ICE_LIGHT;
      if ((x * 3 + y * 7) % 13 === 0) t[y][x] = ICE_DARK;
    }
  // Shine spots
  t[2][3] = ICE_LIGHT; t[2][4] = ICE_LIGHT;
  t[6][10] = ICE_LIGHT; t[6][11] = ICE_LIGHT;
  return t;
})();

// ── Procedural draw functions for characters ──
// These draw smooth, outlined cartoon-style characters using Canvas 2D

function drawRabbitIdle(ctx, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  const o = BLACK; // outline
  const w = RABBIT_WHITE;
  const p = RABBIT_PINK;
  const e = RABBIT_EYE;

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = o;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Left ear
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(5, 3, 1.5, 4, -0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(5, 3, 0.7, 2.5, -0.15, 0, Math.PI * 2); ctx.fill();

  // Right ear
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(11, 3, 1.5, 4, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(11, 3, 0.7, 2.5, 0.15, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(8, 8, 5, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Eyes
  ctx.fillStyle = e;
  ctx.beginPath(); ctx.ellipse(6, 7.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 7.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  // Eye shine
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.arc(6.5, 7, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.5, 7, 0.4, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(8, 9, 0.6, 0.4, 0, 0, Math.PI * 2); ctx.fill();

  // Mouth — small smile
  ctx.strokeStyle = o;
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(8, 9.5, 1.2, 0.2, Math.PI - 0.2); ctx.stroke();

  // Body
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = o;
  ctx.fillStyle = w;
  ctx.beginPath();
  ctx.ellipse(8, 13, 3.5, 3, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Tail (little circle on back)
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.arc(12, 13, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Left leg
  ctx.fillStyle = w;
  ctx.beginPath();
  ctx.ellipse(6, 15.5, 1.8, 1, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Right leg
  ctx.fillStyle = w;
  ctx.beginPath();
  ctx.ellipse(10, 15.5, 1.8, 1, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.restore();
}

function drawRabbitRun(ctx, frame, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  const o = BLACK, w = RABBIT_WHITE, p = RABBIT_PINK, e = RABBIT_EYE;
  ctx.lineWidth = 1.2; ctx.strokeStyle = o; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // Ears tilted back
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(4, 2.5, 1.5, 3.5, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(4, 2.5, 0.7, 2, -0.4, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(10, 2.5, 1.5, 3.5, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(10, 2.5, 0.7, 2, 0.1, 0, Math.PI * 2); ctx.fill();

  // Head (slightly forward)
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(8, 7.5, 5, 4.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Determined eyes
  ctx.fillStyle = e;
  ctx.beginPath(); ctx.ellipse(6, 7, 1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 7, 1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.arc(6.5, 6.5, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.5, 6.5, 0.4, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(8, 8.5, 0.6, 0.4, 0, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = o; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(8, 9, 1, 0.2, Math.PI - 0.2); ctx.stroke();

  // Body leaning forward
  ctx.lineWidth = 1.2; ctx.strokeStyle = o;
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(8, 12.5, 3.5, 2.8, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Tail
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.arc(12.5, 12, 1.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Legs — alternating
  const legOffset = frame === 0 ? 1.5 : -1.5;
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(6 - legOffset * 0.3, 15.5, 2, 1, legOffset * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10 + legOffset * 0.3, 15.5, 2, 1, -legOffset * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.restore();
}

function drawRabbitJump(ctx, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  const o = BLACK, w = RABBIT_WHITE, p = RABBIT_PINK, e = RABBIT_EYE;
  ctx.lineWidth = 1.2; ctx.strokeStyle = o; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // Ears straight up, spread
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(4, 2, 1.5, 4, -0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(4, 2, 0.7, 2.5, -0.25, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(12, 2, 1.5, 4, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(12, 2, 0.7, 2.5, 0.25, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(8, 7.5, 5, 4.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Excited eyes (wider)
  ctx.fillStyle = e;
  ctx.beginPath(); ctx.ellipse(6, 7, 1.1, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 7, 1.1, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.arc(6.6, 6.3, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.6, 6.3, 0.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = p;
  ctx.beginPath(); ctx.ellipse(8, 8.5, 0.6, 0.4, 0, 0, Math.PI * 2); ctx.fill();

  // Open mouth — excited
  ctx.fillStyle = '#ff6688';
  ctx.beginPath(); ctx.ellipse(8, 9.8, 1.5, 1, 0, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = o; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(8, 9.8, 1.5, 1, 0, 0, Math.PI); ctx.stroke();

  // Body (compact for jump)
  ctx.lineWidth = 1.2; ctx.strokeStyle = o;
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(8, 12.5, 3.2, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Arms out
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(2.5, 10.5, 1.5, 1, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(13.5, 10.5, 1.5, 1, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Legs tucked
  ctx.fillStyle = w;
  ctx.beginPath(); ctx.ellipse(6, 15, 2, 1, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10, 15, 2, 1, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.restore();
}

// ── Robot enemy (ground) — cartoon style ──
function drawRobot(ctx, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  ctx.lineWidth = 1.2; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';

  // Antenna
  ctx.strokeStyle = ROBOT_DARK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, 1); ctx.lineTo(8, 3); ctx.stroke();
  ctx.fillStyle = ROBOT_EYE;
  ctx.beginPath(); ctx.arc(8, 1, 1, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.strokeStyle = BLACK; ctx.lineWidth = 1.2;
  ctx.fillStyle = ROBOT_GRAY;
  ctx.beginPath();
  ctx.roundRect(3, 3, 10, 7, 2);
  ctx.fill(); ctx.stroke();

  // Eyes
  ctx.fillStyle = ROBOT_EYE;
  ctx.beginPath(); ctx.arc(5.5, 6, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.5, 6, 1.2, 0, Math.PI * 2); ctx.fill();
  // Eye glow
  ctx.fillStyle = '#ff8888';
  ctx.beginPath(); ctx.arc(5.8, 5.6, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.8, 5.6, 0.4, 0, Math.PI * 2); ctx.fill();

  // Mouth slit
  ctx.strokeStyle = ROBOT_DARK; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(5.5, 8.5); ctx.lineTo(10.5, 8.5); ctx.stroke();

  // Body
  ctx.strokeStyle = BLACK; ctx.lineWidth = 1.2;
  ctx.fillStyle = ROBOT_BODY;
  ctx.beginPath();
  ctx.roundRect(4, 10, 8, 5, 1);
  ctx.fill(); ctx.stroke();

  // Rivets
  ctx.fillStyle = ROBOT_LIGHT;
  ctx.beginPath(); ctx.arc(6, 12, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, 12, 0.6, 0, Math.PI * 2); ctx.fill();

  // Legs
  ctx.fillStyle = ROBOT_DARK;
  ctx.fillRect(5, 15, 2, 1); ctx.strokeRect(5, 15, 2, 1);
  ctx.fillRect(9, 15, 2, 1); ctx.strokeRect(9, 15, 2, 1);

  ctx.restore();
}

// ── Flying robot ──
function drawFlyRobot(ctx, frame, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';

  // Propeller
  const propW = frame === 0 ? 10 : 6;
  ctx.fillStyle = FLY_PROP;
  ctx.fillRect(8 - propW / 2, 0, propW, 1.5);
  ctx.strokeRect(8 - propW / 2, 0, propW, 1.5);

  // Shaft
  ctx.fillStyle = FLY_DARK;
  ctx.fillRect(7.5, 1.5, 1, 1.5);

  // Body
  ctx.lineWidth = 1.2;
  ctx.fillStyle = FLY_ROBOT;
  ctx.beginPath(); ctx.ellipse(8, 6, 4.5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Eyes
  ctx.fillStyle = ROBOT_EYE;
  ctx.beginPath(); ctx.arc(6, 5.5, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, 5.5, 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff8888';
  ctx.beginPath(); ctx.arc(6.3, 5.2, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10.3, 5.2, 0.3, 0, Math.PI * 2); ctx.fill();

  // Bottom
  ctx.fillStyle = FLY_DARK;
  ctx.beginPath(); ctx.ellipse(8, 9, 2, 1, 0, 0, Math.PI); ctx.fill(); ctx.stroke();

  ctx.restore();
}

// ── King Viking boss ──
function drawKingViking(ctx, flipX, scale) {
  ctx.save();
  const s = scale;
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16 * s, 0); }
  ctx.scale(s, s);
  ctx.lineWidth = 1.2 / s * 1.2; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // Horns
  ctx.fillStyle = VIKING_HORN;
  ctx.beginPath();
  ctx.moveTo(1, 4); ctx.lineTo(0, 0); ctx.lineTo(3, 3);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, 4); ctx.lineTo(16, 0); ctx.lineTo(13, 3);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // Helmet
  ctx.fillStyle = VIKING_HELMET;
  ctx.beginPath();
  ctx.roundRect(2, 2, 12, 4, 1.5);
  ctx.fill(); ctx.stroke();
  // Helmet band
  ctx.fillStyle = VIKING_BELT;
  ctx.fillRect(3, 5, 10, 1.2);

  // Face
  ctx.fillStyle = VIKING_SKIN;
  ctx.beginPath(); ctx.ellipse(8, 8.5, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Eyes (angry)
  ctx.fillStyle = RABBIT_EYE;
  ctx.beginPath(); ctx.ellipse(5.5, 7.8, 1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10.5, 7.8, 1, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  // Angry eyebrows
  ctx.strokeStyle = BLACK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(4, 6.5); ctx.lineTo(7, 6.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, 6.5); ctx.lineTo(9, 6.8); ctx.stroke();

  // Big nose
  ctx.fillStyle = VIKING_SKIN_DARK;
  ctx.beginPath(); ctx.ellipse(8, 9, 1.2, 0.8, 0, 0, Math.PI * 2); ctx.fill();

  // Mustache
  ctx.fillStyle = VIKING_MUSTACHE;
  ctx.beginPath();
  ctx.moveTo(4, 10); ctx.quadraticCurveTo(6, 11.5, 8, 10);
  ctx.quadraticCurveTo(10, 11.5, 12, 10);
  ctx.quadraticCurveTo(10, 10.5, 8, 10.5);
  ctx.quadraticCurveTo(6, 10.5, 4, 10);
  ctx.fill();

  // Body
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = BLACK;
  ctx.fillStyle = VIKING_SHIRT;
  ctx.beginPath();
  ctx.roundRect(3, 11.5, 10, 5, 1);
  ctx.fill(); ctx.stroke();

  // Belt
  ctx.fillStyle = VIKING_BELT;
  ctx.fillRect(4, 14, 8, 1.5);
  ctx.strokeRect(4, 14, 8, 1.5);

  // Boots
  ctx.fillStyle = VIKING_BOOT;
  ctx.beginPath(); ctx.roundRect(3.5, 16.5, 3.5, 2, 0.8); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(9, 16.5, 3.5, 2, 0.8); ctx.fill(); ctx.stroke();

  ctx.restore();
}


// ── Fish enemy ──
function drawFish(ctx, frame, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';
  // Body
  ctx.fillStyle = '#ff6644';
  ctx.beginPath(); ctx.ellipse(8, 7, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Belly
  ctx.fillStyle = '#ffaa66';
  ctx.beginPath(); ctx.ellipse(8, 8.5, 3.5, 1.5, 0, 0, Math.PI); ctx.fill();
  // Tail fin
  const tailW = frame === 0 ? 3 : 2;
  ctx.fillStyle = '#cc4422';
  ctx.beginPath(); ctx.moveTo(13, 7); ctx.lineTo(13 + tailW, 4); ctx.lineTo(13 + tailW, 10); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Eye
  ctx.fillStyle = '#222034';
  ctx.beginPath(); ctx.arc(5, 6, 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.arc(5.3, 5.7, 0.3, 0, Math.PI * 2); ctx.fill();
  // Top fin
  ctx.fillStyle = '#cc4422';
  ctx.beginPath(); ctx.moveTo(7, 3.5); ctx.lineTo(9, 1.5); ctx.lineTo(10, 3.5); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── RoboSnake head ──
function drawSnakeHead(ctx, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  ctx.lineWidth = 1.2; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';
  // Head
  ctx.fillStyle = '#44aa44';
  ctx.beginPath(); ctx.roundRect(2, 3, 12, 10, 3); ctx.fill(); ctx.stroke();
  // Eyes
  ctx.fillStyle = '#ff3333';
  ctx.beginPath(); ctx.arc(5, 7, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, 7, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff8888';
  ctx.beginPath(); ctx.arc(5.3, 6.7, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11.3, 6.7, 0.4, 0, Math.PI * 2); ctx.fill();
  // Fangs
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.moveTo(4, 12); ctx.lineTo(5, 14); ctx.lineTo(6, 12); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, 12); ctx.lineTo(11, 14); ctx.lineTo(12, 12); ctx.fill();
  // Antenna
  ctx.strokeStyle = '#338833'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, 3); ctx.lineTo(8, 0); ctx.stroke();
  ctx.fillStyle = '#ff3333';
  ctx.beginPath(); ctx.arc(8, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── RoboSnake body segment ──
function drawSnakeSegment(ctx, flipX) {
  ctx.save();
  if (flipX) { ctx.scale(-1, 1); ctx.translate(-16, 0); }
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK;
  ctx.fillStyle = '#338833';
  ctx.beginPath(); ctx.ellipse(8, 8, 5, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Belly
  ctx.fillStyle = '#88cc88';
  ctx.beginPath(); ctx.ellipse(8, 9, 3, 2, 0, 0, Math.PI); ctx.fill();
  // Rivets
  ctx.fillStyle = '#aabbaa';
  ctx.beginPath(); ctx.arc(5, 6, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, 6, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── Item draw functions ──
function drawCarrot(ctx) {
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';
  // Green top
  ctx.fillStyle = CARROT_GREEN;
  ctx.beginPath();
  ctx.moveTo(6, 4); ctx.quadraticCurveTo(4, 1, 5, 0);
  ctx.moveTo(8, 4); ctx.quadraticCurveTo(8, 0, 8, 0);
  ctx.moveTo(10, 4); ctx.quadraticCurveTo(12, 1, 11, 0);
  ctx.lineWidth = 1.5; ctx.strokeStyle = CARROT_GREEN; ctx.stroke();
  // Body
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK;
  ctx.fillStyle = CARROT_ORANGE;
  ctx.beginPath();
  ctx.moveTo(5, 4); ctx.lineTo(11, 4); ctx.lineTo(8, 14); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Highlight
  ctx.strokeStyle = '#ffc060'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(7.5, 6); ctx.lineTo(8, 10); ctx.stroke();
}

function drawHeart(ctx) {
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';
  ctx.fillStyle = HEART_RED;
  ctx.beginPath();
  ctx.moveTo(8, 12);
  ctx.bezierCurveTo(8, 10, 3, 6, 3, 4);
  ctx.bezierCurveTo(3, 1, 8, 1, 8, 4);
  ctx.bezierCurveTo(8, 1, 13, 1, 13, 4);
  ctx.bezierCurveTo(13, 6, 8, 10, 8, 12);
  ctx.fill(); ctx.stroke();
  // Shine
  ctx.fillStyle = '#ff9999';
  ctx.beginPath(); ctx.arc(5.5, 4, 1, 0, Math.PI * 2); ctx.fill();
}

function drawStar(ctx) {
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';
  ctx.fillStyle = STAR_YELLOW;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180;
    const a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
    ctx.lineTo(8 + Math.cos(a) * 5, 7 + Math.sin(a) * 5);
    ctx.lineTo(8 + Math.cos(a2) * 2.2, 7 + Math.sin(a2) * 2.2);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = STAR_BRIGHT;
  ctx.beginPath(); ctx.arc(7, 5.5, 1.2, 0, Math.PI * 2); ctx.fill();
}

function drawSpeed(ctx) {
  ctx.lineWidth = 1; ctx.strokeStyle = BLACK; ctx.lineJoin = 'round';
  ctx.fillStyle = SPRING_GREEN;
  // Boot shape
  ctx.beginPath();
  ctx.moveTo(5, 3); ctx.lineTo(7, 3); ctx.lineTo(7, 8); ctx.lineTo(12, 8);
  ctx.lineTo(12, 12); ctx.lineTo(3, 12); ctx.lineTo(3, 8); ctx.lineTo(5, 8);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Sole
  ctx.fillStyle = '#0e8888';
  ctx.fillRect(3, 11, 9, 1.5);
  ctx.strokeRect(3, 11, 9, 1.5);
  // Speed lines
  ctx.strokeStyle = '#88ffff'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(2, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(2.5, 9); ctx.stroke();
}

// ── Sprite cache ──
const spriteCache = new Map();

export class SpriteRenderer {
  constructor() {
    // Pixel-array sprites (tiles)
    this.tileSprites = {
      tileGrass: TILE_GRASS,
      tileDirt: TILE_DIRT,
      tileStone: TILE_STONE,
      tileBrick: TILE_BRICK,
      tilePlatform: TILE_PLATFORM,
      tileWater: TILE_WATER,
      tileQuicksand: TILE_QUICKSAND,
      tileSand: TILE_SAND,
      tileCastleWall: TILE_CASTLE_WALL,
      tileCastleFloor: TILE_CASTLE_FLOOR,
      tileIce: TILE_ICE,
      checkpoint: SPRITE_CHECKPOINT,
    };

    // Procedural character sprites (drawn with Canvas 2D)
    this.proceduralSprites = {
      rabbitIdle: { frames: 1, draw: (ctx, frame, flipX) => drawRabbitIdle(ctx, flipX) },
      rabbitRun: { frames: 2, draw: (ctx, frame, flipX) => drawRabbitRun(ctx, frame, flipX) },
      rabbitJump: { frames: 1, draw: (ctx, frame, flipX) => drawRabbitJump(ctx, flipX) },
      fox: { frames: 1, draw: (ctx, frame, flipX) => drawRobot(ctx, flipX) },
      bird: { frames: 2, draw: (ctx, frame, flipX) => drawFlyRobot(ctx, frame, flipX) },
      kingFox: { frames: 1, draw: (ctx, frame, flipX, scale) => drawKingViking(ctx, flipX, scale) },
      carrot: { frames: 1, draw: (ctx) => drawCarrot(ctx) },
      heart: { frames: 1, draw: (ctx) => drawHeart(ctx) },
      star: { frames: 1, draw: (ctx) => drawStar(ctx) },
      speed: { frames: 1, draw: (ctx) => drawSpeed(ctx) },
      fish: { frames: 2, draw: (ctx, frame, flipX) => drawFish(ctx, frame, flipX) },
      snakeHead: { frames: 1, draw: (ctx, frame, flipX) => drawSnakeHead(ctx, flipX) },
      snakeSegment: { frames: 1, draw: (ctx, frame, flipX) => drawSnakeSegment(ctx, flipX) },
    };

    // Backwards-compat: unified sprites map for getSize
    this.sprites = {
      ...Object.fromEntries(Object.entries(this.tileSprites)),
    };
  }

  _renderTileToCanvas(spriteData, scale = 1, flipX = false) {
    const key = 'tile_' + JSON.stringify(spriteData) + scale + flipX;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const h = spriteData.length, w = spriteData[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale; canvas.height = h * scale;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const color = spriteData[y][x];
        if (color) {
          ctx.fillStyle = color;
          const drawX = flipX ? (w - 1 - x) * scale : x * scale;
          ctx.fillRect(drawX, y * scale, scale, scale);
        }
      }

    spriteCache.set(key, canvas);
    return canvas;
  }

  _renderProceduralToCanvas(name, frame, flipX, scale) {
    const key = `proc_${name}_${frame}_${flipX}_${scale}`;
    if (spriteCache.has(key)) return spriteCache.get(key);

    const spec = this.proceduralSprites[name];
    if (!spec) return null;

    const size = name === 'kingFox' ? 16 * scale : 16;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    spec.draw(ctx, frame, flipX, scale);

    spriteCache.set(key, canvas);
    return canvas;
  }

  draw(ctx, name, x, y, frame = 0, flipX = false, scale = 1) {
    // Procedural sprite?
    if (this.proceduralSprites[name]) {
      const canvas = this._renderProceduralToCanvas(name, frame, flipX, scale);
      if (canvas) ctx.drawImage(canvas, Math.floor(x), Math.floor(y));
      return;
    }

    // Tile/pixel sprite
    const spriteData = this.tileSprites[name];
    if (!spriteData) return;
    const canvas = this._renderTileToCanvas(spriteData, scale, flipX);
    ctx.drawImage(canvas, Math.floor(x), Math.floor(y));
  }

  getSize(name, scale = 1) {
    if (this.proceduralSprites[name]) {
      const s = name === 'kingFox' ? 16 * scale : 16;
      return { w: s, h: s };
    }
    const spriteData = this.tileSprites[name];
    if (!spriteData) return { w: 16, h: 16 };
    return { w: spriteData[0].length * scale, h: spriteData.length * scale };
  }
}
