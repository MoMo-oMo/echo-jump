// Bullet Pool
// Object pooling for bullets to avoid GC

import { Bullet } from "./Bullet";

export class BulletPool {
  constructor(size = 50, maxSize = size * 2) {
    this.pool = [];
    this.activeBullets = [];
    this.maxSize = maxSize;

    // Pre-allocate bullets
    for (let i = 0; i < size; i++) {
      this.pool.push(new Bullet());
    }
  }

  // Get bullet from pool, or null if the pool is exhausted and at its cap
  getBullet() {
    // Try to find inactive bullet in pool
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }

    // Expand the pool for a burst, up to the cap
    if (this.pool.length >= this.maxSize) return null;
    const bullet = new Bullet();
    this.pool.push(bullet);
    return bullet;
  }

  // Spawn a bullet
  spawn(x, y, direction, upgrades) {
    const bullet = this.getBullet();
    if (!bullet) return null;
    bullet.init(x, y, direction, upgrades);
    this.activeBullets.push(bullet);
    return bullet;
  }

  // Spawn a bullet with explicit velocity vector
  spawnDirectional(x, y, vx, vy, upgrades) {
    const bullet = this.getBullet();
    if (!bullet) return null;
    bullet.initDirectional(x, y, vx, vy, upgrades);
    this.activeBullets.push(bullet);
    return bullet;
  }

  // Update all bullets
  update() {
    this.activeBullets = this.activeBullets.filter((bullet) => bullet.update());
  }

  // Draw all bullets
  draw(ctx) {
    this.activeBullets.forEach((bullet) => bullet.draw(ctx));
  }

  // Get active bullets for collision detection
  getActiveBullets() {
    return this.activeBullets;
  }

  // Clear all bullets
  clear() {
    this.activeBullets.forEach((bullet) => bullet.deactivate());
    this.activeBullets = [];
  }

  // Get pool size (for debugging)
  getPoolSize() {
    return this.pool.length;
  }

  getActiveCount() {
    return this.activeBullets.length;
  }
}
