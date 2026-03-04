// Enemies — Fox, Bird, Fish, RoboSnake, KingFox, KingViking

import { TILE_SIZE, aabbOverlap, moveEntity } from './physics.js';

export class Fox {
  constructor(x, y, patrolLeft, patrolRight) {
    this.x = x; this.y = y; this.w = 12; this.h = 14;
    this.vx = -0.8; this.vy = 0;
    this.patrolLeft = patrolLeft; this.patrolRight = patrolRight;
    this.facingRight = false; this.onGround = false;
    this.wallLeft = false; this.wallRight = false; this.isDashing = false;
    this.alive = true; this.deathTimer = 0; this.animTimer = 0;
    this.spriteOffsetX = -2; this.spriteOffsetY = -2;
  }

  update(level) {
    if (!this.alive) { this.deathTimer--; return this.deathTimer > 0; }
    if (this.x <= this.patrolLeft || this.wallLeft) { this.vx = 0.8; this.facingRight = true; }
    else if (this.x + this.w >= this.patrolRight || this.wallRight) { this.vx = -0.8; this.facingRight = false; }
    moveEntity(this, level);
    return true;
  }

  getHitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  stomp() { this.alive = false; this.deathTimer = 20; }

  draw(ctx, spriteRenderer, camera) {
    if (!camera.isVisible(this.x - 2, this.y - 2, 16, 16)) return;
    if (!this.alive) {
      ctx.globalAlpha = this.deathTimer / 20;
      ctx.save();
      ctx.translate(Math.floor(this.x + this.spriteOffsetX + 8), Math.floor(this.y + this.spriteOffsetY + 16));
      ctx.scale(1 + (20 - this.deathTimer) * 0.05, Math.max(0.1, this.deathTimer / 20));
      ctx.translate(-8, -16);
      spriteRenderer.draw(ctx, 'fox', 0, 0, 0, this.facingRight);
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    spriteRenderer.draw(ctx, 'fox', Math.floor(this.x + this.spriteOffsetX), Math.floor(this.y + this.spriteOffsetY), 0, this.facingRight);
  }
}

export class Bird {
  constructor(x, y, patrolLeft, patrolRight) {
    this.x = x; this.y = y; this.baseY = y;
    this.w = 10; this.h = 8; this.vx = 0.6; this.vy = 0;
    this.patrolLeft = patrolLeft; this.patrolRight = patrolRight;
    this.facingRight = true; this.alive = true; this.deathTimer = 0;
    this.sineTimer = 0; this.animTimer = 0; this.animFrame = 0;
    this.spriteOffsetX = -3; this.spriteOffsetY = -4;
    this.onGround = false; this.wallLeft = false; this.wallRight = false; this.isDashing = false;
  }

  update(level) {
    if (!this.alive) {
      this.deathTimer--; this.vy += 0.3; this.y += this.vy;
      return this.deathTimer > 0 && this.y < level.height * TILE_SIZE + 32;
    }
    this.x += this.vx;
    if (this.x <= this.patrolLeft) { this.vx = 0.6; this.facingRight = true; }
    else if (this.x + this.w >= this.patrolRight) { this.vx = -0.6; this.facingRight = false; }
    this.sineTimer += 0.04;
    this.y = this.baseY + Math.sin(this.sineTimer) * 20;
    this.animTimer++;
    if (this.animTimer >= 12) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
    return true;
  }

  getHitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  stomp() { this.alive = false; this.deathTimer = 30; this.vy = -2; }

  draw(ctx, spriteRenderer, camera) {
    if (!camera.isVisible(this.x - 3, this.y - 4, 16, 16)) return;
    if (!this.alive) ctx.globalAlpha = this.deathTimer / 30;
    spriteRenderer.draw(ctx, 'bird', Math.floor(this.x + this.spriteOffsetX), Math.floor(this.y + this.spriteOffsetY), this.animFrame, this.facingRight);
    ctx.globalAlpha = 1;
  }
}

// Fish enemy — underwater, lunging attack
export class Fish {
  constructor(x, y, patrolLeft, patrolRight) {
    this.x = x; this.y = y; this.baseY = y;
    this.w = 10; this.h = 8; this.vx = 1.0; this.vy = 0;
    this.patrolLeft = patrolLeft; this.patrolRight = patrolRight;
    this.facingRight = true; this.alive = true; this.deathTimer = 0;
    this.sineTimer = Math.random() * Math.PI * 2;
    this.animTimer = 0; this.animFrame = 0;
    this.spriteOffsetX = -3; this.spriteOffsetY = -4;
    this.onGround = false; this.wallLeft = false; this.wallRight = false; this.isDashing = false;
    this.lungeTimer = Math.floor(Math.random() * 60);
    this.isLunging = false; this.lungeCountdown = 0;
    this.normalSpeed = 1.0;
  }

