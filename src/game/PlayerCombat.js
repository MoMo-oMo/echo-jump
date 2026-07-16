// Enhanced Combat Player Class
// Extends base player with health, shooting, and combat

import { Player } from "./Player";

export class CombatPlayer extends Player {
  constructor(x, y, width, height) {
    super(x, y, width, height);

    // Combat stats
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    this.invincible = false;
    this.invincibilityTimer = 0;
    this.invincibilityDuration = 60; // 1 second at 60fps

    // Shooting
    this.ammo = 30;
    this.maxAmmo = 30;
    this.reserveAmmo = 120; // Reserve ammo pool
    this.shootCooldown = 0;
    this.shootDelay = 10; // frames between shots
    this.facingDirection = 1; // 1 = right, -1 = left

    // Upgrades
    this.upgrades = {
      ammoCapacityLevel: 0,
      damageLevel: 0,
      healthLevel: 0,
      armorPiercing: false,
      explosive: false,
    };

    // Double jump system
    this.jumpsRemaining = this.maxJumps;
    this.maxJumps = 2;

    // Jump key tracking
    this.jumpKeyWasDown = false;

    // Coins
    this.coins = 0;
  }

  update(input, platforms) {
    // Call parent update for movement
    const jumped = super.update(input, platforms);

    // Update facing direction based on movement
    if (input.keys.left) {
      this.facingDirection = -1;
    } else if (input.keys.right) {
      this.facingDirection = 1;
    }

    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }

    // Update invincibility
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer--;
      if (this.invincibilityTimer === 0) {
        this.invincible = false;
      }
    }

    return jumped;
  }

  // Shoot bullet with mouse aiming
  shoot(bulletPool, mouseX, mouseY) {
    if (this.shootCooldown === 0 && this.ammo > 0) {
      this.ammo--;
      this.shootCooldown = this.shootDelay;

      // Player center and aim vector toward mouse
      const px = this.x + this.width / 2;
      const py = this.y + this.height / 2;
      const dx = mouseX - px;
      const dy = mouseY - py;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;

      // Muzzle position from player edge in aim direction
      const muzzleOffset = Math.max(this.width, this.height) / 2 + 6;
      const spawnX = px + ux * muzzleOffset;
      const spawnY = py + uy * muzzleOffset;

      // Bullet speed and velocity
      const speed = 15;
      const vx = ux * speed;
      const vy = uy * speed;

      // Get damage based on upgrades
      const damage = 10 + this.upgrades.damageLevel * 5;

      // Spawn bullet with upgrades
      bulletPool.spawnDirectional(spawnX, spawnY, vx, vy, {
        damage: damage,
        armorPiercing: this.upgrades.armorPiercing,
        explosive: this.upgrades.explosive,
      });

      return true; // Shot fired
    }
    return false;
  }

  // Can shoot
  canShoot() {
    return this.shootCooldown === 0 && this.ammo > 0;
  }

  // Take damage
  takeDamage(amount) {
    if (this.invincible || !this.isAlive) return false;

    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      return true; // Player died
    }

    // Trigger invincibility
    this.invincible = true;
    this.invincibilityTimer = this.invincibilityDuration;

    return false;
  }

  // Heal player
  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  // Add coins
  addCoins(amount) {
    this.coins += amount;
  }

  // Add ammo to reserve
  addAmmo(amount) {
    this.reserveAmmo += amount;
  }

  // Reload from reserve ammo; returns true if reloaded
  reload() {
    if (this.ammo >= this.maxAmmo || this.reserveAmmo <= 0) return false;

    // Calculate how much ammo we need to fill the magazine
    const ammoNeeded = this.maxAmmo - this.ammo;
    const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);

    // Consume from reserve and add to current ammo
    this.reserveAmmo -= ammoToReload;
    this.ammo += ammoToReload;

    this.shootCooldown = this.shootDelay; // brief delay after reload
    return true;
  }

  // Apply upgrade
  applyUpgrade(upgradeType, level) {
    switch (upgradeType) {
      case "ammoCapacity":
        this.upgrades.ammoCapacityLevel = level;
        this.maxAmmo = 30 + level * 25;
        // Don't auto-fill ammo on upgrade, let player reload manually
        break;
      case "damage":
        this.upgrades.damageLevel = level;
        break;
      case "health":
        this.upgrades.healthLevel = level;
        this.maxHealth = 100 + level * 30;
        this.health = this.maxHealth;
        break;
      case "armorPiercing":
        this.upgrades.armorPiercing = true;
        break;
      case "explosive":
        this.upgrades.explosive = true;
        break;
    }
  }

  // Override draw to show combat state
  draw(ctx) {
    if (!this.isAlive) return;

    // Blink when invincible
    if (this.invincible && Math.floor(this.invincibilityTimer / 5) % 2 === 0) {
      return; // Skip drawing for blink effect
    }

    // Draw glow
    ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.005) * 5;
    ctx.shadowColor = this.glowColor;

    // Change color based on state
    if (this.invincible) {
      ctx.fillStyle = "#ffff00"; // Yellow when invincible
    } else {
      ctx.fillStyle = this.color;
    }

    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Removed red weapon indicator; rotating gun is drawn in the canvas render

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  // Respawn at checkpoint
  respawn(checkpointX, checkpointY) {
    this.x = checkpointX;
    this.y = checkpointY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.health = this.maxHealth;
    this.ammo = this.maxAmmo;
    this.reserveAmmo = Math.max(this.reserveAmmo, 60); // Ensure minimum reserve ammo on respawn
    this.isAlive = true;
    this.invincible = true;
    this.invincibilityTimer = 120; // 2 seconds of invincibility after respawn
  }

  // Reset for new game
  reset(x, y) {
    super.reset(x, y);
    this.health = this.maxHealth;
    this.ammo = this.maxAmmo;
    this.reserveAmmo = 120; // Reset reserve ammo
    this.isAlive = true;
    this.invincible = false;
    this.invincibilityTimer = 0;
    this.shootCooldown = 0;
    this.facingDirection = 1;
  }
}
