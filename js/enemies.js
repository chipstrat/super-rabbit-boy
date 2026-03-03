// Enemies — Fox (ground patrol) and Bird (flying sine-wave)

import { TILE_SIZE, aabbOverlap, moveEntity } from './physics.js';

export class Fox {
  constructor(x, y, patrolLeft, patrolRight) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 14;
    this.vx = -0.8;
    this.vy = 0;
    this.patrolLeft = patrolLeft;
    this.patrolRight = patrolRight;
    this.facingRight = false;
    this.onGround = false;
    this.wallLeft = false;
    this.wallRight = false;
    this.isDashing = false;
    this.alive = true;
    this.deathTimer = 0;
    this.animTimer = 0;
    this.spriteOffsetX = -2;
    this.spriteOffsetY = -2;
  }

  update(level) {
    if (!this.alive) {
      this.deathTimer--;
      return this.deathTimer > 0;
    }

    // Patrol: reverse direction at boundaries or walls
    if (this.x <= this.patrolLeft || this.wallLeft) {
      this.vx = 0.8;
      this.facingRight = true;
    } else if (this.x + this.w >= this.patrolRight || this.wallRight) {
      this.vx = -0.8;
      this.facingRight = false;
    }

    moveEntity(this, level);
    return true;
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  stomp() {
    this.alive = false;
    this.deathTimer = 20;
  }

  draw(ctx, spriteRenderer, camera) {
    if (!camera.isVisible(this.x - 2, this.y - 2, 16, 16)) return;

    if (!this.alive) {
      // Death squish animation
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

    spriteRenderer.draw(
      ctx, 'fox',
      Math.floor(this.x + this.spriteOffsetX),
      Math.floor(this.y + this.spriteOffsetY),
      0, this.facingRight
    );
  }
}

export class Bird {
  constructor(x, y, patrolLeft, patrolRight) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.w = 10;
    this.h = 8;
    this.vx = 0.6;
    this.vy = 0;
    this.patrolLeft = patrolLeft;
    this.patrolRight = patrolRight;
    this.facingRight = true;
    this.alive = true;
    this.deathTimer = 0;
    this.sineTimer = 0;
    this.animTimer = 0;
    this.animFrame = 0;
    this.spriteOffsetX = -3;
    this.spriteOffsetY = -4;
    this.onGround = false;
    this.wallLeft = false;
    this.wallRight = false;
    this.isDashing = false;
  }

  update(level) {
    if (!this.alive) {
      this.deathTimer--;
      this.vy += 0.3;
      this.y += this.vy;
      return this.deathTimer > 0 && this.y < level.height * TILE_SIZE + 32;
    }

    // Patrol horizontally
    this.x += this.vx;
    if (this.x <= this.patrolLeft) {
      this.vx = 0.6;
      this.facingRight = true;
    } else if (this.x + this.w >= this.patrolRight) {
      this.vx = -0.6;
      this.facingRight = false;
    }

    // Sine wave vertical movement
    this.sineTimer += 0.04;
    this.y = this.baseY + Math.sin(this.sineTimer) * 20;

    // Wing flap animation
    this.animTimer++;
    if (this.animTimer >= 12) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    return true;
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  stomp() {
    this.alive = false;
    this.deathTimer = 30;
    this.vy = -2;
  }

  draw(ctx, spriteRenderer, camera) {
    if (!camera.isVisible(this.x - 3, this.y - 4, 16, 16)) return;

    if (!this.alive) {
      ctx.globalAlpha = this.deathTimer / 30;
    }

    spriteRenderer.draw(
      ctx, 'bird',
      Math.floor(this.x + this.spriteOffsetX),
      Math.floor(this.y + this.spriteOffsetY),
      this.animFrame, this.facingRight
    );

    ctx.globalAlpha = 1;
  }
}

// King Fox Boss
export class KingFox {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 28;
    this.vx = 0;
    this.vy = 0;
    this.health = 5;
    this.maxHealth = 5;
    this.alive = true;
    this.active = false;
    this.deathTimer = 0;
    this.facingRight = false;
    this.spriteOffsetX = -4;
    this.spriteOffsetY = -4;
    this.onGround = false;
    this.wallLeft = false;
    this.wallRight = false;
    this.isDashing = false;

    // AI state
    this.state = 'idle'; // idle, charge, jump, stunned, defeated
    this.stateTimer = 0;
    this.invincibleTimer = 0;
    this.chargeSpeed = 2;
    this.targetX = 0;

    // Boss arena bounds
    this.arenaLeft = 0;
    this.arenaRight = 0;

    // Particles
    this.particles = [];
  }

  activate(arenaLeft, arenaRight) {
    this.active = true;
    this.arenaLeft = arenaLeft;
    this.arenaRight = arenaRight;
    this.state = 'idle';
    this.stateTimer = 60;
  }

  update(level, player) {
    if (!this.active || !this.alive) {
      if (!this.alive) {
        this.deathTimer--;
        this._updateParticles();
        return this.deathTimer > 0;
      }
      return true;
    }

    if (this.invincibleTimer > 0) this.invincibleTimer--;

    // State machine
    switch (this.state) {
      case 'idle':
        this.vx *= 0.9;
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          // Decide next action
          if (Math.random() < 0.5) {
            this.state = 'charge';
            this.facingRight = player.x > this.x;
            this.chargeSpeed = 2 + (this.maxHealth - this.health) * 0.3;
            this.stateTimer = 90;
          } else {
            this.state = 'jump';
            this.vy = -8;
            this.vx = player.x > this.x ? 1.5 : -1.5;
            this.facingRight = player.x > this.x;
            this.stateTimer = 60;
          }
        }
        break;

      case 'charge':
        this.vx = this.facingRight ? this.chargeSpeed : -this.chargeSpeed;
        this.stateTimer--;

        // Bounce off arena walls
        if (this.x <= this.arenaLeft) {
          this.x = this.arenaLeft;
          this.vx = this.chargeSpeed;
          this.facingRight = true;
        } else if (this.x + this.w >= this.arenaRight) {
          this.x = this.arenaRight - this.w;
          this.vx = -this.chargeSpeed;
          this.facingRight = false;
        }

        if (this.stateTimer <= 0) {
          this.state = 'stunned';
          this.stateTimer = 45;
          this.vx = 0;
        }
        break;

      case 'jump':
        this.stateTimer--;
        if (this.onGround && this.stateTimer < 40) {
          // Land shake
          this.state = 'stunned';
          this.stateTimer = 30;
          this.vx = 0;
          // Spawn landing particles
          for (let i = 0; i < 6; i++) {
            this.particles.push({
              x: this.x + this.w / 2,
              y: this.y + this.h,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 2,
              life: 15,
              color: '#92400e',
            });
          }
        }
        break;

      case 'stunned':
        this.vx *= 0.95;
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = 30;
        }
        break;
    }

    moveEntity(this, level);
    this._updateParticles();
    return true;
  }

  _updateParticles() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      return p.life > 0;
    });
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  hit() {
    if (this.invincibleTimer > 0) return false;
    this.health--;
    this.invincibleTimer = 60;
    this.state = 'stunned';
    this.stateTimer = 45;

    // Hit particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.x + this.w / 2,
        y: this.y + this.h / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 20,
        color: i % 2 === 0 ? '#fbbf24' : '#ef4444',
      });
    }

    if (this.health <= 0) {
      this.alive = false;
      this.deathTimer = 120;
      // Big explosion
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: this.x + this.w / 2,
          y: this.y + this.h / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 30 + Math.random() * 20,
          color: ['#fbbf24', '#ef4444', '#7c3aed', '#ea580c'][Math.floor(Math.random() * 4)],
        });
      }
      return true; // boss defeated
    }
    return false;
  }

  draw(ctx, spriteRenderer, camera) {
    // Draw particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / 30;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 3, 3);
    }
    ctx.globalAlpha = 1;

    if (!this.alive) return;

    // Flash when hit
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 3) % 2 === 0) return;

    // Stunned wobble
    const wobble = this.state === 'stunned' ? Math.sin(this.stateTimer * 0.5) * 2 : 0;

    // Draw at 2x scale
    ctx.save();
    ctx.translate(
      Math.floor(this.x + this.spriteOffsetX + wobble),
      Math.floor(this.y + this.spriteOffsetY)
    );
    spriteRenderer.draw(ctx, 'kingFox', 0, 0, 0, this.facingRight, 2);
    ctx.restore();

    // Health bar
    const barWidth = 32;
    const barHeight = 3;
    const barX = Math.floor(this.x + this.w / 2 - barWidth / 2);
    const barY = Math.floor(this.y - 8);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
  }
}

// Factory function to create enemies from level data
export function createEnemies(enemyData) {
  return enemyData.map(e => {
    switch (e.type) {
      case 'fox': return new Fox(e.x, e.y, e.patrolLeft, e.patrolRight);
      case 'bird': return new Bird(e.x, e.y, e.patrolLeft, e.patrolRight);
      default: return null;
    }
  }).filter(Boolean);
}
