// Smooth scrolling camera that follows the player

import { TILE_SIZE } from './physics.js';

export class Camera {
  constructor(viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.smoothing = 0.1;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;
    this.shakeMagnitude = 0;
  }

  follow(target, levelWidth, levelHeight) {
    // Target center on the player, slightly ahead in movement direction
    this.targetX = target.x + target.w / 2 - this.viewWidth / 2;
    this.targetY = target.y + target.h / 2 - this.viewHeight / 2;

    // Look-ahead: shift camera in the direction the player faces
    if (target.facingRight !== undefined) {
      this.targetX += target.facingRight ? 20 : -20;
    }

    // Smooth interpolation
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;

    // Clamp to level bounds
    const maxX = levelWidth * TILE_SIZE - this.viewWidth;
    const maxY = levelHeight * TILE_SIZE - this.viewHeight;
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));

    // Screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      this.shakeX = (Math.random() - 0.5) * this.shakeMagnitude;
      this.shakeY = (Math.random() - 0.5) * this.shakeMagnitude;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  shake(magnitude = 4, duration = 10) {
    this.shakeMagnitude = magnitude;
    this.shakeTimer = duration;
  }

  // Apply camera transform to the drawing context
  apply(ctx) {
    ctx.save();
    ctx.translate(
      -Math.floor(this.x + this.shakeX),
      -Math.floor(this.y + this.shakeY)
    );
  }

  restore(ctx) {
    ctx.restore();
  }

  // Check if a rect is visible on screen
  isVisible(x, y, w, h) {
    return x + w > this.x - 32 && x < this.x + this.viewWidth + 32 &&
           y + h > this.y - 32 && y < this.y + this.viewHeight + 32;
  }
}
