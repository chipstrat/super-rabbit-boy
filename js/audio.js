// Audio — 8-bit sound effects using Web Audio API

export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  _playTone(freq, duration, type = 'square', volume = 0.15) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  jump() {
    this._playTone(300, 0.1, 'square', 0.1);
    setTimeout(() => this._playTone(400, 0.1, 'square', 0.1), 50);
  }

  doubleJump() {
    this._playTone(400, 0.08, 'square', 0.1);
    setTimeout(() => this._playTone(500, 0.08, 'square', 0.1), 40);
    setTimeout(() => this._playTone(600, 0.1, 'square', 0.1), 80);
  }

  collectCarrot() {
    this._playTone(800, 0.05, 'square', 0.1);
    setTimeout(() => this._playTone(1000, 0.1, 'square', 0.1), 50);
  }

  collectHeart() {
    this._playTone(523, 0.1, 'triangle', 0.15);
    setTimeout(() => this._playTone(659, 0.1, 'triangle', 0.15), 100);
    setTimeout(() => this._playTone(784, 0.15, 'triangle', 0.15), 200);
  }

  collectPowerUp() {
    const notes = [523, 587, 659, 784, 880, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.08, 'square', 0.1), i * 50);
    });
  }

  stomp() {
    this._playTone(200, 0.08, 'square', 0.12);
    setTimeout(() => this._playTone(300, 0.05, 'square', 0.1), 40);
  }

  hit() {
    this._playTone(200, 0.15, 'sawtooth', 0.12);
    setTimeout(() => this._playTone(150, 0.15, 'sawtooth', 0.1), 80);
  }

  die() {
    const notes = [400, 350, 300, 250, 200, 150];
    notes.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.15, 'square', 0.12), i * 100);
    });
  }

  bossHit() {
    this._playTone(150, 0.1, 'sawtooth', 0.15);
    setTimeout(() => this._playTone(200, 0.15, 'square', 0.12), 50);
  }

  bossDefeat() {
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.2, 'triangle', 0.15), i * 120);
    });
  }

  levelComplete() {
    const melody = [523, 587, 659, 784, 659, 784, 1047];
    melody.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.15, 'triangle', 0.15), i * 150);
    });
  }

  checkpoint() {
    this._playTone(523, 0.1, 'triangle', 0.12);
    setTimeout(() => this._playTone(784, 0.15, 'triangle', 0.12), 100);
  }

  breakBlock() {
    this._playTone(150, 0.1, 'square', 0.1);
    this._playTone(100, 0.15, 'sawtooth', 0.08);
  }

  menuSelect() {
    this._playTone(600, 0.06, 'square', 0.08);
  }

  pause() {
    this._playTone(400, 0.05, 'square', 0.08);
    setTimeout(() => this._playTone(300, 0.05, 'square', 0.08), 50);
  }
}
