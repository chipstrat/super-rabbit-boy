// HUD — health, score, lives, carrots display

export class HUD {
  constructor() {
    this.flashTimer = 0;
    this.scorePopups = [];
  }

  addScorePopup(x, y, text, color = '#fff') {
    this.scorePopups.push({ x, y, text, color, life: 40 });
  }

  update() {
    if (this.flashTimer > 0) this.flashTimer--;

    this.scorePopups = this.scorePopups.filter(p => {
      p.y -= 0.5;
      p.life--;
      return p.life > 0;
    });
  }

  draw(ctx, player, camera) {
    // Draw score popups in world space (before camera restore)
    for (const p of this.scorePopups) {
      ctx.globalAlpha = Math.min(1, p.life / 15);
      ctx.fillStyle = p.color;
      ctx.font = '8px monospace';
      ctx.fillText(p.text, Math.floor(p.x), Math.floor(p.y));
    }
    ctx.globalAlpha = 1;
  }

  drawOverlay(ctx, player, viewWidth) {
    // Background strip
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, viewWidth, 18);

    // Hearts
    for (let i = 0; i < player.maxHealth; i++) {
      const hx = 4 + i * 12;
      const hy = 4;
      if (i < player.health) {
        ctx.fillStyle = '#ef4444';
        this._drawMiniHeart(ctx, hx, hy);
      } else {
        ctx.fillStyle = '#444';
        this._drawMiniHeart(ctx, hx, hy);
      }
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(`SCORE ${String(player.score).padStart(6, '0')}`, 50, 12);

    // Carrots
    ctx.fillStyle = '#f97316';
    ctx.fillRect(140, 5, 4, 7);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(140, 3, 4, 3);
    ctx.fillStyle = '#fff';
    ctx.fillText(`x${player.carrots}`, 148, 12);

    // Lives
    ctx.fillText(`LIVES ${player.lives}`, 190, 12);

    // Power-up indicators
    let px = viewWidth - 40;
    if (player.hasSpeedBoost) {
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(px, 4, 8, 8);
      ctx.fillStyle = '#fff';
      ctx.font = '6px monospace';
      ctx.fillText('S', px + 2, 11);
      px -= 12;
    }
    if (player.hasInvincibilityStar) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px, 4, 8, 8);
      ctx.fillStyle = '#000';
      ctx.font = '6px monospace';
      ctx.fillText('*', px + 2, 11);
      px -= 12;
    }
  }

  _drawMiniHeart(ctx, x, y) {
    // Tiny pixel heart
    const c = ctx.fillStyle;
    ctx.fillRect(x, y + 1, 2, 1);
    ctx.fillRect(x + 3, y + 1, 2, 1);
    ctx.fillRect(x, y + 2, 5, 1);
    ctx.fillRect(x, y + 3, 5, 1);
    ctx.fillRect(x + 1, y + 4, 3, 1);
    ctx.fillRect(x + 2, y + 5, 1, 1);
  }
}