  update(level) {
    if (!this.alive) {
      this.deathTimer--; this.vy += 0.1; this.y += this.vy;
      return this.deathTimer > 0;
    }
    // Horizontal patrol
    this.x += this.vx;
    if (this.x <= this.patrolLeft) { this.vx = this.normalSpeed; this.facingRight = true; }
    else if (this.x + this.w >= this.patrolRight) { this.vx = -this.normalSpeed; this.facingRight = false; }
    // Sine wave
    this.sineTimer += 0.06;
    this.y = this.baseY + Math.sin(this.sineTimer) * 12;
    // Lunge attack
    this.lungeTimer++;
    if (this.isLunging) {
      this.lungeCountdown--;
      if (this.lungeCountdown <= 0) {
        this.isLunging = false;
        this.vx = this.facingRight ? this.normalSpeed : -this.normalSpeed;
      }
    } else if (this.lungeTimer > 180) {
      this.lungeTimer = 0;
      this.isLunging = true;
      this.lungeCountdown = 30;
      this.vx = this.facingRight ? 2.5 : -2.5;
    }
    // Tail animation
    this.animTimer++;
    if (this.animTimer >= 8) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
    return true;
  }

  getHitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  stomp() { this.alive = false; this.deathTimer = 25; this.vy = 0.5; }

  draw(ctx, spriteRenderer, camera) {
    if (!camera.isVisible(this.x - 3, this.y - 4, 16, 16)) return;
    if (!this.alive) ctx.globalAlpha = this.deathTimer / 25;
    spriteRenderer.draw(ctx, 'fish', Math.floor(this.x + this.spriteOffsetX), Math.floor(this.y + this.spriteOffsetY), this.animFrame, this.facingRight);
    ctx.globalAlpha = 1;
  }
}

// King Fox Boss (Level 1)
export class KingFox {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 24; this.h = 28;
    this.vx = 0; this.vy = 0; this.health = 5; this.maxHealth = 5;
    this.alive = true; this.active = false; this.deathTimer = 0;
    this.facingRight = false;
    this.spriteOffsetX = -4; this.spriteOffsetY = -4;
    this.onGround = false; this.wallLeft = false; this.wallRight = false; this.isDashing = false;
    this.state = 'idle'; this.stateTimer = 0; this.invincibleTimer = 0;
    this.chargeSpeed = 2; this.arenaLeft = 0; this.arenaRight = 0;
    this.particles = [];
  }

  activate(arenaLeft, arenaRight) {
    this.active = true; this.arenaLeft = arenaLeft; this.arenaRight = arenaRight;
    this.state = 'idle'; this.stateTimer = 60;
  }

