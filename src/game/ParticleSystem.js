// Enhanced Particle System with Object Pooling
// Creates particle effects for jumps and collectible collection

class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.size = 0;
    this.life = 0;
    this.decay = 0;
    this.color = "#ffffff";
    this.active = false;
  }

  init(x, y, color) {
    this.x = x;
    this.y = y;
    this.velocityX = (Math.random() - 0.5) * 6;
    this.velocityY = (Math.random() - 0.5) * 6 - 2; // Slight upward bias
    this.size = Math.random() * 3 + 1;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.015;
    this.color = color;
    this.active = true;
  }

  update() {
    if (!this.active) return false;

    this.x += this.velocityX;
    this.y += this.velocityY;
    this.velocityY += 0.15; // Gravity
    this.velocityX *= 0.98; // Air resistance
    this.life -= this.decay;

    if (this.life <= 0) {
      this.active = false;
      return false;
    }
    return true;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(poolSize = 200, maxPoolSize = poolSize * 2) {
    // Object pool for particles
    this.pool = [];
    this.activeParticles = [];
    this.maxPoolSize = maxPoolSize;

    // Pre-allocate particle pool
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(new Particle());
    }
  }

  // Get a particle from the pool, or null if exhausted and at the cap
  getParticle() {
    // Try to reuse an inactive particle
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }

    // Expand the pool for a burst, up to the cap
    if (this.pool.length >= this.maxPoolSize) return null;
    const particle = new Particle();
    this.pool.push(particle);
    return particle;
  }

  // Create burst of particles for jump effect
  createJumpParticles(x, y) {
    const color = "#00ffff";
    const count = 8;

    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;
      particle.init(x, y, color);
      this.activeParticles.push(particle);
    }
  }

  // Create burst of particles for collectible collection
  createCollectParticles(x, y) {
    const color = "#ffff00";
    const count = 12;

    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;
      particle.init(x, y, color);
      this.activeParticles.push(particle);
    }
  }

  // Create impact particles for bullet hits (platforms/enemies)
  createBulletImpactParticles(x, y, color = "#00ffff") {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;
      particle.init(x, y, color);
      // Slightly sharper burst
      particle.velocityX *= 1.3;
      particle.velocityY *= 1.3;
      this.activeParticles.push(particle);
    }
  }

  // Create enemy death particles
  createEnemyDeathParticles(x, y, color = "#ff3333") {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;
      particle.init(x, y, color);
      particle.size *= 1.2;
      this.activeParticles.push(particle);
    }
  }

  // Update all active particles
  update() {
    // Update and filter out inactive particles
    this.activeParticles = this.activeParticles.filter((particle) =>
      particle.update(),
    );
  }

  // Draw all active particles
  draw(ctx) {
    for (let i = 0; i < this.activeParticles.length; i++) {
      this.activeParticles[i].draw(ctx);
    }
  }

  // Clear all particles
  clear() {
    // Deactivate all particles
    this.activeParticles.forEach((p) => (p.active = false));
    this.activeParticles = [];
  }

  // Get active particle count (for debugging)
  getActiveCount() {
    return this.activeParticles.length;
  }
}
