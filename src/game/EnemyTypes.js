// Enemy Type Definitions
// Different enemy behaviors and stats

import { Enemy } from "./Enemy";

// ── Shared navigation helper ──────────────────────────────────────────────────
// y threshold below which the enemy is considered to be on a floating platform.
// Ground floor is at y=550; any enemy with bottom < 544 is on a float.
const GROUND_SURFACE = 544;

function isOnFloat(enemy) {
  return enemy.isGrounded && enemy.y + enemy.height < GROUND_SURFACE;
}

// FAST RUNNER - Quick, low health, chases player; can drop off floats & jump up
export class FastRunner extends Enemy {
  constructor(x, y) {
    super(x, y, "fast");
    this.width  = 25;
    this.height = 25;
    this.health = 20;
    this.maxHealth = 20;
    this.damage = 5;
    this.speed  = 4;
    this.color  = "#ff3333";
    this.glowColor = "#ff0000";
    this.coinValue = 3;
    this.aggroRange = 500;
    this.jumpPower  = 13; // can jump to reach higher platforms
  }

  update(player, platforms) {
    const dist = this.getDistanceToPlayer(player);
    const inRange = dist < this.aggroRange;

    // ── Navigation decisions (set before super so edge-check reads them) ──
    if (inRange) {
      const playerBelow = player.y > this.y + 60;
      const playerAbove = player.y + player.height < this.y - 20;

      // Drop from float only when a lower platform actually exists below the edge
      this.dropping = playerBelow && isOnFloat(this) &&
        this.hasPlatformBelow(platforms, player.x > this.x ? 1 : -1);

      // Jump toward player when they're significantly above
      if (playerAbove && this.isGrounded && this.jumpCooldown === 0) {
        this.velocityY = -this.jumpPower;
        this.isGrounded = false;
        this.jumpCooldown = 55 + Math.floor(Math.random() * 30);
      }
    } else {
      this.dropping = false;
    }

    super.update(player, platforms);
    if (!this.active) return false;

    if (inRange) {
      this.velocityX = (player.x > this.x ? 1 : -1) * this.speed;
    } else {
      this.velocityX *= 0.9;
    }

    return true;
  }
}

// FLYING ENEMY - Hovers and shoots
export class FlyingEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, "flying");
    this.width = 30;
    this.height = 25;
    this.health = 25;
    this.maxHealth = 25;
    this.damage = 8;
    this.speed = 2;
    this.color = "#9933ff";
    this.glowColor = "#6600cc";
    this.coinValue = 5;
    this.canFly = true;
    this.shootInterval = 90;
    this.aggroRange = 600;
    this.hoverHeight = y;
    this.hoverPhase = Math.random() * Math.PI * 2;
    this.burst = 0;
  }

  update(player, platforms, enemyBulletPool, soundManager) {
    if (!this.active) return false;

    const distanceToPlayer = this.getDistanceToPlayer(player);

    if (distanceToPlayer < this.aggroRange) {
      const direction = player.x > this.x ? 1 : -1;
      this.velocityX = direction * this.speed;

      this.hoverPhase += 0.05;
      this.y = this.hoverHeight + Math.sin(this.hoverPhase) * 15;
    } else {
      this.velocityX *= 0.95;
    }

    this.x += this.velocityX;

    // Horizontal and vertical platform collision for flying enemies
    if (platforms && platforms.length) {
      for (const plat of platforms) {
        if (plat.height > 120) continue; // skip arena walls
        const py = plat.y, ph = plat.height, px = plat.x, pw = plat.width;

        const overlapX = this.x + this.width > px && this.x < px + pw;
        const overlapY = this.y + this.height > py && this.y < py + ph;

        if (overlapX && overlapY) {
          // Determine which axis has less overlap and push out
          const dLeft   = this.x + this.width - px;
          const dRight  = px + pw - this.x;
          const dTop    = this.y + this.height - py;
          const dBottom = py + ph - this.y;
          const minH = Math.min(dLeft, dRight);
          const minV = Math.min(dTop, dBottom);

          if (minH < minV) {
            // Push horizontally
            if (dLeft < dRight) { this.x = px - this.width; } else { this.x = px + pw; }
            this.velocityX *= -0.5;
          } else {
            // Push vertically (usually push up above platform)
            if (dTop < dBottom) {
              this.y = py - this.height;
              this.hoverHeight = this.y; // anchor hover above this platform
            } else {
              this.y = py + ph;
              this.hoverHeight = this.y;
            }
          }
        }
      }
    }

    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    // Shoot toward player with slight delay
    if (distanceToPlayer < this.aggroRange && this.canShoot()) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const ex = this.x + this.width / 2;
      const ey = this.y + this.height / 2;
      const dx = px - ex;
      const dy = py - ey;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 12;
      const vx = (dx / len) * speed;
      const vy = (dy / len) * speed;
      if (enemyBulletPool) enemyBulletPool.spawnDirectional(ex, ey, vx, vy, { color: "#66ccff", maxDistance: 480, gravity: 0.22 });
      if (soundManager) soundManager.playSound("shoot");
      this.resetShootCooldown();
    }

    return true;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // Apply fade-in alpha if needed
    if (this.alpha !== undefined) {
      ctx.globalAlpha = this.alpha;
    }

    // Flying enemy has different shape (diamond)
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.glowColor;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height / 2);
    ctx.lineTo(this.x + this.width / 2, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    this.drawHealthBar(ctx);

    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

// TANK ENEMY - Slow, high health, heavy damage
export class TankEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, "tank");
    this.width = 45;
    this.height = 45;
    this.health = 80;
    this.maxHealth = 80;
    this.damage = 20;
    this.speed = 1;
    this.color = "#00ff88";
    this.glowColor = "#00cc66";
    this.coinValue = 10;
    this.aggroRange = 300;
  }

  update(player, platforms) {
    const dist    = this.getDistanceToPlayer(player);
    const inRange = dist < this.aggroRange;

    // Tanks drop from floats but never jump — too heavy
    this.dropping = inRange && player.y > this.y + 60 && isOnFloat(this) &&
      this.hasPlatformBelow(platforms, player.x > this.x ? 1 : -1);

    super.update(player, platforms);
    if (!this.active) return false;

    if (inRange) {
      this.velocityX = (player.x > this.x ? 1 : -1) * this.speed;
    } else {
      this.velocityX *= 0.8;
    }

    return true;
  }
}