  update(level, player) {
    if (!this.active || !this.alive) {
      if (!this.alive) { this.deathTimer--; this._updateParticles(); return this.deathTimer > 0; }
      return true;
    }
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    switch (this.state) {
      case 'idle':
        this.vx *= 0.9; this.stateTimer--;
        if (this.stateTimer <= 0) {
          if (Math.random() < 0.5) {
            this.state = 'charge'; this.facingRight = player.x > this.x;
            this.chargeSpeed = 2 + (this.maxHealth - this.health) * 0.3; this.stateTimer = 90;
          } else {
            this.state = 'jump'; this.vy = -8;
            this.vx = player.x > this.x ? 1.5 : -1.5;
            this.facingRight = player.x > this.x; this.stateTimer = 60;
          }
        }
        break;
      case 'charge':
        this.vx = this.facingRight ? this.chargeSpeed : -this.chargeSpeed;
        this.stateTimer--;
        if (this.x <= this.arenaLeft) { this.x = this.arenaLeft; this.vx = this.chargeSpeed; this.facingRight = true; }
        else if (this.x + this.w >= this.arenaRight) { this.x = this.arenaRight - this.w; this.vx = -this.chargeSpeed; this.facingRight = false; }
        if (this.stateTimer <= 0) { this.state = 'stunned'; this.stateTimer = 45; this.vx = 0; }
        break;
      case 'jump':
        this.stateTimer--;
        if (this.onGround && this.stateTimer < 40) {
          this.state = 'stunned'; this.stateTimer = 30; this.vx = 0;
          for (let i = 0; i < 6; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, life: 15, color: '#92400e' });
        }
        break;
      case 'stunned':
        this.vx *= 0.95; this.stateTimer--;
        if (this.stateTimer <= 0) { this.state = 'idle'; this.stateTimer = 30; }
        break;
    }
    moveEntity(this, level); this._updateParticles(); return true;
  }

  _updateParticles() { this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; return p.life > 0; }); }
  getHitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  hit() {
    if (this.invincibleTimer > 0) return false;
    this.health--; this.invincibleTimer = 60; this.state = 'stunned'; this.stateTimer = 45;
    for (let i = 0; i < 8; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 20, color: i % 2 === 0 ? '#fbbf24' : '#ef4444' });
    if (this.health <= 0) {
      this.alive = false; this.deathTimer = 120;
      for (let i = 0; i < 20; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2, life: 30 + Math.random() * 20, color: ['#fbbf24', '#ef4444', '#7c3aed', '#ea580c'][Math.floor(Math.random() * 4)] });
      return true;
    }
    return false;
  }

  draw(ctx, spriteRenderer, camera) {
    for (const p of this.particles) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 3, 3); }
    ctx.globalAlpha = 1;
    if (!this.alive) return;
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 3) % 2 === 0) return;
    const wobble = this.state === 'stunned' ? Math.sin(this.stateTimer * 0.5) * 2 : 0;
    ctx.save();
    ctx.translate(Math.floor(this.x + this.spriteOffsetX + wobble), Math.floor(this.y + this.spriteOffsetY));
    spriteRenderer.draw(ctx, 'kingFox', 0, 0, 0, this.facingRight, 2);
    ctx.restore();
    // Health bar
    const barW = 32, barX = Math.floor(this.x + this.w / 2 - barW / 2), barY = Math.floor(this.y - 8);
    ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, 3);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(barX, barY, barW * (this.health / this.maxHealth), 3);
  }
}

