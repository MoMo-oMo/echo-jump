// Ammo pickup that looks like a bullet cartridge
export class AmmoPickup {
  constructor(x, y, amount = 10, platform = null) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 22;
    this.amount = amount;
    this.collected = false;
    this.t = Math.random() * Math.PI * 2;
    
    // Platform attachment
    this.platform = platform;
    this.relativeX = platform ? x - platform.x : 0;
    this.relativeY = platform ? y - platform.y : 0;
    
    if (platform) {
      platform.attachItem(this);
    }
  }

  update() {
    this.t += 0.05;
    this.bob = Math.sin(this.t) * 2;
    
    // Sync position with platform if attached
    if (this.platform) {
      this.x = this.platform.x + this.relativeX;
      this.y = this.platform.y + this.relativeY;
    }
  }

  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(0, this.bob || 0);
    
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffd166";

    ctx.fillStyle = "#d4af37";
    ctx.fillRect(this.x, this.y, this.width, this.height - 6);

    ctx.fillStyle = "#c1440e";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.width / 2, this.y - 6);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#b3922f";
    ctx.fillRect(this.x - 1, this.y + this.height - 10, this.width + 2, 4);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height - 6);
    ctx.restore();
  }

  intersectsPlayer(player) {
    return (
      !this.collected &&
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    );
  }
}

// Create ammo pickups evenly distributed across safe platforms.
export function createAmmoPickups(platforms, count = 8) {
  const pickups = [];
  const valid = platforms.filter(
    (p) => p.width >= 120 && p.height <= 100 && p.x > 400 && !p.hasSpikes && p.type !== "moving"
  );

  if (valid.length === 0) return pickups;

  const step = Math.max(1, Math.floor(valid.length / count));
  for (let i = 0; i < valid.length && pickups.length < count; i += step) {
    const platform = valid[i];
    const x = platform.x + platform.width / 2 - 5;
    const y = platform.y - 26;
    pickups.push(new AmmoPickup(x, y, 12, platform));
  }

  return pickups;
}





