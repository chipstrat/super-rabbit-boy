// Super Rabbit Boy — player character

import { TILE_SIZE, moveEntity, isWater, isQuicksand, WATER_SWIM_FORCE, QUICKSAND_ESCAPE_FORCE } from './physics.js';

const MOVE_SPEED = 2;
const DASH_SPEED = 3.5;
const JUMP_FORCE = -6.5;
const DOUBLE_JUMP_FORCE = -5.5;
const WALL_JUMP_FORCE_X = 3;
const WALL_JUMP_FORCE_Y = -6;
const WALL_SLIDE_SPEED = 1;
const COYOTE_TIME = 6;
const JUMP_BUFFER = 6;
const INVINCIBLE_DURATION = 90;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 14;
    this.vx = 0;
    this.vy = 0;
    this.spriteOffsetX = -2;
    this.spriteOffsetY = -2;

    this.facingRight = true;
    this.onGround = false;
    this.wallLeft = false;
    this.wallRight = false;
    this.isDashing = false;

    this.canDoubleJump = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasOnGround = false;

    this.health = 3;
    this.maxHealth = 3;
    this.lives = 3;
    this.score = 0;
    this.carrots = 0;
    this.invincibleTimer = 0;
    this.dead = false;

    this.hasSpeedBoost = false;
    this.speedBoostTimer = 0;
    this.hasHighJump = false;
    this.highJumpTimer = 0;
    this.hasInvincibilityStar = false;
    this.starTimer = 0;

    this.dashCooldown = 0;

    // Environment
    this.inWater = false;
    this.inQuicksand = false;
    this.onIce = false;
    this.swimTimer = 0;

    this.animTimer = 0;
    this.animFrame = 0;
    this.state = 'idle';

    this.checkpointX = x;
    this.checkpointY = y;
    this.particles = [];
  }

  update(input, level) {
    if (this.dead) return;

    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.speedBoostTimer > 0) { this.speedBoostTimer--; if (this.speedBoostTimer <= 0) this.hasSpeedBoost = false; }
    if (this.highJumpTimer > 0) { this.highJumpTimer--; if (this.highJumpTimer <= 0) this.hasHighJump = false; }
    if (this.starTimer > 0) { this.starTimer--; if (this.starTimer <= 0) this.hasInvincibilityStar = false; }
    if (this.swimTimer > 0) this.swimTimer--;

    // Check environment
    const centerCol = Math.floor((this.x + this.w / 2) / TILE_SIZE);
    const centerRow = Math.floor((this.y + this.h / 2) / TILE_SIZE);
    this.inWater = isWater(level, centerCol, centerRow);
    this.inQuicksand = isQuicksand(level, centerCol, centerRow);
    const footCol = Math.floor((this.x + this.w / 2) / TILE_SIZE);
    const footRow = Math.floor((this.y + this.h) / TILE_SIZE);
    this.onIce = level.getTile(footCol, footRow) === 11;

    if (this.onGround) { this.coyoteTimer = COYOTE_TIME; this.canDoubleJump = true; }
    else { if (this.coyoteTimer > 0) this.coyoteTimer--; }

    if (input.jump) { this.jumpBufferTimer = JUMP_BUFFER; }
    else if (this.jumpBufferTimer > 0) { this.jumpBufferTimer--; }

    if (this.inWater) this._updateWater(input);
    else if (this.inQuicksand) this._updateQuicksand(input);
    else this._updateNormal(input);

    this.wasOnGround = this.onGround;
    moveEntity(this, level);

    if (this.y > level.height * TILE_SIZE + 32) this.die();

    this._updateAnimation();
    this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
  }

  _updateWater(input) {
    const waterSpeed = this.hasSpeedBoost ? MOVE_SPEED : MOVE_SPEED * 0.7;
    if (input.left) { this.vx = -waterSpeed; this.facingRight = false; }
    else if (input.right) { this.vx = waterSpeed; this.facingRight = true; }
    else { this.vx *= 0.85; if (Math.abs(this.vx) < 0.1) this.vx = 0; }
    if (input.jump && this.swimTimer <= 0) {
      this.vy = WATER_SWIM_FORCE;
      this.swimTimer = 10;
      this._spawnBubbles();
    }
    this.isDashing = false;
  }

  _updateQuicksand(input) {
    const qsSpeed = MOVE_SPEED * 0.3;
    if (input.left) { this.vx = -qsSpeed; this.facingRight = false; }
    else if (input.right) { this.vx = qsSpeed; this.facingRight = true; }
    if (input.jump && this.jumpBufferTimer > 0) {
      this.vy = QUICKSAND_ESCAPE_FORCE;
      this.jumpBufferTimer = 0;
    }
    this.isDashing = false;
  }

  _updateNormal(input) {
    const friction = this.onIce ? 0.98 : 0.7;
    const speed = this.hasSpeedBoost ? DASH_SPEED : (input.dash ? DASH_SPEED : MOVE_SPEED);
    this.isDashing = input.dash && this.dashCooldown <= 0;

    // Drop through one-way platforms when pressing down while on ground
    this.dropThrough = input.down && this.onGround;
    if (this.dropThrough) {
      this.y += 2; // nudge past platform edge
      this.onGround = false;
    }

    if (input.left) { this.vx = -speed; this.facingRight = false; }
    else if (input.right) { this.vx = speed; this.facingRight = true; }
    else { this.vx *= friction; if (Math.abs(this.vx) < 0.1) this.vx = 0; }

    const onWall = !this.onGround && (this.wallLeft || this.wallRight);
    if (onWall && this.vy > 0) this.vy = Math.min(this.vy, WALL_SLIDE_SPEED);

    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        this.vy = this.hasHighJump ? JUMP_FORCE * 1.3 : JUMP_FORCE;
        this.onGround = false; this.coyoteTimer = 0; this.jumpBufferTimer = 0;
        this._spawnJumpDust();
      } else if (onWall) {
        this.vy = WALL_JUMP_FORCE_Y;
        this.vx = this.wallLeft ? WALL_JUMP_FORCE_X : -WALL_JUMP_FORCE_X;
        this.facingRight = this.wallLeft; this.jumpBufferTimer = 0; this.canDoubleJump = true;
      } else if (this.canDoubleJump) {
        this.vy = this.hasHighJump ? DOUBLE_JUMP_FORCE * 1.3 : DOUBLE_JUMP_FORCE;
        this.canDoubleJump = false; this.jumpBufferTimer = 0;
        this._spawnJumpDust();
      }
    }
  }

  _updateAnimation() {
    if (this.inWater) {
      this.state = 'swim';
      this.animTimer++;
      if (this.animTimer >= 10) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
    } else if (!this.onGround && (this.wallLeft || this.wallRight) && this.vy > 0) {
      this.state = 'wallSlide';
    } else if (this.vy < -1) {
      this.state = 'jump';
    } else if (!this.onGround && this.vy > 1) {
      this.state = 'fall';
    } else if (Math.abs(this.vx) > 0.5) {
      this.state = 'run';
      this.animTimer++;
      if (this.animTimer >= 8) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
    } else {
      this.state = 'idle';
      this.animFrame = 0;
    }
  }

  _spawnJumpDust() {
    for (let i = 0; i < 4; i++) {
      this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 1.5, life: 10 + Math.random() * 5, color: '#d4d4d4' });
    }
  }

  _spawnBubbles() {
    for (let i = 0; i < 3; i++) {
      this.particles.push({ x: this.x + this.w / 2 + (Math.random() - 0.5) * 6, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 1.5 - 0.5, life: 15 + Math.random() * 10, color: '#88ccff' });
    }
  }

  hit() {
    if (this.invincibleTimer > 0 || this.hasInvincibilityStar) return;
    this.health--;
    this.invincibleTimer = INVINCIBLE_DURATION;
    if (this.health <= 0) this.die();
  }

  die() {
    this.dead = true;
    this.lives--;
    for (let i = 0; i < 12; i++) {
      this.particles.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 2, life: 20 + Math.random() * 15, color: i % 2 === 0 ? '#f0f0f0' : '#e63946' });
    }
  }

  respawn() {
    this.x = this.checkpointX; this.y = this.checkpointY;
    this.vx = 0; this.vy = 0;
    this.health = this.maxHealth; this.dead = false;
    this.invincibleTimer = INVINCIBLE_DURATION;
    this.hasSpeedBoost = false; this.hasHighJump = false;
    this.hasInvincibilityStar = false;
    this.inWater = false; this.inQuicksand = false;
  }

  setCheckpoint(x, y) { this.checkpointX = x; this.checkpointY = y; }

  draw(ctx, spriteRenderer) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;
    if (this.dead) return;

    if (this.invincibleTimer > 0 && !this.hasInvincibilityStar) {
      if (Math.floor(this.invincibleTimer / 3) % 2 === 0) return;
    }

    if (this.hasInvincibilityStar) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = Math.floor(this.starTimer / 4) % 2 === 0 ? '#fbbf24' : '#ffffff';
      ctx.fillRect(Math.floor(this.x + this.spriteOffsetX - 2), Math.floor(this.y + this.spriteOffsetY - 2), 20, 20);
      ctx.globalAlpha = 1;
    }

    let spriteName, frame;
    if (this.state === 'swim' || this.state === 'jump' || this.state === 'fall' || this.state === 'wallSlide') {
      spriteName = 'rabbitJump'; frame = 0;
    } else if (this.state === 'run') {
      spriteName = 'rabbitRun'; frame = this.animFrame;
    } else {
      spriteName = 'rabbitIdle'; frame = 0;
    }

    spriteRenderer.draw(ctx, spriteName, Math.floor(this.x + this.spriteOffsetX), Math.floor(this.y + this.spriteOffsetY), frame, !this.facingRight);
  }
}
