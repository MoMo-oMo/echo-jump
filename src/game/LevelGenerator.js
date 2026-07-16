// Procedural Level Generator (normal mode)
// Deterministic: the same seed always produces the same platforms, checkpoints,
// upgrade stations, and enemy placements — required so a saved seed can be
// regenerated identically on Continue.

import { Platform } from "./Platform";

const G = 550; // ground surface y (matches ChallengeArena/EndingFlag/HUD assumptions)
const H = 50; // platform height
const SAFE_ZONE = 350; // no hazards/enemies before this x, matches old level's tutorial buffer

// ─── Seeded PRNG (mulberry32) ───────────────────────────────────────────────
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed() {
  return Math.floor(Math.random() * 0xffffffff);
}

function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

function randInt(rng, min, max) {
  return Math.floor(randRange(rng, min, max + 1));
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Difficulty tier from progress fraction (0..1)
function tierFor(fraction) {
  if (fraction < 0.33) return 0;
  if (fraction < 0.66) return 1;
  return 2;
}

const ENEMY_POOL_BY_TIER = [
  ["patrol", "fast"],
  ["patrol", "fast", "ranged", "flying"],
  ["ranged", "flying", "tank", "jumper"],
];

const SPAWN_CHANCE_BY_TIER = [0.2, 0.28, 0.35];

export function generateLevel(seed) {
  const rng = makeRng(seed);
  const levelLength = randInt(rng, 6000, 8000);

  const platforms = [];
  const checkpointPlatforms = [];
  const enemySpawnPoints = [];
  const spawnTriggerSpecs = [];
  const sections = [];

  let cursorX = 0;
  let sinceCheckpoint = 0;
  let nextCheckpointAt = randInt(rng, 1000, 1300);
  let sectionStart = 0;
  let sectionIndex = 1;

  // ── Starting platform — always safe, matches player spawn (100, 400) ──────
  const startWidth = 500;
  platforms.push(new Platform(0, G, startWidth, H));
  cursorX = startWidth;

  function eligibleForSpawn(platform) {
    return (
      platform.x >= SAFE_ZONE &&
      platform.width >= 100 &&
      platform.height <= 100 &&
      platform.type !== "moving" &&
      !platform.hasSpikes
    );
  }

  function maybeSpawnEnemy(platform, tier) {
    if (!eligibleForSpawn(platform)) return;
    if (rng() >= SPAWN_CHANCE_BY_TIER[tier]) return;
    enemySpawnPoints.push({
      type: pick(rng, ENEMY_POOL_BY_TIER[tier]),
      x: platform.x + platform.width / 2,
      y: platform.y - 40,
    });
  }

  function placeCheckpoint(tier) {
    const width = randInt(rng, 260, 350);
    const gap = randInt(rng, 40, 70);
    const x = cursorX + gap;
    const platform = new Platform(x, G, width, H);
    platforms.push(platform);
    checkpointPlatforms.push(platform);
    cursorX = x + width;
    sinceCheckpoint = 0;
    nextCheckpointAt = randInt(rng, 1000, 1300);

    // Ambush cluster shortly after the checkpoint (skip for the very first one)
    if (checkpointPlatforms.length > 1) {
      const enemies = [];
      const count = randInt(rng, 2, tier >= 2 ? 3 : 2);
      for (let i = 0; i < count; i++) {
        const type = pick(rng, ENEMY_POOL_BY_TIER[tier]);
        const isFlying = type === "flying";
        enemies.push({
          x: x + 120 + i * 140 + randInt(rng, -20, 20),
          y: isFlying ? G - 170 : G - 40,
          type,
        });
      }
      spawnTriggerSpecs.push({
        x: x - 40,
        y: G - 200,
        width: 260,
        height: 250,
        enemies,
      });
    }

    return platform;
  }

  function placeGround(tier) {
    const width = randInt(rng, 140, 260);
    const gap = randInt(rng, 60, 100);
    const x = cursorX + gap;
    const platform = new Platform(x, G, width, H);
    platforms.push(platform);
    cursorX = x + width;
    maybeSpawnEnemy(platform, tier);
  }

  function placeFloatChain(tier) {
    const groundWidth = randInt(rng, 130, 200);
    const gap = randInt(rng, 70, 100);
    const groundX = cursorX + gap;
    const ground = new Platform(groundX, G, groundWidth, H);
    platforms.push(ground);
    cursorX = groundX + groundWidth;
    maybeSpawnEnemy(ground, tier);

    const floatWidth = randInt(rng, 90, 140);
    const floatY = randInt(rng, 350, 420);
    const floatX = groundX + randInt(rng, 40, 90);
    const float = new Platform(floatX, floatY, floatWidth, H);
    platforms.push(float);
  }

  function placeSpikeTrap() {
    const width = randInt(rng, 110, 140);
    const gap = randInt(rng, 80, 110); // guarantees clear space on the approach side
    const x = cursorX + gap;
    const platform = new Platform(x, G, width, H, "normal", {
      hasSpikes: true,
      spikeCount: randInt(rng, 3, 4),
    });
    platforms.push(platform);
    cursorX = x + width;
  }

  function placeMovingBridge(tier) {
    const width = randInt(rng, 100, 140);
    const gap = randInt(rng, 90, 130);
    const x = cursorX + gap;
    const sweep = randInt(rng, 70, 120);
    const dx = randRange(rng, 1.8, 2.6);
    const platform = new Platform(x, G - 70, width, H, "moving", {
      dx,
      minX: x,
      maxX: x + sweep,
    });
    platforms.push(platform);
    cursorX = x + width + sweep;

    // Enemies don't spawn on the moving platform itself — place one on the
    // ground just past the sweep instead, same odds as a normal platform.
    if (rng() < SPAWN_CHANCE_BY_TIER[tier]) {
      enemySpawnPoints.push({
        type: pick(rng, ENEMY_POOL_BY_TIER[tier]),
        x: x + width + sweep - 20,
        y: G - 40,
      });
    }
  }

  // ── Main generation loop ───────────────────────────────────────────────
  while (cursorX < levelLength - 400) {
    sinceCheckpoint = cursorX - (checkpointPlatforms.length
      ? checkpointPlatforms[checkpointPlatforms.length - 1].x
      : 0);
    const fraction = cursorX / levelLength;
    const tier = tierFor(fraction);

    if (sinceCheckpoint >= nextCheckpointAt) {
      sections.push({
        name: `Section ${sectionIndex}`,
        start: sectionStart,
        end: cursorX,
        progress: Math.min(0.95, fraction),
      });
      sectionStart = cursorX;
      sectionIndex++;
      placeCheckpoint(tier);
      continue;
    }

    const choices =
      tier === 0
        ? ["ground", "ground", "float"]
        : tier === 1
          ? ["ground", "float", "spike", "moving"]
          : ["ground", "float", "spike", "moving", "moving"];

    const choice = pick(rng, choices);
    if (choice === "ground") placeGround(tier);
    else if (choice === "float") placeFloatChain(tier);
    else if (choice === "spike") placeSpikeTrap();
    else placeMovingBridge(tier);
  }

  // ── Ending platform + barrier wall ─────────────────────────────────────
  const endWidth = 350;
  const endGap = randInt(rng, 60, 90);
  const endX = cursorX + endGap;
  platforms.push(new Platform(endX, G, endWidth, H));
  const finalLength = endX + endWidth;
  platforms.push(new Platform(finalLength + 5, 0, 20, 600)); // barrier wall

  sections.push({
    name: `Section ${sectionIndex}`,
    start: sectionStart,
    end: finalLength,
    progress: 1.0,
  });

  // Two upgrade stations, evenly spaced by checkpoint index
  const upgradeStationSpecs = [];
  if (checkpointPlatforms.length >= 2) {
    const idxA = Math.max(0, Math.floor(checkpointPlatforms.length / 3));
    const idxB = Math.min(
      checkpointPlatforms.length - 1,
      Math.floor((checkpointPlatforms.length * 2) / 3),
    );
    const seen = new Set();
    [idxA, idxB].forEach((idx) => {
      if (seen.has(idx)) return;
      seen.add(idx);
      upgradeStationSpecs.push({ platform: checkpointPlatforms[idx] });
    });
  }

  return {
    seed,
    platforms,
    levelLength: finalLength,
    sections,
    checkpointPlatforms,
    upgradeStationSpecs,
    enemySpawnPoints,
    spawnTriggerSpecs,
  };
}