// RANGED ENEMY - Keeps distance and shoots
export class RangedEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, "ranged");
    this.width = 28;
    this.height = 28;
    this.health = 30;
    this.maxHealth = 30;
    this.damage = 12;
    this.speed = 1.5;
    this.color = "#ff9900";
    this.glowColor = "#ff6600";
    this.coinValue = 7;
    this.shootInterval = 70;
    this.aggroRange = 700;
    this.keepDistance = 250;
  }

  update(player, platforms, enemyBulletPool, soundManager) {
    const distanceToPlayer = this.getDistanceToPlayer(player);
    const inRange = distanceToPlayer < this.aggroRange;

    // Drop from floats to stay at shooting range on the same level as player
    this.dropping = inRange && player.y > this.y + 60 && isOnFloat(this) &&
      this.hasPlatformBelow(platforms, player.x > this.x ? 1 : -1);

    super.update(player, platforms);
    if (!this.active) return false;

    if (inRange) {
      if (distanceToPlayer < this.keepDistance) {
        this.velocityX = (player.x > this.x ? -1 : 1) * this.speed;
      } else if (distanceToPlayer > this.keepDistance + 100) {
        this.velocityX = (player.x > this.x ? 1 : -1) * this.speed;
      } else {
        this.velocityX *= 0.9;
      }
    } else {
      this.velocityX *= 0.85;
    }

    // Fire bursts when LOS and roughly in distance band
    if (
      distanceToPlayer < this.aggroRange &&
      this.hasLineOfSightToPlayer(player, platforms) &&
      this.canShoot()
    ) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const ex = this.x + this.width / 2;
      const ey = this.y + this.height / 2;
      const dx = px - ex;
      const dy = py - ey;
      const speed = 14;
      const spread = 0.15;
      const baseAngle = Math.atan2(dy, dx);
      for (let i = -1; i <= 1; i++) {
        const a = baseAngle + i * spread;
        const vx = Math.cos(a) * speed;
        const vy = Math.sin(a) * speed;
        if (enemyBulletPool)
          enemyBulletPool.spawnDirectional(ex, ey, vx, vy, { color: "#ffaa33", maxDistance: 530, gravity: 0.22 });
      }
      if (soundManager) soundManager.playSound("shoot");
      this.resetShootCooldown();
    }

    return true;
  }
}

