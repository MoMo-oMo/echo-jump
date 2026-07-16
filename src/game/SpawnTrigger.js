// Spawn Trigger System
// Fires one-time enemy waves when the player walks into a zone

export class SpawnTrigger {
  constructor(x, y, width, height, spawnData) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.spawnData = spawnData;
    this.triggered = false;
  }

  checkTrigger(player) {
    if (this.triggered) return false;
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    if (cx >= this.x && cx <= this.x + this.width &&
        cy >= this.y && cy <= this.y + this.height) {
      this.triggered = true;
      return true;
    }
    return false;
  }

  getSpawnData() {
    return this.spawnData;
  }
}
