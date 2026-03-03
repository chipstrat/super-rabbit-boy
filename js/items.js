// Items — collectibles and power-ups

import { aabbOverlap } from './physics.js';

export class Item {
  constructor(type, x, y) {
    this.type = type; // 'carrot', 'heart', 'star', 'speed'
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 12;
    this.collected = false;
    this.bobTimer = Math.random() * Math.PI * 2; // random start phase for bobbing
    this.baseY = y;
    this.sparkleTimer = 0;
    this.collectParticles = [];
  }

  update() {
    if (this.collected) {
      this.collectParticles = this.collectParticles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.05;
        p.life--;
        return p.life > 0;
      });
      return this.collectParticles.length > 0;
    }

    // Bob up and down
    this.bobTimer += 0.06;
    this.y = this.baseY + Math.sin(this.bobTimer) * 2;

    // Sparkle
    this.sparkleTimer++;

    return true;
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;

    // Apply effect
    switch (this.type) {
      case 'carrot':
        player.score += 100;
        player.carrots++;
        // Extra life every 50 carrots
        if (player.carrots % 50 === 0) {
          player.lives++;
        }
        break;
      case 'heart':
        player.health = Math.min(player.health + 1, player.maxHealth);
        break;
      case 'star':
        player.hasInvincibilityStar = true;
        player.starTimer = 600; // 10 seconds
        break;
      case 'speed':
        player.hasSpeedBoost = true;
        player.speedBoostTimer = 480; // 8 seconds
        break;
    }

    // Spawn collect particles
    const colors = {
      carrot: ['#f97316', '#fdba74'],
      heart: ['#ef4444', '#fca5a5'],
      star: ['#fbbf24', '#fef3c7'],
      speed: ['#22d3ee', '#a5f3fc'],
    };
    const cols = colors[this.type] || ['#fff', '#ddd'];
    for (let i = 0; i < 8; i++) {
      this.collectParticles.push({
        x: this.x + this.w / 2,
        y: this.y + this.h / 2,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 1,
        life: 15 + Math.random() * 10,
        color: cols[i % 2],
      });
    }
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx, spriteRenderer, camera) {
    // Draw collect particles
    for (const p of this.collectParticles) {
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;

    if (this.collected) return;
    if (!camera.isVisible(this.x, this.y, 16, 16)) return;

    // Sparkle effect
    if (this.sparkleTimer % 30 < 5) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(Math.floor(this.x + 2), Math.floor(this.y + 2), 2, 2);
      ctx.globalAlpha = 1;
    }

    const spriteMap = {
      carrot: 'carrot',
      heart: 'heart',
      star: 'star',
      speed: 'speed',
    };

    spriteRenderer.draw(
      ctx, spriteMap[this.type],
      Math.floor(this.x - 2),
      Math.floor(this.y - 2),
      0, false
    );
  }
}

// Checkpoint flag
export class Checkpoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 16;
    this.activated = false;
    this.animTimer = 0;
  }

  update() {
    if (this.activated) {
      this.animTimer++;
    }
  }

  activate(player) {
    if (this.activated) return;
    this.activated = true;
    player.setCheckpoint(this.x, this.y);
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw(ctx, spriteRenderer, camera) {
    if (!camera.isVisible(this.x, this.y, 16, 16)) return;

    spriteRenderer.draw(ctx, 'checkpoint', Math.floor(this.x), Math.floor(this.y));

    // Activated glow
    if (this.activated) {
      ctx.globalAlpha = 0.3 + Math.sin(this.animTimer * 0.1) * 0.2;
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 16, 16);
      ctx.globalAlpha = 1;
    }
  }
}

// Factory
export function createItems(itemData) {
  return itemData.map(i => new Item(i.type, i.x, i.y));
}

export function createCheckpoints(cpData) {
  return cpData.map(cp => new Checkpoint(cp.x, cp.y));
}