// PATROLLING ENEMY - walks back and forth and chases on sight
export class PatrollingEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, "patrol");
    this.width = 28;
    this.height = 28;
    this.health = 30;
    this.maxHealth = 30;
    this.speed = 1.8;
    this.patrolSpeed = 1.6;
    this.color = "#33ffaa";
    this.glowColor = "#00cc88";
    this.aggroRange = 450;
    this.patrolDirection = 1; // 1 = right, -1 = left
    this.patrolDistance = 0;
    this.maxPatrolDistance = 150;
    this.alertTimer = 0;
    this.facing = 1;
  }

  // Patrol behavior - walk back and forth
  patrol(platforms) {
    this.patrolDistance += Math.abs(this.velocityX);
    
    // Check for edges or obstacles
    const checkX = this.x + (this.patrolDirection > 0 ? this.width + 5 : -5);
    const checkY = this.y + this.height + 5;
    
    let hasGround = false;
    for (const platform of platforms) {
      if (
        checkX >= platform.x &&
        checkX <= platform.x + platform.width &&
        checkY >= platform.y &&
        checkY <= platform.y + platform.height
      ) {
        hasGround = true;
        break;
      }
    }
    
    // Turn around if at edge, hit wall, or reached max patrol distance
    if (!hasGround || this.patrolDistance >= this.maxPatrolDistance) {
      this.patrolDirection *= -1;
      this.patrolDistance = 0;
    }
    
    this.velocityX = this.patrolDirection * this.patrolSpeed;
    this.facing = this.patrolDirection;
  }

  update(player, platforms, _enemyBulletPool, soundManager) {
    if (this.alertTimer > 0) this.alertTimer--;

    const dist    = this.getDistanceToPlayer(player);
    const inRange = dist < this.aggroRange;
    const hasSight = inRange && this.hasLineOfSightToPlayer(player, platforms);

    // ── Navigation decisions before super ────────────────────────────────
    if (hasSight) {
      // Drop from float only when a landing platform exists below the edge
      this.dropping = player.y > this.y + 60 && isOnFloat(this) &&
        this.hasPlatformBelow(platforms, player.x > this.x ? 1 : -1);
    } else {
      this.dropping = false;
    }

    super.update(player, platforms);
    if (!this.active) return false;

    if (hasSight) {
      if (this.alertTimer === 0) {
        this.alertTimer = 40;
        if (soundManager) soundManager.playSound("alert");
      }
      const dir = player.x > this.x ? 1 : -1;
      this.velocityX = dir * this.speed;
      this.facing = dir;
      this.patrolDistance = 0;
    } else {
      // Stop dropping when out of sight and resume patrol
      this.patrol(platforms);
    }
    return true;
  }
}

// JUMPING ENEMY - hops occasionally; jumps toward player when near
export class JumpingEnemy extends Enemy {
  constructor(x, y) {
    super(x, y, "jumper");
    this.width = 26;
    this.height = 26;
    this.health = 24;
    this.maxHealth = 24;
    this.speed = 1.5;
    this.jumpPower = 12;
    this.jumpCooldown = 0;
    this.color = "#ff66cc";
    this.glowColor = "#ff33aa";
    this.aggroRange = 400;
  }

  update(player, platforms, _enemyBulletPool, soundManager) {
    const dist     = this.getDistanceToPlayer(player);
    const inRange  = dist < this.aggroRange;
    const hasSight = inRange && this.hasLineOfSightToPlayer(player, platforms);

    // Drop from floats when player is below and a lower platform exists to land on
    this.dropping = inRange && player.y > this.y + 60 && isOnFloat(this) &&
      this.hasPlatformBelow(platforms, player.x > this.x ? 1 : -1);

    super.update(player, platforms);
    if (!this.active) return false;

    if (hasSight) {
      if (this.alertTimer === 0) {
        this.alertTimer = 40;
        if (soundManager) soundManager.playSound("alert");
      }
      const dir = player.x > this.x ? 1 : -1;
      this.velocityX = dir * this.speed;
      // Jump toward player — skip jump cooldown tick (base class handles it)
      if (this.isGrounded && this.jumpCooldown === 0) {
        this.velocityY = -this.jumpPower;
        this.jumpCooldown = 50 + Math.floor(Math.random() * 30);
      }
    } else {
      if (this.isGrounded && this.jumpCooldown === 0) {
        this.velocityY = -this.jumpPower * 0.7;
        this.jumpCooldown = 90 + Math.floor(Math.random() * 60);
        this.velocityX *= 0.5;
      }
      this.velocityX *= 0.95;
    }
    return true;
  }
}

// Factory function
export function createEnemy(type, x, y) {
  switch (type) {
    case "patrol":
      return new PatrollingEnemy(x, y);
    case "jumper":
      return new JumpingEnemy(x, y);
    case "fast":
      return new FastRunner(x, y);
    case "flying":
      return new FlyingEnemy(x, y);
    case "tank":
      return new TankEnemy(x, y);
    case "ranged":
      return new RangedEnemy(x, y);
    default:
      return new FastRunner(x, y);
  }
}
