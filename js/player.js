// Super Rabbit Boy — player character

import { TILE_SIZE, moveEntity } from './physics.js';

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
const DASH_COOLDOWN = 30;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 12; // hitbox width (smaller than sprite for forgiving collisions)
    this.h = 14; // hitbox height
    this.vx = 0;
    this.vy = 0;
    this.spriteOffsetX = -2; // offset to center sprite on hitbox
    this.spriteOffsetY = -2;

    this.facingRight = true;
    this.onGround = false;
    this.wallLeft = false;
    this.wallRight = false;
    this.isDashing = false;

    // Jump mechanics
    this.canDoubleJump = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasOnGround = false;

    // Combat & state
    this.health = 3;
    this.maxHealth = 3;
    this.lives = 3;
    this.score = 0;
    this.carrots = 0;
    this.invincibleTimer = 0;
    this.dead = false;

    // Power-ups
    this.hasSpeedBoost = false;
    this.speedBoostTimer = 0;
    this.hasHighJump = false;
    this.highJumpTimer = 0;
    this.hasInvincibilityStar = false;
    this.starTimer = 0;

    // Dash
    this.dashCooldown = 0;

    // Animation
    this.animTimer = 0;
    this.animFrame = 0;
    this.state = 'idle'; // idle, run, jump, fall, wallSlide

    // Checkpoint
    this.checkpointX = x;
    this.checkpointY = y;

    // Particles
    this.particles = [];
  }

  update(input, level) {
    if (this.dead) return;

    // Timers
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer--;
      if (this.speedBoostTimer <= 0) this.hasSpeedBoost = false;
    }
    if (this.highJumpTimer > 0) {
      this.highJumpTimer--;
      if (this.highJumpTimer <= 0) this.hasHighJump = false;
    }
    if (this.starTimer > 0) {
      this.starTimer--;
      if (this.starTimer <= 0) this.hasInvincibilityStar = false;
    }

    // Coyote time
    if (this.onGround) {
      this.coyoteTimer = COYOTE_TIME;
      this.canDoubleJump = true;
    } else {
      if (this.coyoteTimer > 0) this.coyoteTimer--;
    }

    // Jump buffering
    if (input.jump) {
      this.jumpBufferTimer = JUMP_BUFFER;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    // Horizontal movement
    const speed = this.hasSpeedBoost ? DASH_SPEED : (input.dash ? DASH_SPEED : MOVE_SPEED);
    this.isDashing = input.dash && this.dashCooldown <= 0;

    if (input.left) {
      this.vx = -speed;
      this.facingRight = false;
    } else if (input.right) {
      this.vx = speed;
      this.facingRight = true;
    } else {
      // Friction
      this.vx *= 0.7;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Wall sliding
    const onWall = !this.onGround && (this.wallLeft || this.wallRight);
    if (onWall && this.vy > 0) {
      this.vy = Math.min(this.vy, WALL_SLIDE_SPEED);
    }

    // Jumping
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        // Normal jump
        const jf = this.hasHighJump ? JUMP_FORCE * 1.3 : JUMP_FORCE;
        this.vy = jf;
        this.onGround = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this._spawnJumpDust();
      } else if (onWall) {
        // Wall jump
        this.vy = WALL_JUMP_FORCE_Y;
        this.vx = this.wallLeft ? WALL_JUMP_FORCE_X : -WALL_JUMP_FORCE_X;
        this.facingRight = this.wallLeft;
        this.jumpBufferTimer = 0;
        this.canDoubleJump = true;
      } else if (this.canDoubleJump) {
        // Double jump
        const djf = this.hasHighJump ? DOUBLE_JUMP_FORCE * 1.3 : DOUBLE_JUMP_FORCE;
        this.vy = djf;
        this.canDoubleJump = false;
        this.jumpBufferTimer = 0;
        this._spawnJumpDust();
      }
    }

    // Physics
    this.wasOnGround = this.onGround;
    moveEntity(this, level);

    // Fall off the map
    if (this.y > level.height * TILE_SIZE + 32) {
      this.die();
    }

    // Update animation state
    this._updateAnimation();

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  }

  _updateAnimation() {
    if (!this.onGround && (this.wallLeft || this.wallRight) && this.vy > 0) {
      this.state = 'wallSlide';
    } else if (this.vy < -1) {
      this.state = 'jump';
    } else if (!this.onGround && this.vy > 1) {
      this.state = 'fall';
    } else if (Math.abs(this.vx) > 0.5) {
      this.state = 'run';
      this.animTimer++;
      if (this.animTimer >= 8) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    } else {
      this.state = 'idle';
      this.animFrame = 0;
    }
  }

  _spawnJumpDust() {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.x + this.w / 2,
        y: this.y + this.h,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        life: 10 + Math.random() * 5,
        color: '#d4d4d4',
      });
    }
  }

  hit() {
    if (this.invincibleTimer > 0 || this.hasInvincibilityStar) return;
    this.health--;
    this.invincibleTimer = INVINCIBLE_DURATION;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.lives--;
    // Spawn death particles
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: this.x + this.w / 2,
        y: this.y + this.h / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        life: 20 + Math.random() * 15,
        color: i % 2 === 0 ? '#f0f0f0' : '#e63946',
      });
    }
  }

  respawn() {
    this.x = this.checkpointX;
    this.y = this.checkpointY;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.dead = false;
    this.invincibleTimer = INVINCIBLE_DURATION;
    this.hasSpeedBoost = false;
    this.hasHighJump = false;
    this.hasInvincibilityStar = false;
  }

  setCheckpoint(x, y) {
    this.checkpointX = x;
    this.checkpointY = y;
  }

  draw(ctx, spriteRenderer) {
    // Draw particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;

    if (this.dead) return;

    // Invincibility flash
    if (this.invincibleTimer > 0 && !this.hasInvincibilityStar) {
      if (Math.floor(this.invincibleTimer / 3) % 2 === 0) return;
    }

    // Star power glow
    if (this.hasInvincibilityStar) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = Math.floor(this.starTimer / 4) % 2 === 0 ? '#fbbf24' : '#ffffff';
      ctx.fillRect(
        Math.floor(this.x + this.spriteOffsetX - 2),
        Math.floor(this.y + this.spriteOffsetY - 2),
        20, 20
      );
      ctx.globalAlpha = 1;
    }

    // Determine sprite
    let spriteName, frame;
    if (this.state === 'jump' || this.state === 'fall' || this.state === 'wallSlide') {
      spriteName = 'rabbitJump';
      frame = 0;
    } else if (this.state === 'run') {
      spriteName = 'rabbitRun';
      frame = this.animFrame;
    } else {
      spriteName = 'rabbitIdle';
      frame = 0;
    }

    const flipX = !this.facingRight;
    spriteRenderer.draw(
      ctx, spriteName,
      Math.floor(this.x + this.spriteOffsetX),
      Math.floor(this.y + this.spriteOffsetY),
      frame, flipX
    );
  }
}
