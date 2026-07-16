// Collectible Class
// Glowing collectible items (coins/cubes) that increase score

export class Collectible {
  constructor(x, y, platform = null) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.collected = false;
    this.color = "#ffff00"; // Neon yellow
    this.glowColor = "#ffff00";
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.05;
    this.rotationAngle = 0;
    this.rotationSpeed = 0.05;
    
    // Platform attachment
    this.platform = platform;
    this.relativeX = platform ? x - platform.x : 0;
    this.relativeY = platform ? y - platform.y : 0;
    
    if (platform) {
      platform.attachItem(this);
    }
  }

  update() {
    if (!this.collected) {
      this.pulsePhase += this.pulseSpeed;
      this.rotationAngle += this.rotationSpeed;
      
      // Sync position with platform if attached
      if (this.platform) {
        this.x = this.platform.x + this.relativeX;
        this.y = this.platform.y + this.relativeY;
      }
    }
  }

  draw(ctx) {
    if (this.collected) return;

    const pulse = Math.sin(this.pulsePhase) * 5 + 15;

    ctx.save();
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotationAngle);

    ctx.shadowBlur = pulse;
    ctx.shadowColor = this.glowColor;
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-this.size / 4, -this.size / 4, this.size / 2, this.size / 2);

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  collect() {
    this.collected = true;
  }
}

// Create collectibles placed relative to platforms.
// Coins spawn in small rows on eligible platforms; never on spikes or moving platforms.
export function createCollectibles(platforms = []) {
  const collectibles = [];
  const COIN_Y_OFFSET = 24; // px above platform surface

  platforms.forEach((platform, idx) => {
    // Skip tiny, spike, moving, and platforms too close to start
    if (platform.hasSpikes) return;
    if (platform.type === "moving") return;
    if (platform.width < 120 || platform.height > 100) return;
    if (platform.x < 400) return;

    // Deterministic selection — every 3rd eligible platform gets coins
    if (idx % 3 !== 0) return;

    const coinCount = platform.width >= 200 ? 3 : 2;
    const spacing = Math.min((platform.width - 40) / (coinCount + 1), 48);

    for (let i = 1; i <= coinCount; i++) {
      const x = platform.x + 20 + spacing * i;
      const y = platform.y - COIN_Y_OFFSET;
      collectibles.push(new Collectible(x, y, platform));
    }
  });

  return collectibles;
}
