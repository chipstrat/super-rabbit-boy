// Physics — gravity, AABB collision detection against tilemap

export const GRAVITY = 0.4;
export const TERMINAL_VELOCITY = 8;
export const TILE_SIZE = 16;

// AABB collision check
export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Check if a world position corresponds to a solid tile
export function isSolid(level, col, row) {
  if (col < 0 || row < 0 || col >= level.width || row >= level.height) {
    return row >= level.height; // Bottom is solid (death pit returns false, handled elsewhere)
  }
  const tile = level.getTile(col, row);
  return tile > 0 && tile !== 5; // 5 = one-way platform (handled separately)
}

// Check if tile is a one-way platform
export function isPlatform(level, col, row) {
  if (col < 0 || row < 0 || col >= level.width || row >= level.height) return false;
  return level.getTile(col, row) === 5;
}

// Check if tile is breakable
export function isBreakable(level, col, row) {
  if (col < 0 || row < 0 || col >= level.width || row >= level.height) return false;
  return level.getTile(col, row) === 4; // brick
}

// Resolve entity movement against tilemap with collision
export function moveEntity(entity, level, dt = 1) {
  // Apply gravity
  entity.vy = Math.min(entity.vy + GRAVITY * dt, TERMINAL_VELOCITY);

  // Move X
  entity.x += entity.vx * dt;
  resolveX(entity, level);

  // Move Y
  entity.y += entity.vy * dt;
  resolveY(entity, level);
}

function resolveX(entity, level) {
  const left = Math.floor(entity.x / TILE_SIZE);
  const right = Math.floor((entity.x + entity.w - 1) / TILE_SIZE);
  const top = Math.floor(entity.y / TILE_SIZE);
  const bottom = Math.floor((entity.y + entity.h - 1) / TILE_SIZE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (isSolid(level, col, row)) {
        if (entity.vx > 0) {
          entity.x = col * TILE_SIZE - entity.w;
          entity.vx = 0;
          entity.wallRight = true;
        } else if (entity.vx < 0) {
          entity.x = (col + 1) * TILE_SIZE;
          entity.vx = 0;
          entity.wallLeft = true;
        }
        // Check breakable tiles hit from the side
        if (isBreakable(level, col, row) && entity.isDashing) {
          level.breakTile(col, row);
        }
        return;
      }
    }
  }
  entity.wallLeft = false;
  entity.wallRight = false;
}

function resolveY(entity, level) {
  const left = Math.floor(entity.x / TILE_SIZE);
  const right = Math.floor((entity.x + entity.w - 1) / TILE_SIZE);
  const top = Math.floor(entity.y / TILE_SIZE);
  const bottom = Math.floor((entity.y + entity.h - 1) / TILE_SIZE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (isSolid(level, col, row)) {
        if (entity.vy > 0) {
          entity.y = row * TILE_SIZE - entity.h;
          entity.vy = 0;
          entity.onGround = true;
          // Break bricks by stomping
          if (isBreakable(level, col, row) && entity.isDashing) {
            level.breakTile(col, row);
          }
        } else if (entity.vy < 0) {
          entity.y = (row + 1) * TILE_SIZE;
          entity.vy = 0;
          // Break bricks from below
          if (isBreakable(level, col, row)) {
            level.breakTile(col, row);
          }
        }
        return;
      }

      // One-way platform: only solid when falling and feet are at/above the platform top
      if (isPlatform(level, col, row) && entity.vy > 0) {
        const platTop = row * TILE_SIZE;
        const entityBottom = entity.y + entity.h;
        const prevBottom = entityBottom - entity.vy;
        if (prevBottom <= platTop + 2) {
          entity.y = platTop - entity.h;
          entity.vy = 0;
          entity.onGround = true;
          return;
        }
      }
    }
  }

  if (entity.vy !== 0) {
    entity.onGround = false;
  }
}
