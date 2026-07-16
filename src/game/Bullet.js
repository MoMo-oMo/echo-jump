// Bullet Class
// Represents projectiles fired by player

export class Bullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 8;
    this.height = 3;
    this.velocityX = 0;
    this.velocityY = 0;
    this.active = false;
    this.damage = 10;
    this.isExplosive = false;
    this.isArmorPiercing = false;
    this.color = "#00ffff";
    this.glowColor = "#00ffff";
    this.trail = [];
    this.maxTrailLength = 5;
    this.distanceTraveled = 0;
    this.maxDistance = 10000;
    this.speed = 0;
    this.bulletGravity = 0;
  }

  init(x, y, direction, upgrades = {}) {
    this.x = x;
    this.y = y;
    this.velocityX = direction * 28;
    this.velocityY = 0;
    this.active = true;
    this.trail = [];
    this.distanceTraveled = 0;
    this.speed = 28;
    this.maxDistance = upgrades.maxDistance ?? 660;
    this.bulletGravity = upgrades.gravity ?? 0.26;

    // Apply upgrades
    this.damage = upgrades.damage || 10;
    this.isExplosive = upgrades.explosive || false;
    this.isArmorPiercing = upgrades.armorPiercing || false;

    // Visual feedback for upgrades
    if (this.isExplosive) {
      this.color = "#ff6600"; // Orange for explosive
      this.glowColor = "#ff6600";
      this.width = 10;
    } else if (this.isArmorPiercing) {
      this.color = "#ff00ff"; // Magenta for armor piercing
      this.glowColor = "#ff00ff";
    } else {
      this.color = "#00ffff"; // Default cyan
      this.glowColor = "#00ffff";
      this.width = 8;
    }
  }

  // Initialize with explicit velocity vector (for mouse-aimed shots)
  initDirectional(x, y, vx, vy, upgrades = {}) {
    this.x = x;
    this.y = y;
    this.velocityX = vx;
    this.velocityY = vy;
    this.active = true;
    this.trail = [];
    this.distanceTraveled = 0;
    this.speed = Math.hypot(vx, vy);
    this.maxDistance = upgrades.maxDistance ?? 10000;
    this.bulletGravity = upgrades.gravity ?? 0.26;

    // Apply upgrades
    this.damage = upgrades.damage || 10;
    this.isExplosive = upgrades.explosive || false;
    this.isArmorPiercing = upgrades.armorPiercing || false;

    // Visual feedback for upgrades
    if (this.isExplosive) {
      this.color = "#ff6600";
      this.glowColor = "#ff6600";
      this.width = 10;
    } else if (this.isArmorPiercing) {
      this.color = "#ff00ff";
      this.glowColor = "#ff00ff";
    } else {
      this.color = "#00ffff";
      this.glowColor = "#00ffff";
      this.width = 8;
    }
  }

  update() {
    if (!this.active) return false;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) this.trail.shift();

    // Arc: gravity pulls bullet downward each frame
    this.velocityY += this.bulletGravity;

    this.x += this.velocityX;
    this.y += this.velocityY;

    this.distanceTraveled += this.speed;
    if (this.distanceTraveled >= this.maxDistance) {
      this.active = false;
      return false;
    }

    // Deactivate when the bullet drops below ground level or flies off screen
    if (this.x < -100 || this.x > 12000 || this.y < -100 || this.y > 610) {
      this.active = false;
      return false;
    }

    return true;
  }

  draw(ctx) {
    if (!this.active) return;

    // Draw trail
    ctx.save();
    this.trail.forEach((pos, index) => {
      const alpha = (index + 1) / this.trail.length;
      ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
      ctx.fillRect(pos.x, pos.y, this.width * 0.6, this.height * 0.6);
    });

    // Draw bullet with glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.glowColor;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Extra glow for special bullets
    if (this.isExplosive || this.isArmorPiercing) {
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  // Check collision with rectangle (enemy)
  checkCollision(target) {
    return (
      this.active &&
      this.x < target.x + target.width &&
      this.x + this.width > target.x &&
      this.y < target.y + target.height &&
      this.y + this.height > target.y
    );
  }

  deactivate() {
    this.active = false;
    this.trail = [];
  }
}