// RoboSnake — segmented mid-boss for Level 4
export class RoboSnake {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 16; this.h = 16;
    this.vx = 0; this.vy = 0; this.health = 8; this.maxHealth = 8;
    this.alive = true; this.active = false; this.deathTimer = 0;
    this.facingRight = false;
    this.onGround = false; this.wallLeft = false; this.wallRight = false; this.isDashing = false;
    this.invincibleTimer = 0;
    this.state = 'slither'; this.stateTimer = 120;
    this.arenaLeft = 0; this.arenaRight = 0;
    this.particles = [];
    // Segments
    this.segmentCount = 8;
    this.segments = [];
    this.positionHistory = [];
    for (let i = 0; i < this.segmentCount; i++) {
      this.segments.push({ x: x - (i + 1) * 12, y: y });
    }
  }

  activate(arenaLeft, arenaRight) {
    this.active = true; this.arenaLeft = arenaLeft; this.arenaRight = arenaRight;
    this.state = 'slither'; this.stateTimer = 120;
  }

  update(level, player) {
    if (!this.active) return true;
    if (!this.alive) { this.deathTimer--; this._updateParticles(); return this.deathTimer > 0; }
    if (this.invincibleTimer > 0) this.invincibleTimer--;

    // Record position history
    this.positionHistory.unshift({ x: this.x, y: this.y });
    if (this.positionHistory.length > this.segmentCount * 8) this.positionHistory.pop();

    // Update segments
    for (let i = 0; i < this.segmentCount; i++) {
      const idx = Math.min((i + 1) * 8, this.positionHistory.length - 1);
      if (idx >= 0 && idx < this.positionHistory.length) {
        this.segments[i].x = this.positionHistory[idx].x;
        this.segments[i].y = this.positionHistory[idx].y;
      }
    }

    switch (this.state) {
      case 'slither':
        this.vx = player.x > this.x ? 1.5 : -1.5;
        this.facingRight = this.vx > 0;
        this.vy = Math.sin(this.stateTimer * 0.1) * 0.8;
        this.stateTimer--;
        if (this.stateTimer <= 0) { this.state = 'coil'; this.stateTimer = 60; this.vx = 0; }
        break;
      case 'coil':
        this.vx *= 0.9; this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'strike'; this.stateTimer = 30;
          this.vx = player.x > this.x ? 4 : -4;
          this.vy = -2; this.facingRight = this.vx > 0;
        }
        break;
      case 'strike':
        this.stateTimer--;
        if (this.stateTimer <= 0 || this.wallLeft || this.wallRight) {
          this.state = 'stunned'; this.stateTimer = 50; this.vx = 0;
        }
        break;
      case 'stunned':
        this.vx *= 0.95; this.stateTimer--;
        if (this.stateTimer <= 0) { this.state = 'slither'; this.stateTimer = 120; }
        break;
    }

    // Keep in arena
    if (this.x < this.arenaLeft) { this.x = this.arenaLeft; this.vx = Math.abs(this.vx); }
    if (this.x + this.w > this.arenaRight) { this.x = this.arenaRight - this.w; this.vx = -Math.abs(this.vx); }

    moveEntity(this, level); this._updateParticles(); return true;
  }

  _updateParticles() { this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; return p.life > 0; }); }
  getHitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  // Get hitboxes for all segments (for player damage)
  getSegmentHitboxes() {
    return this.segments.map((s, i) => ({
      x: s.x + 2, y: s.y + 2,
      w: 10 - i * 0.3, h: 10 - i * 0.3
    }));
  }

  hit() {
    if (this.invincibleTimer > 0) return false;
    this.health--; this.invincibleTimer = 60;
    this.state = 'stunned'; this.stateTimer = 50;
    for (let i = 0; i < 8; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 20, color: i % 2 === 0 ? '#44aa44' : '#fbbf24' });
    if (this.health <= 0) {
      this.alive = false; this.deathTimer = 120;
      for (let i = 0; i < 25; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2, life: 30 + Math.random() * 20, color: ['#44aa44', '#fbbf24', '#ef4444', '#338833'][Math.floor(Math.random() * 4)] });
      return true;
    }
    return false;
  }

  draw(ctx, spriteRenderer, camera) {
    // Particles
    for (const p of this.particles) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 3, 3); }
    ctx.globalAlpha = 1;
    if (!this.alive) return;
    // Segments (tail to head)
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const s = this.segments[i];
      if (camera.isVisible(s.x, s.y, 16, 16)) {
        spriteRenderer.draw(ctx, 'snakeSegment', Math.floor(s.x), Math.floor(s.y), 0, this.facingRight);
      }
    }
    // Head
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 3) % 2 === 0) return;
    const wobble = this.state === 'stunned' ? Math.sin(this.stateTimer * 0.5) * 2 : 0;
    spriteRenderer.draw(ctx, 'snakeHead', Math.floor(this.x + wobble), Math.floor(this.y), 0, this.facingRight);
    // Health bar
    const barW = 40, barX = Math.floor(this.x + this.w / 2 - barW / 2), barY = Math.floor(this.y - 8);
    ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, 3);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(barX, barY, barW * (this.health / this.maxHealth), 3);
  }
}

// King Viking — final boss for Level 5
export class KingViking {
  constructor(x, y) {
    this.x = x; this.y = y; this.w = 28; this.h = 32;
    this.vx = 0; this.vy = 0; this.health = 10; this.maxHealth = 10;
    this.alive = true; this.active = false; this.deathTimer = 0;
    this.facingRight = false;
    this.spriteOffsetX = -2; this.spriteOffsetY = -2;
    this.onGround = false; this.wallLeft = false; this.wallRight = false; this.isDashing = false;
    this.invincibleTimer = 0;
    this.state = 'idle'; this.stateTimer = 0;
    this.phase = 1; this.chargeSpeed = 2.5;
    this.arenaLeft = 0; this.arenaRight = 0;
    this.particles = [];
    this.chargeBounces = 0;
    this.shockwaveTimer = 0;
    this.shockwaveX = 0; this.shockwaveY = 0;
    // Summoned minions
    this.summonedEnemies = [];
  }

