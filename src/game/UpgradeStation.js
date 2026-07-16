// Upgrade Station
// Allows player to spend coins on upgrades

export class UpgradeStation {
  constructor(x, y, platform = null) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 80;
    this.color = "#00ffff";
    this.glowColor = "#00ffff";
    this.pulsePhase = 0;
    this.active = true;
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
    this.pulsePhase += 0.05;

    // Sync position with platform if attached
    if (this.platform) {
      this.x = this.platform.x + this.relativeX;
      this.y = this.platform.y + this.relativeY;
    }

    // Check if player is in range
    const distance = Math.hypot(player.x - this.x, player.y - this.y);
    this.inRange = distance < 100;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    const pulse = Math.sin(this.pulsePhase) * 10 + 20;
    ctx.shadowBlur = pulse;
    ctx.shadowColor = this.glowColor;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "#003333";
    ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);

    ctx.fillStyle = this.inRange ? "#ffff00" : "#00ffff";
    ctx.fillRect(this.x + 20, this.y + 30, this.width - 40, this.height - 50);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    if (this.inRange) {
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("UPGRADE", this.x + this.width / 2, this.y - 15);
      ctx.fillText("Press [E]", this.x + this.width / 2, this.y - 5);
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  isPlayerInRange() {
    return this.inRange;
  }
}

// Upgrade definitions
export const UPGRADES = {
  ammoCapacity: {
    name: "Ammo Capacity",
    levels: [
      { cost: 10, value: 50 },
      { cost: 20, value: 75 },
      { cost: 30, value: 100 },
    ],
  },
  damage: {
    name: "Weapon Damage",
    levels: [
      { cost: 15, value: 15 },
      { cost: 25, value: 20 },
      { cost: 40, value: 30 },
    ],
  },
  armorPiercing: {
    name: "Armor Piercing",
    cost: 45,
    description: "Bullets pass through enemies",
  },
  explosive: {
    name: "Explosive Rounds",
    cost: 55,
    description: "AOE damage on hit",
  },
  health: {
    name: "Max Health",
    levels: [
      { cost: 12, value: 120 },
      { cost: 22, value: 150 },
      { cost: 35, value: 200 },
    ],
  },
};

// Create upgrade stations from explicit {platform} specs
export function createUpgradeStations(upgradeStationSpecs) {
  return upgradeStationSpecs.map(({ platform }) => {
    const stW = 60;
    const pad = 16;
    // Place right-of-centre but clamp so the station never overhangs the edge
    const rawX = platform.x + platform.width / 2 + 60;
    const x = Math.min(rawX, platform.x + platform.width - stW - pad);
    const y = platform.y - 82;
    return new UpgradeStation(x, y, platform);
  });
}
