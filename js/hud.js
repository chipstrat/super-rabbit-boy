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

  drawOverlay(ctx, player, viewWidth, levelName) {
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

    // Level name
    if (levelName) {
      ctx.fillStyle = '#aaa';
      ctx.font = '6px monospace';
      ctx.fillText(levelName, 140, 11);
    }

    // Lives
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(`x${player.lives}`, 205, 12);
    // Mini rabbit head for lives
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(196, 5, 7, 7);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(198, 4, 2, 3);
    ctx.fillRect(201, 4, 2, 3);

    // Carrots counter (small)
    ctx.fillStyle = '#f97316';
    ctx.fillRect(230, 5, 3, 6);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(230, 3, 3, 3);
    ctx.fillStyle = '#fff';
    ctx.font = '7px monospace';
    ctx.fillText(`${player.carrots}`, 235, 11);

    // Power-up indicators
    let px = viewWidth - 16;
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

  drawBossHealth(ctx, boss, viewWidth) {
    if (!boss || !boss.alive || !boss.active) return;
    const barW = 80, barH = 6;
    const bx = (viewWidth - barW) / 2;
    const by = 22;
    const hpRatio = boss.hp / boss.maxHp;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = hpRatio > 0.3 ? '#e63946' : '#ff6b6b';
    ctx.fillRect(bx, by, barW * hpRatio, barH);

    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name || 'BOSS', viewWidth / 2, by - 2);
    ctx.textAlign = 'left';
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
