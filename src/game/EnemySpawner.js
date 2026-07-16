// Enemy Spawner System
// Pre-places enemies at level creation, activates them as the player advances

import { createEnemy } from "./EnemyTypes";

export class EnemySpawner {
  // spawnPoints: [{x, y, type}] — pre-computed by the caller (LevelGenerator
  // for normal mode, or pushed manually for challenge mode).
  constructor(spawnPoints) {
    this.enemies = [];
    this.spawnPoints = spawnPoints.map((sp) => ({ ...sp, active: false }));
    this.maxActiveEnemies = 24;

    // Pre-spawn all enemies immediately so they're in the world from the start
    for (const sp of this.spawnPoints) {
      const enemy = createEnemy(sp.type, sp.x, sp.y);
      this.enemies.push(enemy);
      sp.active = true;
    }
  }

  // All enemies are pre-spawned; just cull dead ones each frame
  update(_cameraX, _playerX) {
    this.enemies = this.enemies.filter((e) => e.active);
  }

  updateEnemies(player, platforms, enemyBulletPool, soundManager) {
    for (const enemy of this.enemies) {
      if (enemy.fadeIn && enemy.alpha < 1) {
        enemy.alpha = Math.min(1, enemy.alpha + 0.02);
        if (enemy.alpha >= 1) enemy.fadeIn = false;
      }
      enemy.update(player, platforms, enemyBulletPool, soundManager);
    }
  }

  drawEnemies(ctx) {
    for (const enemy of this.enemies) enemy.draw(ctx);
  }

  getEnemies() {
    return this.enemies.filter((e) => e.active);
  }

  clear() {
    this.enemies = [];
  }

  reset() {
    this.clear();
    for (const sp of this.spawnPoints) sp.active = false;
  }
}
