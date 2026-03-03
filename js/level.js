// Level — tile map loader and renderer with parallax background

import { TILE_SIZE } from './physics.js';

// Tile type constants
export const TILES = {
  EMPTY: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  BRICK: 4,    // breakable
  PLATFORM: 5, // one-way
};

const TILE_SPRITE_MAP = {
  [TILES.GRASS]: 'tileGrass',
  [TILES.DIRT]: 'tileDirt',
  [TILES.STONE]: 'tileStone',
  [TILES.BRICK]: 'tileBrick',
  [TILES.PLATFORM]: 'tilePlatform',
};

export class Level {
  constructor(data) {
    this.width = data.width;
    this.height = data.height;
    this.tiles = data.tiles.map(row => [...row]); // deep copy
    this.originalTiles = data.tiles;
    this.playerStart = data.playerStart;
    this.enemies = data.enemies || [];
    this.items = data.items || [];
    this.checkpoints = data.checkpoints || [];
    this.bossArea = data.bossArea || null;
    this.name = data.name || 'Level';

    // Parallax layers (colors for sky gradient)
    this.bgColors = data.bgColors || ['#1a1a2e', '#16213e', '#0f3460', '#533483'];

    // Tile break effects
    this.breakParticles = [];

    // Pre-render tile cache
    this._tileCanvasCache = {};
  }

  getTile(col, row) {
    if (col < 0 || row < 0 || col >= this.width || row >= this.height) return 0;
    return this.tiles[row][col];
  }

  setTile(col, row, value) {
    if (col < 0 || row < 0 || col >= this.width || row >= this.height) return;
    this.tiles[row][col] = value;
  }

  breakTile(col, row) {
    const tile = this.getTile(col, row);
    if (tile !== TILES.BRICK) return;
    this.setTile(col, row, TILES.EMPTY);

    // Spawn break particles
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;
    for (let i = 0; i < 8; i++) {
      this.breakParticles.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 1,
        life: 20 + Math.random() * 15,
        color: i % 2 === 0 ? '#dc2626' : '#991b1b',
        size: 2 + Math.random() * 2,
      });
    }
  }

  update() {
    // Update break particles
    this.breakParticles = this.breakParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity on particles
      p.life--;
      return p.life > 0;
    });
  }

  drawBackground(ctx, camera) {
    const { viewWidth, viewHeight } = camera;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, this.bgColors[0]);
    gradient.addColorStop(0.3, this.bgColors[1]);
    gradient.addColorStop(0.6, this.bgColors[2]);
    gradient.addColorStop(1, this.bgColors[3]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Bright clouds
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 97 + camera.x * 0.05) % (viewWidth + 60)) - 30;
      const cy = 20 + (i * 29) % 50;
      const cw = 20 + (i * 11) % 20;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(Math.floor(cx), Math.floor(cy), cw, 6);
      ctx.fillRect(Math.floor(cx + 4), Math.floor(cy - 3), cw - 8, 4);
    }
    ctx.globalAlpha = 1;

    // Parallax hills (far layer) — bright green
    this._drawMountains(ctx, camera, 0.1, viewHeight * 0.55, '#44bb44', 50);
    // Parallax hills (mid layer) — medium green
    this._drawMountains(ctx, camera, 0.3, viewHeight * 0.68, '#33aa33', 35);
    // Parallax trees (near layer) — cheerful green
    this._drawTrees(ctx, camera, 0.5, viewHeight * 0.78, '#228822');
  }

  _drawMountains(ctx, camera, parallax, baseY, color, height) {
    const offset = -camera.x * parallax;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, camera.viewHeight);

    for (let x = -100; x < camera.viewWidth + 100; x += 10) {
      const worldX = x - offset;
      const y = baseY + Math.sin(worldX * 0.008) * height + Math.sin(worldX * 0.015) * (height * 0.5);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(camera.viewWidth, camera.viewHeight);
    ctx.closePath();
    ctx.fill();
  }

  _drawTrees(ctx, camera, parallax, baseY, color) {
    const offset = -camera.x * parallax;
    ctx.fillStyle = color;

    for (let x = -50; x < camera.viewWidth + 50; x += 30) {
      const worldX = x - offset;
      const treeH = 15 + Math.sin(worldX * 0.1) * 8;
      const ty = baseY + Math.sin(worldX * 0.02) * 5;

      // Tree triangle
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x - 8, ty + treeH);
      ctx.lineTo(x + 8, ty + treeH);
      ctx.closePath();
      ctx.fill();

      // Trunk
      ctx.fillRect(x - 1, ty + treeH, 3, 5);
    }

    // Ground strip
    ctx.fillRect(0, baseY + 10, camera.viewWidth, camera.viewHeight);
  }

  drawTiles(ctx, camera, spriteRenderer) {
    // Only draw tiles visible on screen
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const endCol = Math.min(this.width, Math.ceil((camera.x + camera.viewWidth) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endRow = Math.min(this.height, Math.ceil((camera.y + camera.viewHeight) / TILE_SIZE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.tiles[row][col];
        if (tile === TILES.EMPTY) continue;

        const spriteName = TILE_SPRITE_MAP[tile];
        if (spriteName) {
          spriteRenderer.draw(ctx, spriteName, col * TILE_SIZE, row * TILE_SIZE);
        }
      }
    }

    // Draw break particles
    for (const p of this.breakParticles) {
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
