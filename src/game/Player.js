// Enhanced Player (Cube) Class
// Handles player movement, jumping, gravity, and collision detection
// Features: smooth acceleration, coyote time, jump buffering

export class Player {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = 0;
    this.velocityY = 0;

    // Movement properties with acceleration
    this.speed = 9.5;          // fast
    this.acceleration = 0.68;  // smooth ease-in (reaches full speed in ~5 frames)
    this.friction = 0.80;      // fluid glide to stop
    this.targetVelocityX = 0;

    // Jump properties
    this.jumpPower = 18;       // compensates for stronger gravity
    this.gravity = 0.95;       // heavier, non-floaty
    this.maxFallSpeed = 28;    // fast falling
    this.isGrounded = false;

    // Coyote time: allows jumping shortly after leaving a platform
    this.coyoteTime = 0;
    this.coyoteTimeMax = 6; // frames

    // Jump buffering: registers jump input slightly before landing
    this.jumpBuffer = 0;
    this.jumpBufferMax = 6; // frames

    // Visual properties
    this.color = "#00ffff"; // Neon cyan
    this.glowColor = "#00ffff";

    // Landing properties
    this.wasGrounded = false;
    this.landingImpact = 0;

    // Previous-frame integer position — used for robust collision entry direction
    this.prevX = x;
    this.prevY = y;

    // Double jump system - counter-based for reliability
    this.maxJumps = 2;
    this.jumpsRemaining = this.maxJumps;

    // Jump key tracking
    this.jumpKeyWasDown = false;

    // Ammo system
    this.ammo = 30;
    this.maxAmmo = 30;
    this.ammoType = "normal";
    this.explosiveAmmo = 0;
    this.piercingAmmo = 0;

