// Game — state management, scene transitions, collision handling

import { Player } from './player.js';
import { Camera } from './camera.js';
import { Level } from './level.js';
import { HUD } from './hud.js';
import { SpriteRenderer } from './sprites.js';
import { Audio } from './audio.js';
import { createEnemies, KingFox } from './enemies.js';
import { createItems, createCheckpoints } from './items.js';
import { aabbOverlap, TILE_SIZE } from './physics.js';

// Native NES-style resolution
export const VIEW_WIDTH = 256;
export const VIEW_HEIGHT = 224;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = VIEW_WIDTH;
    canvas.height = VIEW_HEIGHT;

    this.spriteRenderer = new SpriteRenderer();
    this.audio = new Audio();
    this.camera = new Camera(VIEW_WIDTH, VIEW_HEIGHT);
    this.hud = new HUD();

    // Game state
    this.state = 'title'; // title, playing, paused, gameOver, levelComplete, bossIntro
    this.stateTimer = 0;
    this.transitionTimer = 0;

    // Level data
    this.player = null;
    this.level = null;
    this.enemies = [];
    this.items = [];
    this.checkpoints = [];
    this.boss = null;
    this.bossActivated = false;

    // Title screen animation
    this.titleTimer = 0;

    // Level data will be loaded
    this.levelData = null;
  }

  async init() {
    // Load level 1
    const resp = await fetch('levels/level1.json');
    this.levelData = await resp.json();
    this.state = 'title';
  }

  startLevel() {
    this.level = new Level(this.levelData);
    this.player = new Player(this.levelData.playerStart.x, this.levelData.playerStart.y);
    this.enemies = createEnemies(this.levelData.enemies);
    this.items = createItems(this.levelData.items);
    this.checkpoints = createCheckpoints(this.levelData.checkpoints);
    this.bossActivated = false;

    // Create boss
    if (this.levelData.bossArea) {
      this.boss = new KingFox(this.levelData.bossArea.bossX, this.levelData.bossArea.bossY);
    }

    // Reset camera
    this.camera.x = this.player.x - VIEW_WIDTH / 2;
    this.camera.y = this.player.y - VIEW_HEIGHT / 2;

    this.state = 'playing';
    this.stateTimer = 0;
  }

  update(input) {
    this.stateTimer++;

    switch (this.state) {
      case 'title':
        this._updateTitle(input);
        break;
      case 'playing':
        this._updatePlaying(input);
        break;
      case 'paused':
        this._updatePaused(input);
        break;
      case 'gameOver':
        this._updateGameOver(input);
        break;
      case 'levelComplete':
        this._updateLevelComplete(input);
        break;
      case 'bossIntro':
        this._updateBossIntro(input);
        break;
    }

    if (this.transitionTimer > 0) this.transitionTimer--;
  }

  _updateTitle(input) {
    this.titleTimer++;
    if (input.start || input.jump) {
      this.audio.init();
      this.audio.menuSelect();
      this.startLevel();
      this.transitionTimer = 20;
    }
  }

  _updatePlaying(input) {
    if (input.pause) {
      this.state = 'paused';
      this.audio.pause();
      return;
    }

    // Update player
    this.player.update(input, this.level);

    // Check death
    if (this.player.dead) {
      this.audio.die();
      if (this.player.lives <= 0) {
        this.state = 'gameOver';
        this.stateTimer = 0;
      } else {
        // Respawn after delay
        setTimeout(() => {
          if (this.state === 'playing') {
            this.player.respawn();
            this.camera.x = this.player.x - VIEW_WIDTH / 2;
            this.camera.y = this.player.y - VIEW_HEIGHT / 2;
            // Reset enemies
            this.enemies = createEnemies(this.levelData.enemies);
            if (this.boss && !this.boss.alive) {
              this.boss = new KingFox(this.levelData.bossArea.bossX, this.levelData.bossArea.bossY);
            }
            this.bossActivated = false;
          }
        }, 1500);
      }
      return;
    }

    // Update level
    this.level.update();

    // Update enemies
    this.enemies = this.enemies.filter(e => e.update(this.level));

    // Update boss
    if (this.boss && this.boss.active) {
      this.boss.update(this.level, this.player);
    }

    // Update items
    this.items = this.items.filter(i => i.update());

    // Update checkpoints
    this.checkpoints.forEach(cp => cp.update());

    // Update HUD
    this.hud.update();

    // Check collisions
    this._checkCollisions();

    // Check boss area trigger
    this._checkBossTrigger();

    // Update camera
    this.camera.follow(this.player, this.level.width, this.level.height);
  }

  _checkCollisions() {
    const playerHitbox = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };

    // Enemy collisions
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const enemyHitbox = enemy.getHitbox();
      if (aabbOverlap(playerHitbox, enemyHitbox)) {
        // Check if stomping (player falling on top)
        if (this.player.vy > 0 && this.player.y + this.player.h - 4 < enemy.y + enemy.h / 2) {
          enemy.stomp();
          this.player.vy = -5; // Bounce
          this.player.score += 200;
          this.hud.addScorePopup(enemy.x, enemy.y - 8, '+200', '#fbbf24');
          this.audio.stomp();
        } else if (!this.player.hasInvincibilityStar) {
          this.player.hit();
          if (this.player.invincibleTimer === 90) { // just got hit
            this.audio.hit();
            this.camera.shake(3, 8);
          }
        } else {
          // Star power kills enemies on touch
          enemy.stomp();
          this.player.score += 200;
          this.hud.addScorePopup(enemy.x, enemy.y - 8, '+200', '#fbbf24');
          this.audio.stomp();
        }
      }
    }

    // Boss collision
    if (this.boss && this.boss.alive && this.boss.active) {
      const bossHitbox = this.boss.getHitbox();
      if (aabbOverlap(playerHitbox, bossHitbox)) {
        if (this.player.vy > 0 && this.player.y + this.player.h - 4 < this.boss.y + this.boss.h / 2) {
          // Stomp boss
          const defeated = this.boss.hit();
          this.player.vy = -6;
          this.player.score += 500;
          this.hud.addScorePopup(this.boss.x, this.boss.y - 12, '+500', '#fbbf24');
          this.audio.bossHit();
          this.camera.shake(5, 12);

          if (defeated) {
            this.audio.bossDefeat();
            this.player.score += 5000;
            setTimeout(() => {
              this.state = 'levelComplete';
              this.stateTimer = 0;
              this.audio.levelComplete();
            }, 2000);
          }
        } else if (this.boss.state !== 'stunned') {
          this.player.hit();
          if (this.player.invincibleTimer === 90) {
            this.audio.hit();
            this.camera.shake(4, 10);
          }
        }
      }
    }

    // Item collisions
    for (const item of this.items) {
      if (item.collected) continue;
      if (aabbOverlap(playerHitbox, item.getHitbox())) {
        item.collect(this.player);
        switch (item.type) {
          case 'carrot': this.audio.collectCarrot(); break;
          case 'heart': this.audio.collectHeart(); break;
          case 'star':
          case 'speed':
            this.audio.collectPowerUp();
            break;
        }
        const text = item.type === 'carrot' ? '+100' : item.type.toUpperCase();
        const color = { carrot: '#f97316', heart: '#ef4444', star: '#fbbf24', speed: '#22d3ee' }[item.type];
        this.hud.addScorePopup(item.x, item.y - 8, text, color);
      }
    }

    // Checkpoint collisions
    for (const cp of this.checkpoints) {
      if (cp.activated) continue;
      if (aabbOverlap(playerHitbox, cp.getHitbox())) {
        cp.activate(this.player);
        this.audio.checkpoint();
      }
    }
  }

  _checkBossTrigger() {
    if (!this.boss || this.bossActivated) return;
    const ba = this.levelData.bossArea;
    if (this.player.x >= ba.triggerX) {
      this.bossActivated = true;
      this.state = 'bossIntro';
      this.stateTimer = 0;
      this.boss.activate(ba.left, ba.right);
    }
  }

  _updatePaused(input) {
    if (input.pause || input.start) {
      this.state = 'playing';
      this.audio.menuSelect();
    }
  }

  _updateGameOver(input) {
    if (this.stateTimer > 60 && (input.start || input.jump)) {
      this.audio.menuSelect();
      this.startLevel();
    }
  }

  _updateLevelComplete(input) {
    if (this.stateTimer > 120 && (input.start || input.jump)) {
      this.state = 'title';
      this.stateTimer = 0;
    }
  }

  _updateBossIntro(input) {
    // Camera pan to boss, then back to gameplay
    if (this.stateTimer < 60) {
      // Pan toward boss
      const bx = this.boss.x - VIEW_WIDTH / 2;
      this.camera.x += (bx - this.camera.x) * 0.05;
    } else if (this.stateTimer >= 90) {
      this.state = 'playing';
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    switch (this.state) {
      case 'title':
        this._drawTitle(ctx);
        break;
      case 'playing':
      case 'paused':
      case 'bossIntro':
        this._drawGame(ctx);
        if (this.state === 'paused') this._drawPause(ctx);
        if (this.state === 'bossIntro') this._drawBossIntro(ctx);
        break;
      case 'gameOver':
        this._drawGame(ctx);
        this._drawGameOver(ctx);
        break;
      case 'levelComplete':
        this._drawGame(ctx);
        this._drawLevelComplete(ctx);
        break;
    }

    // Transition fade
    if (this.transitionTimer > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.transitionTimer / 20})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
  }

  _drawTitle(ctx) {
    // Bright, cheerful Press Start! background
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, '#4488ff');
    gradient.addColorStop(0.5, '#66aaff');
    gradient.addColorStop(0.8, '#88ccff');
    gradient.addColorStop(1, '#5ddb5d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Clouds
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 53 + this.titleTimer * 0.3) % (VIEW_WIDTH + 40)) - 20;
      const cy = 15 + (i * 23) % 50;
      const cw = 20 + (i * 7) % 15;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(Math.floor(cx), Math.floor(cy), cw, 6);
      ctx.fillRect(Math.floor(cx + 3), Math.floor(cy - 3), cw - 6, 4);
    }
    ctx.globalAlpha = 1;

    // Green ground
    ctx.fillStyle = '#5ddb5d';
    ctx.fillRect(0, VIEW_HEIGHT - 40, VIEW_WIDTH, 40);
    ctx.fillStyle = '#3dbd3d';
    ctx.fillRect(0, VIEW_HEIGHT - 40, VIEW_WIDTH, 3);

    // "PRESS START!" header
    ctx.fillStyle = '#ff3b3b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS START!', VIEW_WIDTH / 2, 50);

    // Title
    const bounce = Math.sin(this.titleTimer * 0.08) * 3;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('SUPER', VIEW_WIDTH / 2, 72 + bounce);
    ctx.fillStyle = '#ffe347';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('RABBIT BOY', VIEW_WIDTH / 2, 92 + bounce);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText('vs. King Viking\'s Robot Army!', VIEW_WIDTH / 2, 110);

    // Rabbit sprite preview — bouncing on the grass
    const rabbitY = VIEW_HEIGHT - 56 + Math.abs(Math.sin(this.titleTimer * 0.08)) * -10;
    this.spriteRenderer.draw(ctx, 'rabbitIdle', VIEW_WIDTH / 2 - 8, rabbitY, 0, false);

    // Press start prompt
    if (Math.floor(this.titleTimer / 30) % 2 === 0) {
      ctx.fillStyle = '#222034';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('PRESS ENTER OR TAP TO START', VIEW_WIDTH / 2, 135);
    }

    // Controls info
    ctx.fillStyle = '#336699';
    ctx.font = '6px monospace';
    ctx.fillText('ARROWS/WASD: MOVE    SPACE: JUMP', VIEW_WIDTH / 2, 200);
    ctx.fillText('SHIFT: DASH    P/ESC: PAUSE', VIEW_WIDTH / 2, 210);

    ctx.textAlign = 'left';
  }

  _drawGame(ctx) {
    // Background (screen space)
    this.level.drawBackground(ctx, this.camera);

    // Camera transform
    this.camera.apply(ctx);

    // Tiles
    this.level.drawTiles(ctx, this.camera, this.spriteRenderer);

    // Checkpoints
    this.checkpoints.forEach(cp => cp.draw(ctx, this.spriteRenderer, this.camera));

    // Items
    this.items.forEach(item => item.draw(ctx, this.spriteRenderer, this.camera));

    // Enemies
    this.enemies.forEach(e => e.draw(ctx, this.spriteRenderer, this.camera));

    // Boss
    if (this.boss) this.boss.draw(ctx, this.spriteRenderer, this.camera);

    // Player
    this.player.draw(ctx, this.spriteRenderer);

    // HUD world-space elements (score popups)
    this.hud.draw(ctx, this.player, this.camera);

    this.camera.restore(ctx);

    // HUD overlay (screen space)
    this.hud.drawOverlay(ctx, this.player, VIEW_WIDTH);
  }

  _drawPause(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 10);

    ctx.font = '8px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press P or ESC to resume', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 15);
    ctx.textAlign = 'left';
  }

  _drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 20);

    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(`FINAL SCORE: ${this.player.score}`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 5);

    if (this.stateTimer > 60 && Math.floor(this.stateTimer / 20) % 2 === 0) {
      ctx.fillText('PRESS ENTER TO RETRY', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 25);
    }
    ctx.textAlign = 'left';
  }

  _drawLevelComplete(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 30);

    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(`SCORE: ${this.player.score}`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
    ctx.fillText(`CARROTS: ${this.player.carrots}`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 15);

    if (this.stateTimer > 120 && Math.floor(this.stateTimer / 20) % 2 === 0) {
      ctx.fillText('PRESS ENTER TO CONTINUE', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 40);
    }
    ctx.textAlign = 'left';
  }

  _drawBossIntro(ctx) {
    // "WARNING" text
    if (this.stateTimer < 80) {
      const alpha = Math.sin(this.stateTimer * 0.15) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(102, 68, 204, ${alpha})`;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WARNING!', VIEW_WIDTH / 2, 30);
      ctx.font = '8px monospace';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillText('KING VIKING APPROACHES!', VIEW_WIDTH / 2, 45);
      ctx.textAlign = 'left';
    }
  }
}
