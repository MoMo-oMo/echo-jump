// Base Enemy Class
// All enemy types inherit from this

export class Enemy {
  constructor(x, y, type = "basic") {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.velocityX = 0;
    this.velocityY = 0;
    this.health = 30;
    this.maxHealth = 30;
    this.damage = 10;
    this.speed = 2;
    this.active = true;
    this.type = type;
    this.color = "#ff0000";
    this.glowColor = "#ff0000";
    this.coinValue = 5;
    this.isGrounded = false;
    this.gravity = 0.6;
    this.shootCooldown = 0;
    this.shootInterval = 120; // frames
    this.lastShootTime = 0;
    this.canFly = false;
    this.aggroRange = 400;
    this.attackRange = 50;
    this.alertTimer = 0;

    // Navigation state set by subclass before super.update() so edge-check reads it
    this.dropping   = false; // true → skip edge reversal so enemy walks off float
    this.jumpPower  = 0;     // > 0 → subclass can jump
    this.jumpCooldown = 0;
  }

  update(player, platforms) {
    if (!this.active) return false;

    // Edge detection — skip when subclass flagged a deliberate drop
    if (!this.canFly && this.isGrounded && !this.dropping) {
      if (!this.checkGroundAhead(platforms)) {
        this.velocityX *= -1;
      }
    }

    // Jump cooldown tick
    if (this.jumpCooldown > 0) this.jumpCooldown--;

    // Apply gravity if not flying
    if (!this.canFly && !this.isGrounded) {
      this.velocityY += this.gravity;
      if (this.velocityY > 15) this.velocityY = 15;
    }

    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Check platform collisions for ground enemies
    if (!this.canFly) {
      this.isGrounded = false;
      platforms.forEach((platform) => {
        if (this.checkPlatformCollision(platform)) {
          this.resolvePlatformCollision(platform);
        }
      });
    }

    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    return true;
  }

  // Check collision with platform
  checkPlatformCollision(platform) {
    return (
      this.x < platform.x + platform.width &&
      this.x + this.width > platform.x &&
      this.y < platform.y + platform.height &&
      this.y + this.height > platform.y
    );
  }

  // Resolve platform collision
  resolvePlatformCollision(platform) {
    const overlapTop = this.y + this.height - platform.y;
    const overlapBottom = platform.y + platform.height - this.y;

    if (overlapTop < overlapBottom && this.velocityY > 0) {
      this.y = platform.y - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
    }
  }

  // Take damage
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      return true; // Enemy died
    }
    return false;
  }

  // Check if can shoot
  canShoot() {
    return this.shootCooldown === 0;
  }

  // Reset shoot cooldown
  resetShootCooldown() {
    this.shootCooldown = this.shootInterval;
  }

  // Check if there's ground immediately ahead (edge detection for patrol)
  checkGroundAhead(platforms) {
    const direction = this.velocityX > 0 ? 1 : -1;
    const sensorX = this.x + (direction > 0 ? this.width + 10 : -10);
    const sensorY = this.y + this.height + 5;
    for (let platform of platforms) {
      if (sensorX >= platform.x &&
          sensorX <= platform.x + platform.width &&
          sensorY >= platform.y &&
          sensorY <= platform.y + platform.height + 20) {
        return true;
      }
    }
    return false;
  }

  // Returns true only if there is a non-spike platform to land on within
  // dropRange pixels below the edge the enemy would step off.
  // Used to gate the `dropping` flag so enemies don't walk into voids.
  hasPlatformBelow(platforms, dirX, dropRange = 280) {
    const edgeX = dirX >= 0 ? this.x + this.width + 4 : this.x - 4;
    const feetY = this.y + this.height;
    for (const p of platforms) {
      if (p.hasSpikes) continue;
      // Platform must be horizontally reachable from the drop edge
      if (edgeX >= p.x - 8 && edgeX <= p.x + p.width + 8) {
        // And must be below but within drop range
        if (p.y >= feetY && p.y <= feetY + dropRange) {
          return true;
        }
      }
    }
    return false;
  }

  // Get distance to player
  getDistanceToPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Check if enemy has line of sight to player (no platforms blocking)
  hasLineOfSightToPlayer(player, platforms) {
    const ex = this.x + this.width / 2;
    const ey = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    // Simple raycast - check if any platforms block the line
    const dx = px - ex;
    const dy = py - ey;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(10, Math.floor(dist / 10));
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 1; i < steps; i++) {
      const checkX = ex + stepX * i;
      const checkY = ey + stepY * i;

      // Check if this point intersects any platform
      for (const platform of platforms) {
        // Skip boss room walls (they're very tall and shouldn't block line of sight for gameplay)
        if (platform.height > 100) continue;
        
        if (
          checkX >= platform.x &&
          checkX <= platform.x + platform.width &&
          checkY >= platform.y &&
          checkY <= platform.y + platform.height
        ) {
          return false; // Line of sight blocked
        }
      }
    }

    return true; // Clear line of sight
  }

  // Draw enemy
  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // Apply fade-in alpha if needed
    if (this.alpha !== undefined) {
      ctx.globalAlpha = this.alpha;
    }

    // Draw shadow/glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.glowColor;

    // Draw enemy body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Draw health bar
    this.drawHealthBar(ctx);

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  // Draw health bar above enemy
  drawHealthBar(ctx) {
    const barWidth = this.width;
    const barHeight = 4;
    const barX = this.x;
    const barY = this.y - 10;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor =
      healthPercent > 0.5
        ? "#00ff00"
        : healthPercent > 0.25
        ? "#ffff00"
        : "#ff0000";
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  // Check collision with player
  checkPlayerCollision(player) {
    return (
      this.active &&
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y
    );
  }
}


