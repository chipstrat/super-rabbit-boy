// Main — game loop entry point

import { Game } from './game.js';
import { Input } from './input.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
const input = new Input();

// Fixed timestep game loop
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  // Clamp delta to avoid spiral of death
  accumulator += Math.min(delta, 200);

  while (accumulator >= FRAME_TIME) {
    input.update();
    game.update(input);
    accumulator -= FRAME_TIME;
  }

  game.draw();
  requestAnimationFrame(gameLoop);
}

// Initialize and start
game.init().then(() => {
  requestAnimationFrame(gameLoop);
});
