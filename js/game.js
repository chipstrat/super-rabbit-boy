// Game — state management, scene transitions, collision handling, level progression

import { Player } from './player.js';
import { Camera } from './camera.js';
import { Level } from './level.js';
import { HUD } from './hud.js';
import { SpriteRenderer } from './sprites.js';
import { Audio } from './audio.js';
import { createEnemies, KingFox, RoboSnake, KingViking } from './enemies.js';
import { createItems, createCheckpoints } from './items.js';
import { aabbOverlap, TILE_SIZE } from './physics.js';

export const VIEW_WIDTH = 256;
export const VIEW_HEIGHT = 224;

const LEVEL_FILES = [
  'levels/level1.json',
  'levels/level2.json',
  'levels/level3.json',
  'levels/level4.json',
  'levels/level5.json',
];

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

    // Game state: title, levelIntro, playing, paused, gameOver, levelComplete, bossIntro, gameWin
    this.state = 'title';
    this.stateTimer = 0;
    this.transitionTimer = 0;

    // Level progression
    this.currentLevel = 0;
    this.totalLevels = LEVEL_FILES.length;
    this.allLevelData = [];

    this.player = null;
    this.level = null;
    this.enemies = [];
    this.items = [];
    this.checkpoints = [];
    this.boss = null;
    this.bossActivated = false;
    this.levelData = null;

    this.titleTimer = 0;
  }

  async init() {
    const bust = `?v=${Date.now()}`;
    const promises = LEVEL_FILES.map(f => fetch(f + bust).then(r => r.json()));
    this.allLevelData = await Promise.all(promises);
    this.state = 'title';
  }

  startLevel() {
    this.levelData = this.allLevelData[this.currentLevel];
    this.level = new Level(this.levelData);
    this.player = new Player(this.levelData.playerStart.x, this.levelData.playerStart.y);
    this.enemies = createEnemies(this.levelData.enemies);
    this.items = createItems(this.levelData.items);
    this.checkpoints = createCheckpoints(this.levelData.checkpoints);
    this.bossActivated = false;
    this.boss = null;

    if (this.levelData.bossArea) {
      this.boss = this._createBoss(this.levelData.bossArea);
    }

    this.camera.x = this.player.x - VIEW_WIDTH / 2;
    this.camera.y = this.player.y - VIEW_HEIGHT / 2;

    this.state = 'levelIntro';
    this.stateTimer = 0;
  }

  _createBoss(bossArea) {
    switch (bossArea.type) {
      case 'roboSnake': return new RoboSnake(bossArea.bossX, bossArea.bossY);
      case 'kingViking': return new KingViking(bossArea.bossX, bossArea.bossY);
      default: return new KingFox(bossArea.bossX, bossArea.bossY);
    }
  }

  update(input) {
    this.stateTimer++;
    switch (this.state) {
      case 'title': this._updateTitle(input); break;
      case 'levelIntro': this._updateLevelIntro(input); break;
      case 'playing': this._updatePlaying(input); break;
      case 'paused': this._updatePaused(input); break;
      case 'gameOver': this._updateGameOver(input); break;
      case 'levelComplete': this._updateLevelComplete(input); break;
      case 'bossIntro': this._updateBossIntro(input); break;
      case 'gameWin': this._updateGameWin(input); break;
    }
    if (this.transitionTimer > 0) this.transitionTimer--;
  }

  _updateTitle(input) {
    this.titleTimer++;
    if (input.start || input.jump) {
      this.audio.init();
      this.audio.menuSelect();
      this.currentLevel = 0;
      this.startLevel();
      this.transitionTimer = 20;
    }
  }

  _updateLevelIntro(input) {
    if (this.stateTimer > 120 || (this.stateTimer > 30 && (input.jump || input.start))) {
      this.state = 'playing';
      this.stateTimer = 0;
    }
  }

  _updatePlaying(input) {
    if (input.pause) {
      this.state = 'paused';
      this.audio.pause();
      return;
    }

    this.player.update(input, this.level);

    if (this.player.dead) {
      this.audio.die();
      if (this.player.lives <= 0) {
        this.state = 'gameOver';
        this.stateTimer = 0;
      } else {
        setTimeout(() => {
          if (this.state === 'playing') {
            this.player.respawn();
            this.camera.x = this.player.x - VIEW_WIDTH / 2;
            this.camera.y = this.player.y - VIEW_HEIGHT / 2;
            this.enemies = createEnemies(this.levelData.enemies);
            if (this.boss && !this.boss.alive) {
              this.boss = this._createBoss(this.levelData.bossArea);
            }
            this.bossActivated = false;
          }
        }, 1500);
      }
      return;
    }

    this.level.update();
    this.enemies = this.enemies.filter(e => e.update(this.level));
    if (this.boss && this.boss.active) this.boss.update(this.level, this.player);
    this.items = this.items.filter(i => i.update());
    this.checkpoints.forEach(cp => cp.update());
    this.hud.update();

    this._checkCollisions();
    this._checkBossTrigger();
    this._checkCompleteTrigger();

    this.camera.follow(this.player, this.level.width, this.level.height);
  }

  _checkCollisions() {
    const ph = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };

    // Enemy collisions
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const eh = enemy.getHitbox();
      if (aabbOverlap(ph, eh)) {
        if (this.player.vy > 0 && this.player.y + this.player.h - 4 < enemy.y + enemy.h / 2) {
          enemy.stomp();
          this.player.vy = -5;
          this.player.score += 200;
          this.hud.addScorePopup(enemy.x, enemy.y - 8, '+200', '#fbbf24');
          this.audio.stomp();
        } else if (!this.player.hasInvincibilityStar) {
          this.player.hit();
          if (this.player.invincibleTimer === 90) { this.audio.hit(); this.camera.shake(3, 8); }
        } else {
          enemy.stomp();
          this.player.score += 200;
          this.hud.addScorePopup(enemy.x, enemy.y - 8, '+200', '#fbbf24');
          this.audio.stomp();
        }
      }
    }

    // Boss collision
    if (this.boss && this.boss.alive && this.boss.active) {
      const bh = this.boss.getHitbox();
      if (aabbOverlap(ph, bh)) {
        if (this.player.vy > 0 && this.player.y + this.player.h - 4 < this.boss.y + this.boss.h / 2) {
          const defeated = this.boss.hit();
          this.player.vy = -6;
          this.player.score += 500;
          this.hud.addScorePopup(this.boss.x, this.boss.y - 12, '+500', '#fbbf24');
          this.audio.bossHit();
          this.camera.shake(5, 12);

          if (defeated) {
            this._onBossDefeated();
          }
        } else if (this.boss.state !== 'stunned') {
          this.player.hit();
          if (this.player.invincibleTimer === 90) { this.audio.hit(); this.camera.shake(4, 10); }
        }
      }

      // RoboSnake segment collision
      if (this.boss instanceof RoboSnake && this.boss.alive) {
        for (const sh of this.boss.getSegmentHitboxes()) {
          if (aabbOverlap(ph, sh) && !this.player.hasInvincibilityStar) {
            this.player.hit();
            if (this.player.invincibleTimer === 90) { this.audio.hit(); this.camera.shake(3, 8); }
            break;
          }
        }
      }

      // KingViking shockwave
      if (this.boss instanceof KingViking && this.boss.isInShockwave(this.player.x, this.player.y, this.player.w, this.player.h)) {
        if (!this.player.onGround) { /* safe if airborne */ }
        else {
          this.player.hit();
          if (this.player.invincibleTimer === 90) { this.audio.hit(); this.camera.shake(4, 10); }
        }
      }

      // KingViking summoned minions
      if (this.boss instanceof KingViking) {
        for (const minion of this.boss.summonedEnemies) {
          if (!minion.alive) continue;
          const mh = minion.getHitbox();
          if (aabbOverlap(ph, mh)) {
            if (this.player.vy > 0 && this.player.y + this.player.h - 4 < minion.y + minion.h / 2) {
              minion.stomp(); this.player.vy = -5; this.player.score += 200;
              this.audio.stomp();
            } else if (!this.player.hasInvincibilityStar) {
              this.player.hit();
              if (this.player.invincibleTimer === 90) { this.audio.hit(); this.camera.shake(3, 8); }
            } else {
              minion.stomp(); this.player.score += 200; this.audio.stomp();
            }
          }
        }
      }
    }

    // Items
    for (const item of this.items) {
      if (item.collected) continue;
      if (aabbOverlap(ph, item.getHitbox())) {
        item.collect(this.player);
        switch (item.type) {
          case 'carrot': this.audio.collectCarrot(); break;
          case 'heart': this.audio.collectHeart(); break;
          case 'star': case 'speed': this.audio.collectPowerUp(); break;
        }
        const text = item.type === 'carrot' ? '+100' : item.type.toUpperCase();
        const color = { carrot: '#f97316', heart: '#ef4444', star: '#fbbf24', speed: '#22d3ee' }[item.type];
        this.hud.addScorePopup(item.x, item.y - 8, text, color);
      }
    }

    // Checkpoints
    for (const cp of this.checkpoints) {
      if (cp.activated) continue;
      if (aabbOverlap(ph, cp.getHitbox())) {
        cp.activate(this.player);
        this.audio.checkpoint();
      }
    }
  }

  _onBossDefeated() {
    const ba = this.levelData.bossArea;
    if (ba.isFinalBoss !== false) {
      // Level-ending boss
      this.audio.bossDefeat();
      this.player.score += 5000;
      setTimeout(() => {
        this.state = 'levelComplete';
        this.stateTimer = 0;
        this.audio.levelComplete();
      }, 2000);
    } else {
      // Mid-level boss (e.g. RoboSnake)
      this.audio.bossDefeat();
      this.player.score += 3000;
      this.hud.addScorePopup(this.boss.x, this.boss.y - 16, '+3000', '#fbbf24');
      if (ba.openTiles) {
        for (const t of ba.openTiles) {
          this.level.setTile(t.col, t.row, 0);
        }
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

  _checkCompleteTrigger() {
    const ct = this.levelData.completeTrigger;
    if (!ct) return;
    if (ct.type === 'position') {
      if (this.player.x >= ct.x && this.player.y <= ct.y + 32) {
        this.state = 'levelComplete';
        this.stateTimer = 0;
        this.audio.levelComplete();
      }
    }
  }

  _updatePaused(input) {
    if (input.pause || input.start) { this.state = 'playing'; this.audio.menuSelect(); }
  }

  _updateGameOver(input) {
    if (this.stateTimer > 60 && (input.start || input.jump)) {
      this.audio.menuSelect();
      this.startLevel(); // restart current level
    }
  }

  _updateLevelComplete(input) {
    if (this.stateTimer > 120 && (input.start || input.jump)) {
      if (this.currentLevel < this.totalLevels - 1) {
        const savedScore = this.player.score;
        const savedCarrots = this.player.carrots;
        const savedLives = this.player.lives;
        this.currentLevel++;
        this.startLevel();
        this.player.score = savedScore;
        this.player.carrots = savedCarrots;
        this.player.lives = savedLives;
        this.player.health = this.player.maxHealth;
      } else {
        this.state = 'gameWin';
        this.stateTimer = 0;
      }
    }
  }

  _updateBossIntro(input) {
    if (this.stateTimer < 60) {
      const bx = this.boss.x - VIEW_WIDTH / 2;
      this.camera.x += (bx - this.camera.x) * 0.05;
    } else if (this.stateTimer >= 90) {
      this.state = 'playing';
    }
  }

  _updateGameWin(input) {
    if (this.stateTimer > 180 && (input.start || input.jump)) {
      this.state = 'title';
      this.stateTimer = 0;
      this.currentLevel = 0;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    switch (this.state) {
      case 'title': this._drawTitle(ctx); break;
      case 'levelIntro': this._drawLevelIntro(ctx); break;
      case 'playing': case 'paused': case 'bossIntro':
        this._drawGame(ctx);
        if (this.state === 'paused') this._drawPause(ctx);
        if (this.state === 'bossIntro') this._drawBossIntro(ctx);
        break;
      case 'gameOver':
        this._drawGame(ctx); this._drawGameOver(ctx); break;
      case 'levelComplete':
        this._drawGame(ctx); this._drawLevelComplete(ctx); break;
      case 'gameWin':
        this._drawGameWin(ctx); break;
    }

    if (this.transitionTimer > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.transitionTimer / 20})`;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }
  }

  _drawTitle(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, '#4488ff'); gradient.addColorStop(0.5, '#66aaff');
    gradient.addColorStop(0.8, '#88ccff'); gradient.addColorStop(1, '#5ddb5d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

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

    ctx.fillStyle = '#5ddb5d'; ctx.fillRect(0, VIEW_HEIGHT - 40, VIEW_WIDTH, 40);
    ctx.fillStyle = '#3dbd3d'; ctx.fillRect(0, VIEW_HEIGHT - 40, VIEW_WIDTH, 3);

    ctx.fillStyle = '#ff3b3b'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PRESS START!', VIEW_WIDTH / 2, 50);

    const bounce = Math.sin(this.titleTimer * 0.08) * 3;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px monospace';
    ctx.fillText('SUPER', VIEW_WIDTH / 2, 72 + bounce);
    ctx.fillStyle = '#ffe347'; ctx.font = 'bold 18px monospace';
    ctx.fillText('RABBIT BOY', VIEW_WIDTH / 2, 92 + bounce);

    ctx.fillStyle = '#ffffff'; ctx.font = '8px monospace';
    ctx.fillText('vs. King Viking\'s Robot Army!', VIEW_WIDTH / 2, 110);

    const rabbitY = VIEW_HEIGHT - 56 + Math.abs(Math.sin(this.titleTimer * 0.08)) * -10;
    this.spriteRenderer.draw(ctx, 'rabbitIdle', VIEW_WIDTH / 2 - 8, rabbitY, 0, false);

    if (Math.floor(this.titleTimer / 30) % 2 === 0) {
      ctx.fillStyle = '#222034'; ctx.font = 'bold 8px monospace';
      ctx.fillText('PRESS ENTER OR TAP TO START', VIEW_WIDTH / 2, 135);
    }

    ctx.fillStyle = '#336699'; ctx.font = '6px monospace';
    ctx.fillText('ARROWS/WASD: MOVE    SPACE: JUMP', VIEW_WIDTH / 2, 200);
    ctx.fillText('SHIFT: DASH    P/ESC: PAUSE', VIEW_WIDTH / 2, 210);
    ctx.textAlign = 'left';
  }

  _drawLevelIntro(ctx) {
    const ld = this.levelData;
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    const colors = ld.bgColors || ['#222', '#333', '#444', '#555'];
    colors.forEach((c, i) => gradient.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace';
    ctx.fillText(`LEVEL ${this.currentLevel + 1}`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 20);

    ctx.fillStyle = '#ffe347'; ctx.font = 'bold 12px monospace';
    ctx.fillText(ld.name || 'Unknown', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 5);

    if (this.stateTimer > 60) {
      ctx.fillStyle = '#aaa'; ctx.font = '7px monospace';
      ctx.fillText('GET READY!', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 30);
    }
    ctx.textAlign = 'left';
  }

  _drawGame(ctx) {
    this.level.drawBackground(ctx, this.camera);
    this.camera.apply(ctx);
    this.level.drawTiles(ctx, this.camera, this.spriteRenderer);
    this.checkpoints.forEach(cp => cp.draw(ctx, this.spriteRenderer, this.camera));
    this.items.forEach(item => item.draw(ctx, this.spriteRenderer, this.camera));
    this.enemies.forEach(e => e.draw(ctx, this.spriteRenderer, this.camera));
    if (this.boss) this.boss.draw(ctx, this.spriteRenderer, this.camera);
    this.player.draw(ctx, this.spriteRenderer);
    this.hud.draw(ctx, this.player, this.camera);
    this.camera.restore(ctx);
    this.hud.drawOverlay(ctx, this.player, VIEW_WIDTH, this.levelData.name);
    if (this.boss && this.bossActivated) {
      this.hud.drawBossHealth(ctx, this.boss, VIEW_WIDTH);
    }
  }

  _drawPause(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 10);
    ctx.font = '8px monospace'; ctx.fillStyle = '#aaa';
    ctx.fillText('Press P or ESC to resume', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 15);
    ctx.textAlign = 'left';
  }

  _drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#e63946'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 20);
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
    ctx.fillText(`FINAL SCORE: ${this.player.score}`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 5);
    if (this.stateTimer > 60 && Math.floor(this.stateTimer / 20) % 2 === 0) {
      ctx.fillText('PRESS ENTER TO RETRY', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 25);
    }
    ctx.textAlign = 'left';
  }

  _drawLevelComplete(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 30);
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
    ctx.fillText(`SCORE: ${this.player.score}`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
    ctx.fillText(`CARROTS: ${this.player.carrots}`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 15);
    if (this.stateTimer > 120 && Math.floor(this.stateTimer / 20) % 2 === 0) {
      const text = this.currentLevel < this.totalLevels - 1 ? 'PRESS ENTER TO CONTINUE' : 'PRESS ENTER';
      ctx.fillText(text, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 40);
    }
    ctx.textAlign = 'left';
  }

  _drawBossIntro(ctx) {
    if (this.stateTimer < 80) {
      const alpha = Math.sin(this.stateTimer * 0.15) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(102, 68, 204, ${alpha})`;
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText('WARNING!', VIEW_WIDTH / 2, 30);
      const bossName = this.levelData.bossArea.name || 'BOSS APPROACHES!';
      ctx.font = '8px monospace';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillText(bossName, VIEW_WIDTH / 2, 45);
      ctx.textAlign = 'left';
    }
  }

  _drawGameWin(ctx) {
    // Celebratory background
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, '#1a0a30');
    gradient.addColorStop(1, '#4422aa');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Stars / sparkles
    for (let i = 0; i < 20; i++) {
      const sx = (i * 37 + this.stateTimer * 0.5) % VIEW_WIDTH;
      const sy = (i * 29 + 10) % VIEW_HEIGHT;
      ctx.globalAlpha = 0.3 + Math.sin(this.stateTimer * 0.08 + i) * 0.3;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 14px monospace';
    ctx.fillText('CONGRATULATIONS!', VIEW_WIDTH / 2, 40);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace';
    ctx.fillText('SUPER RABBIT BOY', VIEW_WIDTH / 2, 65);
    ctx.fillText('SAVED ANIMAL TOWN!', VIEW_WIDTH / 2, 80);

    // Rabbit sprite
    const ry = 100 + Math.sin(this.stateTimer * 0.06) * 5;
    this.spriteRenderer.draw(ctx, 'rabbitJump', VIEW_WIDTH / 2 - 8, ry, 0, false);

    ctx.fillStyle = '#ffffff'; ctx.font = '8px monospace';
    if (this.player) {
      ctx.fillText(`FINAL SCORE: ${this.player.score}`, VIEW_WIDTH / 2, 140);
      ctx.fillText(`CARROTS: ${this.player.carrots}`, VIEW_WIDTH / 2, 155);
    }

    ctx.fillStyle = '#aaa'; ctx.font = '7px monospace';
    ctx.fillText('KING VIKING HAS BEEN DEFEATED!', VIEW_WIDTH / 2, 175);

    if (this.stateTimer > 180 && Math.floor(this.stateTimer / 25) % 2 === 0) {
      ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
      ctx.fillText('PRESS ENTER', VIEW_WIDTH / 2, 200);
    }
    ctx.textAlign = 'left';
  }
}
