// Checkpoint System
// Save points throughout the level

export class Checkpoint {
  constructor(x, y, id, platform = null) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.width = 50;
    this.height = 70;
    this.activated = false;
    this.pulsePhase = 0;
    this.inRange = false;
    
    // Platform attachment
    this.platform = platform;
    this.relativeX = platform ? x - platform.x : 0;
    this.relativeY = platform ? y - platform.y : 0;
    
    if (platform) {
      platform.attachItem(this);
    }
  }

  update(player) {
    this.pulsePhase += 0.08;

    // Sync position with platform if attached
    if (this.platform) {
      this.x = this.platform.x + this.relativeX;
      this.y = this.platform.y + this.relativeY;
    }

    // Check if player is in range
    const distance = Math.hypot(
      (player.x + player.width / 2) - (this.x + this.width / 2),
      (player.y + player.height / 2) - (this.y + this.height / 2)
    );
    this.inRange = distance < 60;

    // Activate on collision
    const touching = player.x < this.x + this.width &&
                     player.x + player.width > this.x &&
                     player.y < this.y + this.height &&
                     player.y + player.height > this.y;

    if (touching && !this.activated) {
      this.activate();
      return true;
    }

    return false;
  }

  activate() {
    this.activated = true;
  }

  draw(ctx) {
    ctx.save();

    const pulse = Math.sin(this.pulsePhase) * 5 + 15;
    ctx.shadowBlur = pulse;

    if (this.activated) {
      ctx.shadowColor = "#00ff00";
      ctx.fillStyle = "#00ff00";
    } else {
      ctx.shadowColor = "#666666";
      ctx.fillStyle = "#444444";
    }

    // Draw checkpoint pole
    ctx.fillRect(this.x + 20, this.y, 10, this.height);

    // Draw checkpoint flag
    ctx.beginPath();
    ctx.moveTo(this.x + 30, this.y + 10);
    ctx.lineTo(this.x + 50, this.y + 20);
    ctx.lineTo(this.x + 30, this.y + 30);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.inRange && !this.activated) {
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CHECKPOINT", this.x + 25, this.y - 10);
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  }
  
  getRespawnX() {
    return this.x;
  }
  
  getRespawnY() {
    return this.y - 50;
  }
}

// Create one checkpoint per explicit checkpoint platform, in order.
export function createCheckpoints(checkpointPlatforms) {
  return checkpointPlatforms.map((platform, index) => {
    const x = platform.x + platform.width / 2 - 25;
    const y = platform.y - 70;
    return new Checkpoint(x, y, index, platform);
  });
}
