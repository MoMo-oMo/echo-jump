// ChallengeArena.js
// Box-like survival arena for challenge mode

import { Platform } from "./Platform";
import { UpgradeStation } from "./UpgradeStation";

// Arena is 1200 × 600 — matches the canvas so camera stays locked at (0,0)
export function createChallengeArena() {
  const platforms = [];

  // Floor (full width)
  platforms.push(new Platform(0, 550, 1200, 50));

  // Side walls (invisible boundaries kept thin so they don't visually intrude)
  platforms.push(new Platform(-40, 0, 40, 600));   // left wall
  platforms.push(new Platform(1200, 0, 40, 600));  // right wall

  // Left ledges
  platforms.push(new Platform(30, 420, 160, 25));  // [3] left low
  platforms.push(new Platform(30, 265, 160, 25));  // [4] left high ← upgrade station here

  // Right ledges
  platforms.push(new Platform(1010, 420, 160, 25)); // [5] right low
  platforms.push(new Platform(1010, 265, 160, 25)); // [6] right high

  // Centre platform
  platforms.push(new Platform(515, 330, 170, 25));  // [7] centre

  return platforms;
}

// Upgrade station sits on the left high ledge (index 4)
export function createArenaUpgradeStation(platforms) {
  const shelf = platforms[4];
  const x = shelf.x + shelf.width / 2 - 30;
  const y = shelf.y - 80;
  return new UpgradeStation(x, y, shelf);
}
