// Input handling — keyboard + touch
export class Input {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.previousKeys = {};

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Enter', 'Escape', 'KeyP'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch controls
    this._setupTouch();
  }

  _setupTouch() {
    const bind = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const start = (e) => { e.preventDefault(); this.keys[key] = true; };
      const end = (e) => { e.preventDefault(); this.keys[key] = false; };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    };

    bind('btn-left', 'ArrowLeft');
    bind('btn-right', 'ArrowRight');
    bind('btn-jump', 'Space');
    bind('btn-dash', 'ShiftLeft');
  }

  update() {
    // Compute justPressed: true only on the frame the key transitions from up to down
    for (const key in this.keys) {
      this.justPressed[key] = this.keys[key] && !this.previousKeys[key];
    }
    this.previousKeys = { ...this.keys };
  }

  isDown(key) {
    return !!this.keys[key];
  }

  isJustPressed(key) {
    return !!this.justPressed[key];
  }

  // Convenience getters
  get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
  get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
  get up() { return this.isDown('ArrowUp') || this.isDown('KeyW'); }
  get down() { return this.isDown('ArrowDown') || this.isDown('KeyS'); }
  get jump() { return this.isJustPressed('Space') || this.isJustPressed('ArrowUp') || this.isJustPressed('KeyW'); }
  get dash() { return this.isDown('ShiftLeft') || this.isDown('ShiftRight'); }
  get start() { return this.isJustPressed('Enter'); }
  get pause() { return this.isJustPressed('Escape') || this.isJustPressed('KeyP'); }
}
