// Enemy Bullet and Pool

class EnemyBullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 6;
    this.height = 3;
    this.vx = 0;
    this.vy = 0;
    this.active = false;
    this.color = "#ff6666";
    this.glowColor = "#ff3333";
    this.gravity = 0; // some types may have arc
    this.spawnX = 0;
    this.spawnY = 0;
    this.maxDistance = 0;
  }

  initDirectional(x, y, vx, vy, opts = {}) {
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.vx = vx;
    this.vy = vy;
    this.active = true;
    if (opts.color) {
      this.color = opts.color;
      this.glowColor = opts.color;
    }
    this.gravity = opts.gravity || 0;
    this.maxDistance = opts.maxDistance || 0;
  }

  update() {
    if (!this.active) return false;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -100 || this.x > 10000 || this.y < -100 || this.y > 1000) {
      this.active = false;
      return false;
    }
    if (this.maxDistance > 0) {
      const dx = this.x - this.spawnX;
      const dy = this.y - this.spawnY;
      if (dx * dx + dy * dy > this.maxDistance * this.maxDistance) {
        this.active = false;
        return false;
      }
    }
    return true;
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.glowColor;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  deactivate() {
    this.active = false;
  }
}

export class EnemyBulletPool {
  constructor(size = 60, maxSize = size * 2) {
    this.pool = [];
    this.active = [];
    this.maxSize = maxSize;
    for (let i = 0; i < size; i++) this.pool.push(new EnemyBullet());
  }
  getBullet() {
    for (let i = 0; i < this.pool.length; i++) if (!this.pool[i].active) return this.pool[i];
    if (this.pool.length >= this.maxSize) return null;
    const b = new EnemyBullet();
    this.pool.push(b);
    return b;
  }
  spawnDirectional(x, y, vx, vy, opts) {
    const b = this.getBullet();
    if (!b) return null;
    b.initDirectional(x, y, vx, vy, opts);
    this.active.push(b);
    return b;
  }
  update() {
    this.active = this.active.filter((b) => b.update());
  }
  draw(ctx) {
    this.active.forEach((b) => b.draw(ctx));
  }
  getActive() {
    return this.active;
  }
  clear() {
    this.active.forEach((b) => b.deactivate());
    this.active = [];
  }
}