  activate(arenaLeft, arenaRight) {
    this.active = true; this.arenaLeft = arenaLeft; this.arenaRight = arenaRight;
    this.state = 'idle'; this.stateTimer = 40;
  }

  update(level, player) {
    if (!this.active || !this.alive) {
      if (!this.alive) { this.deathTimer--; this._updateParticles(); return this.deathTimer > 0; }
      return true;
    }
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.shockwaveTimer > 0) this.shockwaveTimer--;

    // Phase transition
    if (this.health <= 5 && this.phase === 1) {
      this.phase = 2; this.chargeSpeed = 3.5;
      for (let i = 0; i < 15; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 25, color: '#ff3333' });
    }

    // Update summoned minions
    this.summonedEnemies = this.summonedEnemies.filter(e => e.update(level));

    switch (this.state) {
      case 'idle':
        this.vx *= 0.9; this.stateTimer--;
        if (this.stateTimer <= 0) {
          const actions = ['charge', 'jump', 'groundPound'];
          if (this.phase === 2) actions.push('summon', 'enraged');
          const action = actions[Math.floor(Math.random() * actions.length)];
          this._startAction(action, player);
        }
        break;
      case 'charge':
        this.vx = this.facingRight ? this.chargeSpeed : -this.chargeSpeed;
        if (this.x <= this.arenaLeft) { this.x = this.arenaLeft; this.vx = this.chargeSpeed; this.facingRight = true; this.chargeBounces++; }
        else if (this.x + this.w >= this.arenaRight) { this.x = this.arenaRight - this.w; this.vx = -this.chargeSpeed; this.facingRight = false; this.chargeBounces++; }
        if (this.chargeBounces >= 2) { this.state = 'stunned'; this.stateTimer = 30; this.vx = 0; }
        break;
      case 'jump':
        this.stateTimer--;
        if (this.onGround && this.stateTimer < 40) {
          this._createShockwave(32);
          this.state = 'stunned'; this.stateTimer = 25; this.vx = 0;
        }
        break;
      case 'groundPound':
        if (this.stateTimer > 0) {
          // Rising phase
          this.stateTimer--;
          if (this.stateTimer <= 0) { this.vy = 12; }
        } else if (this.onGround) {
          this._createShockwave(48);
          this.state = 'stunned'; this.stateTimer = 30; this.vx = 0;
        }
        break;
      case 'summon':
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          // Spawn 2 robot minions
          if (this.summonedEnemies.length < 4) {
            const left = this.arenaLeft; const right = this.arenaRight;
            this.summonedEnemies.push(new Fox(left + 20, this.y, left, right));
            this.summonedEnemies.push(new Fox(right - 30, this.y, left, right));
          }
          this.state = 'stunned'; this.stateTimer = 40; this.vx = 0;
        }
        break;
      case 'enraged':
        // Triple charge
        this.vx = this.facingRight ? this.chargeSpeed * 1.2 : -this.chargeSpeed * 1.2;
        this.stateTimer--;
        if (this.x <= this.arenaLeft) { this.x = this.arenaLeft; this.facingRight = true; this.chargeBounces++; }
        else if (this.x + this.w >= this.arenaRight) { this.x = this.arenaRight - this.w; this.facingRight = false; this.chargeBounces++; }
        if (this.chargeBounces >= 6 || this.stateTimer <= 0) { this.state = 'stunned'; this.stateTimer = 35; this.vx = 0; }
        break;
      case 'stunned':
        this.vx *= 0.95; this.stateTimer--;
        if (this.stateTimer <= 0) { this.state = 'idle'; this.stateTimer = 20; }
        break;
    }

    moveEntity(this, level); this._updateParticles(); return true;
  }

  _startAction(action, player) {
    this.chargeBounces = 0;
    this.facingRight = player.x > this.x;
    switch (action) {
      case 'charge': this.state = 'charge'; break;
      case 'jump':
        this.state = 'jump'; this.vy = -9; this.vx = player.x > this.x ? 1.5 : -1.5; this.stateTimer = 60;
        break;
      case 'groundPound':
        this.state = 'groundPound'; this.vy = -10; this.vx = 0; this.stateTimer = 20;
        break;
      case 'summon':
        this.state = 'summon'; this.stateTimer = 30; this.vx = 0;
        break;
      case 'enraged':
        this.state = 'enraged'; this.stateTimer = 120;
        break;
    }
  }

  _createShockwave(radius) {
    this.shockwaveTimer = 15; this.shockwaveX = this.x + this.w / 2; this.shockwaveY = this.y + this.h;
    for (let i = 0; i < 10; i++) {
      this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3, life: 15, color: '#92400e' });
    }
  }

  // Check if player is in shockwave range
  isInShockwave(px, py, pw, ph) {
    if (this.shockwaveTimer <= 0) return false;
    const cx = this.shockwaveX, cy = this.shockwaveY;
    const playerCX = px + pw / 2, playerCY = py + ph / 2;
    const dist = Math.sqrt((playerCX - cx) ** 2 + (playerCY - cy) ** 2);
    return dist < 48;
  }

  _updateParticles() { this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; return p.life > 0; }); }
  getHitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  hit() {
    if (this.invincibleTimer > 0) return false;
    this.health--; this.invincibleTimer = 60;
    this.state = 'stunned'; this.stateTimer = 30;
    for (let i = 0; i < 8; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 20, color: i % 2 === 0 ? '#6644cc' : '#fbbf24' });
    if (this.health <= 0) {
      this.alive = false; this.deathTimer = 150;
      for (let i = 0; i < 30; i++) this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 3, life: 40 + Math.random() * 30, color: ['#6644cc', '#fbbf24', '#ef4444', '#ff8833'][Math.floor(Math.random() * 4)] });
      return true;
    }
    return false;
  }

  draw(ctx, spriteRenderer, camera) {
    // Summoned minions
    this.summonedEnemies.forEach(e => e.draw(ctx, spriteRenderer, camera));
    // Particles
    for (const p of this.particles) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 3, 3); }
    ctx.globalAlpha = 1;
    // Shockwave visual
    if (this.shockwaveTimer > 0) {
      const r = (15 - this.shockwaveTimer) * 3.5;
      ctx.globalAlpha = this.shockwaveTimer / 15 * 0.4;
      ctx.strokeStyle = '#ff8833'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.shockwaveX, this.shockwaveY, r, Math.PI, 0); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (!this.alive) return;
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 3) % 2 === 0) return;
    const wobble = this.state === 'stunned' ? Math.sin(this.stateTimer * 0.5) * 2 : 0;
    // Phase 2 red aura
    if (this.phase === 2) {
      ctx.globalAlpha = 0.2 + Math.sin(this.stateTimer * 0.2) * 0.1;
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(Math.floor(this.x - 4), Math.floor(this.y - 4), this.w + 8, this.h + 8);
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(Math.floor(this.x + this.spriteOffsetX + wobble), Math.floor(this.y + this.spriteOffsetY));
    spriteRenderer.draw(ctx, 'kingFox', 0, 0, 0, this.facingRight, 2.5);
    ctx.restore();
    // Health bar
    const barW = 48, barX = Math.floor(this.x + this.w / 2 - barW / 2), barY = Math.floor(this.y - 12);
    ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = this.phase === 2 ? '#ef4444' : '#6644cc';
    ctx.fillRect(barX, barY, barW * (this.health / this.maxHealth), 4);
  }
}

// Factory function
export function createEnemies(enemyData) {
  return enemyData.map(e => {
    switch (e.type) {
      case 'fox': return new Fox(e.x, e.y, e.patrolLeft, e.patrolRight);
      case 'bird': return new Bird(e.x, e.y, e.patrolLeft, e.patrolRight);
      case 'fish': return new Fish(e.x, e.y, e.patrolLeft, e.patrolRight);
      default: return null;
    }
  }).filter(Boolean);
}