    // Respawn system
    this.isRespawning = false;
    this.respawnTimer = 0;
  }

  // Update player position and apply physics
  update(input, platforms) {
    // Store previous grounded state
    this.wasGrounded = this.isGrounded;

    // Smooth horizontal movement with acceleration
    this.targetVelocityX = 0;
    if (input.keys.left) {
      this.targetVelocityX = -this.speed;
    }
    if (input.keys.right) {
      this.targetVelocityX = this.speed;
    }

    // Apply acceleration/deceleration
    if (this.targetVelocityX !== 0) {
      this.velocityX +=
        (this.targetVelocityX - this.velocityX) * this.acceleration;
    } else {
      this.velocityX *= this.friction; // Apply friction
    }

    // Round to zero if very small
    if (Math.abs(this.velocityX) < 0.1) {
      this.velocityX = 0;
    }

    // Update coyote time (grace period for jumping shortly after leaving platform)
    if (this.isGrounded) {
      this.coyoteTime = this.coyoteTimeMax;
    } else if (this.coyoteTime > 0) {
      this.coyoteTime--;
    }

    // Once the coyote window expires with no jump taken, the "grounded" jump
    // slot is spent — only the remaining air jump(s) are still available.
    if (
      !this.isGrounded &&
      this.coyoteTime === 0 &&
      this.jumpsRemaining === this.maxJumps
    ) {
      this.jumpsRemaining = this.maxJumps - 1;
    }

    // Register a fresh jump press into the buffer so it still fires if it
    // arrives slightly before landing or before an air jump frees up.
    if (input.keys.jump && !this.jumpKeyWasDown) {
      this.jumpBuffer = this.jumpBufferMax;
    }
    this.jumpKeyWasDown = input.keys.jump;

    // Reset jumps when grounded
    if (this.isGrounded) {
      this.jumpsRemaining = this.maxJumps;
    }

    // Jump logic - fire on a buffered press as soon as a jump is available
    if (this.jumpBuffer > 0 && this.jumpsRemaining > 0) {
      this.velocityY = -this.jumpPower;
      this.jumpsRemaining--;
      this.isGrounded = false;
      this.coyoteTime = 0;
      this.jumpBuffer = 0;
      return true; // Signal jump occurred
    } else if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
    }

    // Apply gravity
    if (!this.isGrounded) {
      this.velocityY += this.gravity;
      if (this.velocityY > this.maxFallSpeed) {
        this.velocityY = this.maxFallSpeed;
      }
    }

    // Store integer position before movement so resolveCollision knows entry direction
    this.prevX = this.x;
    this.prevY = this.y;

    // Update position (using integers for better performance)
    this.x = Math.round(this.x + this.velocityX);
    this.y = Math.round(this.y + this.velocityY);

    // Check collisions with platforms
    this.isGrounded = false;
    let landed = false;
    for (let platform of platforms) {
      if (this.checkCollision(platform)) {
        landed = this.resolveCollision(platform) || landed;
      }
    }

    // Calculate landing impact for screen shake
    if (landed && !this.wasGrounded && this.velocityY > 10) {
      this.landingImpact = Math.min(this.velocityY * 0.3, 5);
    } else {
      this.landingImpact *= 0.8; // Decay
    }

    // Update respawn timer
    if (this.respawnTimer > 0) {
      this.respawnTimer--;
      if (this.respawnTimer === 0) {
        this.isRespawning = false;
      }
    }

    return false;
  }

  // Check if player overlaps a platform
  checkCollision(platform) {
    return (
      this.x         <  platform.x + platform.width  &&
      this.x + this.width  >  platform.x             &&
      this.y         <  platform.y + platform.height  &&
      this.y + this.height >= platform.y              // >= so bottom-flush doesn't fall through
    );
  }

  // Resolve collision using the previous-frame position to determine entry direction.
  // This prevents the "smallest-overlap" approach from pushing the player sideways when
  // they land near the edge of a floating platform.
  resolveCollision(platform) {
    const platTop    = platform.y;
    const platBottom = platform.y + platform.height;
    const platLeft   = platform.x;
    const platRight  = platform.x + platform.width;

    const prevBottom = this.prevY + this.height;
    const prevTop    = this.prevY;
    const prevRight  = this.prevX + this.width;
    const prevLeft   = this.prevX;

    let landed = false;

    if (prevBottom <= platTop) {
      // Entered from above → land on top
      this.y = platTop - this.height;
      this.velocityY = 0;
      this.isGrounded = true;
      landed = true;
    } else if (prevTop >= platBottom) {
      // Entered from below → bump head
      this.y = platBottom;
      this.velocityY = 0;
    } else if (prevRight <= platLeft) {
      // Entered from the left → push left
      this.x = platLeft - this.width;
      this.velocityX = 0;
    } else if (prevLeft >= platRight) {
      // Entered from the right → push right
      this.x = platRight;
      this.velocityX = 0;
    }

    return landed;
  }

  // Check if player is collecting a collectible
  collectItem(collectible) {
    return (
      this.x < collectible.x + collectible.size &&
      this.x + this.width > collectible.x &&
      this.y < collectible.y + collectible.size &&
      this.y + this.height > collectible.y
    );
  }

  // Render player with neon glow effect
  draw(ctx) {
    // Draw glow
    ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.005) * 5;
    ctx.shadowColor = this.glowColor;

    ctx.fillStyle = this.color;

    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  // Check if player can shoot
  canShoot() {
    return this.getCurrentAmmo() > 0;
  }

  // Fire a bullet and decrement ammo
  shoot() {
    if (!this.canShoot()) return false;

    if (this.explosiveAmmo > 0) {
      this.explosiveAmmo--;
      if (this.explosiveAmmo === 0) this.ammoType = "normal";
      return "explosive";
    } else if (this.piercingAmmo > 0) {
      this.piercingAmmo--;
      if (this.piercingAmmo === 0) this.ammoType = "normal";
      return "piercing";
    } else {
      this.ammo--;
      return "normal";
    }
  }

  // Get current ammo count
  getCurrentAmmo() {
    if (this.explosiveAmmo > 0) return this.explosiveAmmo;
    if (this.piercingAmmo > 0) return this.piercingAmmo;
    return this.ammo;
  }

  // Get current ammo type
  getCurrentAmmoType() {
    if (this.explosiveAmmo > 0) return "explosive";
    if (this.piercingAmmo > 0) return "piercing";
    return "normal";
  }

  // Add ammo power-up
  addAmmo(type, amount) {
    switch (type) {
      case "explosive":
        this.explosiveAmmo += amount;
        this.ammoType = "explosive";
        break;
      case "piercing":
        this.piercingAmmo += amount;
        this.ammoType = "piercing";
        break;
      default:
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
        break;
    }
  }

  // Respawn at checkpoint
  respawnAt(x, y) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.targetVelocityX = 0;
    this.isRespawning = true;
    this.respawnTimer = 30;
    this.isGrounded = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
  }

  // Reset player to starting position
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.targetVelocityX = 0;
    this.isGrounded = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    this.landingImpact = 0;
    this.jumpsRemaining = this.maxJumps;
    this.jumpKeyWasDown = false;
    this.ammo = 30;
    this.explosiveAmmo = 0;
    this.piercingAmmo = 0;
    this.ammoType = "normal";
    this.isRespawning = false;
    this.respawnTimer = 0;
  }
}
