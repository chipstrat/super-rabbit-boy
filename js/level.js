// Level — tile map loader and renderer with per-level backgrounds

import { TILE_SIZE } from './physics.js';

// Tile type constants
export const TILES = {
  EMPTY: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  BRICK: 4,        // breakable
  PLATFORM: 5,     // one-way
  WATER: 6,        // swim-through
  QUICKSAND: 7,    // slow sink
  SAND: 8,         // solid desert
  CASTLE_WALL: 9,  // solid castle
  CASTLE_FLOOR: 10,// solid castle floor
  ICE: 11,         // solid, slippery
};

const TILE_SPRITE_MAP = {
  [TILES.GRASS]: 'tileGrass',
  [TILES.DIRT]: 'tileDirt',
  [TILES.STONE]: 'tileStone',
  [TILES.BRICK]: 'tileBrick',
  [TILES.PLATFORM]: 'tilePlatform',
  [TILES.WATER]: 'tileWater',
  [TILES.QUICKSAND]: 'tileQuicksand',
  [TILES.SAND]: 'tileSand',
  [TILES.CASTLE_WALL]: 'tileCastleWall',
  [TILES.CASTLE_FLOOR]: 'tileCastleFloor',
  [TILES.ICE]: 'tileIce',
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
    this.bgType = data.bgType || 'village';

    // Parallax layers (colors for sky gradient)
    this.bgColors = data.bgColors || ['#4488ff', '#66aaff', '#88ccff', '#5ddb5d'];

    // Tile break effects
    this.breakParticles = [];

    // Animation timer for water etc
    this._animTimer = 0;
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
    this._animTimer++;
    this.breakParticles = this.breakParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      return p.life > 0;
    });
  }

  drawBackground(ctx, camera) {
    switch (this.bgType) {
      case 'village': this._drawVillageBackground(ctx, camera); break;
      case 'tower': this._drawTowerBackground(ctx, camera); break;
      case 'underwater': this._drawUnderwaterBackground(ctx, camera); break;
      case 'desert': this._drawDesertBackground(ctx, camera); break;
      case 'castle': this._drawCastleBackground(ctx, camera); break;
      default: this._drawVillageBackground(ctx, camera); break;
    }
  }

  _drawVillageBackground(ctx, camera) {
    const { viewWidth, viewHeight } = camera;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, this.bgColors[0]);
    gradient.addColorStop(0.3, this.bgColors[1]);
    gradient.addColorStop(0.6, this.bgColors[2]);
    gradient.addColorStop(1, this.bgColors[3]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Clouds
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

    // Hills and trees
    this._drawMountains(ctx, camera, 0.1, viewHeight * 0.55, '#44bb44', 50);
    this._drawMountains(ctx, camera, 0.3, viewHeight * 0.68, '#33aa33', 35);
    this._drawTrees(ctx, camera, 0.5, viewHeight * 0.78, '#228822');
  }

  _drawTowerBackground(ctx, camera) {
    const { viewWidth, viewHeight } = camera;
    const levelH = this.height * TILE_SIZE;
    const progress = Math.min(1, camera.y / Math.max(1, levelH - viewHeight));

    // Sky gradient: blue at bottom, dark purple/stars at top
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    const r1 = Math.floor(20 + progress * 48);
    const g1 = Math.floor(10 + progress * 80);
    const b1 = Math.floor(60 + progress * 140);
    gradient.addColorStop(0, `rgb(${r1},${g1},${b1})`);
    gradient.addColorStop(1, `rgb(${r1+30},${g1+40},${b1+40})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Stars (visible when high up)
    if (progress > 0.3) {
      ctx.fillStyle = '#ffffff';
      const starAlpha = (progress - 0.3) * 1.4;
      for (let i = 0; i < 30; i++) {
        const sx = (i * 67 + 13) % viewWidth;
        const sy = (i * 43 + 7) % viewHeight;
        ctx.globalAlpha = starAlpha * (0.3 + Math.sin(this._animTimer * 0.05 + i) * 0.3);
        ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    // Clouds at various depths
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 80 + camera.x * 0.03 + camera.y * 0.02) % (viewWidth + 50)) - 25;
      const cy = 30 + (i * 35) % (viewHeight - 40);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(Math.floor(cx), Math.floor(cy), 18, 5);
      ctx.fillRect(Math.floor(cx + 3), Math.floor(cy - 2), 12, 4);
    }
    ctx.globalAlpha = 1;
  }

  _drawUnderwaterBackground(ctx, camera) {
    const { viewWidth, viewHeight } = camera;

    // Deep blue gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, '#1a5588');
    gradient.addColorStop(0.3, '#0e4477');
    gradient.addColorStop(1, '#082244');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Light rays from above
    for (let i = 0; i < 5; i++) {
      const rx = ((i * 63 + camera.x * 0.02) % (viewWidth + 40)) - 20;
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#88ccff';
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 30, viewHeight);
      ctx.lineTo(rx + 15, viewHeight);
      ctx.lineTo(rx - 5, 0);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Bubbles (parallax)
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 37 + camera.x * 0.05) % (viewWidth + 20)) - 10;
      const by = ((this._animTimer * 0.3 + i * 40) % (viewHeight + 30)) - 15;
      const br = 1 + (i % 3);
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#88ccff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(bx, viewHeight - by, br, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Kelp silhouettes
    ctx.fillStyle = '#0a3322';
    for (let i = 0; i < 6; i++) {
      const kx = ((i * 55 + camera.x * 0.1) % (viewWidth + 20)) - 10;
      ctx.globalAlpha = 0.3;
      for (let s = 0; s < 4; s++) {
        const ky = viewHeight - s * 12 - 10;
        const kw = 3 + Math.sin(this._animTimer * 0.03 + i + s) * 2;
        ctx.fillRect(Math.floor(kx + kw), Math.floor(ky), 3, 12);
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawDesertBackground(ctx, camera) {
    const { viewWidth, viewHeight } = camera;

    // Orange/tan sky
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, '#ff9944');
    gradient.addColorStop(0.4, '#ffbb66');
    gradient.addColorStop(0.7, '#ffe088');
    gradient.addColorStop(1, '#e8d088');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Sun
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(viewWidth - 40, 30, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Distant pyramids
    ctx.fillStyle = '#d4a050';
    const pOff = camera.x * 0.05;
    ctx.beginPath();
    ctx.moveTo(60 - pOff % 300, viewHeight * 0.7);
    ctx.lineTo(80 - pOff % 300, viewHeight * 0.5);
    ctx.lineTo(100 - pOff % 300, viewHeight * 0.7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(150 - pOff % 300, viewHeight * 0.7);
    ctx.lineTo(165 - pOff % 300, viewHeight * 0.55);
    ctx.lineTo(180 - pOff % 300, viewHeight * 0.7);
    ctx.fill();

    // Sand dunes
    this._drawMountains(ctx, camera, 0.15, viewHeight * 0.7, '#d4a060', 25);
    this._drawMountains(ctx, camera, 0.3, viewHeight * 0.8, '#c89050', 15);
  }

  _drawCastleBackground(ctx, camera) {
    const { viewWidth, viewHeight } = camera;

    // Dark purple/black
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, '#1a1028');
    gradient.addColorStop(0.5, '#221538');
    gradient.addColorStop(1, '#2a1a40');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Stone wall parallax pattern
    ctx.fillStyle = '#2a2040';
    const wallOff = camera.x * 0.1 + camera.y * 0.05;
    for (let y = 0; y < viewHeight; y += 16) {
      for (let x = -16; x < viewWidth + 16; x += 32) {
        const wx = Math.floor(x - wallOff % 32);
        const shift = (Math.floor(y / 16) % 2) * 16;
        ctx.fillRect(wx + shift, y, 30, 14);
      }
    }

    // Torchlight glow
    for (let i = 0; i < 4; i++) {
      const tx = ((i * 73 + camera.x * 0.15) % (viewWidth + 40)) - 20;
      const ty = 60 + (i * 50) % (viewHeight - 80);
      const flicker = 8 + Math.sin(this._animTimer * 0.1 + i * 2) * 3;
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ff8833';
      ctx.beginPath();
      ctx.arc(tx, ty, flicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc(tx, ty, flicker * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x - 8, ty + treeH);
      ctx.lineTo(x + 8, ty + treeH);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x - 1, ty + treeH, 3, 5);
    }
    ctx.fillRect(0, baseY + 10, camera.viewWidth, camera.viewHeight);
  }

  drawTiles(ctx, camera, spriteRenderer) {
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

    // Water overlay: semi-transparent blue + surface waves
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (this.tiles[row][col] === TILES.WATER) {
          ctx.fillStyle = 'rgba(50, 100, 200, 0.15)';
          ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Surface wave if tile above is not water
          if (row > 0 && this.tiles[row - 1][col] !== TILES.WATER) {
            const waveY = row * TILE_SIZE + Math.sin(col * 0.5 + this._animTimer * 0.05) * 2;
            ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
            ctx.fillRect(col * TILE_SIZE, waveY, TILE_SIZE, 3);
          }
        }
      }
    }

    // Break particles
    for (const p of this.breakParticles) {
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
