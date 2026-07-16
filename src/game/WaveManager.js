// WaveManager.js
// Wave-based enemy spawning for challenge/survival mode

export class WaveManager {
  constructor() {
    this.wave = 0;
    this.betweenWaves = true;
    this.countdown = 90; // 1.5s before wave 1
  }

  // Call every frame; returns an action object
  update(enemies) {
    const alive = enemies.filter((e) => e.active).length;

    if (this.betweenWaves) {
      this.countdown--;
      if (this.countdown <= 0) {
        this.wave++;
        this.betweenWaves = false;
        return { action: "START_WAVE", wave: this.wave };
      }
      return { action: "COUNTDOWN", remaining: Math.ceil(this.countdown / 60) };
    }

    if (alive === 0) {
      this.betweenWaves = true;
      this.countdown = 180; // 3s between waves
      return { action: "WAVE_CLEARED", wave: this.wave };
    }

    return { action: "WAVE_ACTIVE", alive };
  }

  generateSpawnList(wave) {
    const count = 3 + (wave - 1) * 2; // wave 1: 3, wave 2: 5, …
    const types =
      wave <= 2 ? ["fast", "patrol"]
      : wave <= 4 ? ["fast", "patrol", "flying"]
      : wave <= 6 ? ["patrol", "flying", "ranged"]
      : ["flying", "ranged", "tank", "jumper"];

    const positions = [
      { x: 70,   y: 510 },
      { x: 1090, y: 510 },
      { x: 60,   y: 375 },
      { x: 1050, y: 375 },
      { x: 580,  y: 295 },
      { x: 350,  y: 505 },
      { x: 850,  y: 505 },
    ];

    const spawns = [];
    for (let i = 0; i < count; i++) {
      const pos = positions[i % positions.length];
      const type = types[Math.floor(Math.random() * types.length)];
      spawns.push({
        type,
        x: pos.x + (Math.random() - 0.5) * 40,
        y: pos.y - 40,
      });
    }
    return spawns;
  }
}
