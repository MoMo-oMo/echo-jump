<template>
  <v-container class="game-container" fluid>
    <!-- Canvas + Crosshair -->
    <div class="canvas-wrapper">
      <canvas
        ref="gameCanvas"
        :width="canvasWidth"
        :height="canvasHeight"
        class="game-canvas"
        @mousemove="onMouseMove"
        @mouseenter="mouseOver = true"
        @mouseleave="mouseOver = false"
      ></canvas>

      <div
        v-if="mouseOver"
        class="crosshair"
        :style="{ left: mouseCanvasX + 'px', top: mouseCanvasY + 'px' }"
      ></div>
    </div>

    <!-- HUD (hidden during challenge-over overlay) -->
    <GameHUD
      v-if="!isPaused && !showUpgradeMenu && !challengeOver"
      :player="player"
      :kills="kills"
      :deaths="deaths"
      :notification="notification"
      :progress-percent="challengeMode ? 0 : progressPercent"
    />

    <!-- Pause Menu -->
    <PauseMenu
      v-if="isPaused"
      :stats="{ coins: player?.coins || 0, kills, deaths }"
      :settings="settings"
      @resume="togglePause"
      @checkpoint="respawnAtCheckpoint"
      @main-menu="$emit('return-to-menu')"
      @settings-changed="updateSettings"
    />

    <!-- Upgrade Menu (plain overlay — v-dialog breaks scoped CSS via teleport) -->
    <div v-if="showUpgradeMenu" class="upgrade-overlay" @click.self="showUpgradeMenu = false">
      <div class="upgrade-content">
        <h2>UPGRADE STATION</h2>
        <p class="coins-display">💰 {{ player.coins }} coins</p>

        <div class="upgrades-list">
          <!-- Ammo Refill -->
          <div class="upgrade-item">
            <h3>Reserve Ammo</h3>
            <p>Reserve: {{ player.reserveAmmo }}</p>
            <button @click="buyAmmo" :disabled="!canAfford(15)" class="upg-btn">
              +40 Ammo — 15 coins
            </button>
          </div>

          <!-- Ammo Capacity -->
          <div class="upgrade-item">
            <h3>Ammo Capacity</h3>
            <p>Level {{ player.upgrades.ammoCapacityLevel }} / 3</p>
            <button
              v-if="player.upgrades.ammoCapacityLevel < 3"
              @click="purchaseUpgrade('ammoCapacity')"
              :disabled="!canAfford(getUpgradeCost('ammoCapacity'))"
              class="upg-btn"
            >Upgrade — {{ getUpgradeCost("ammoCapacity") }} coins</button>
            <span v-else class="maxed">MAX</span>
          </div>

          <!-- Damage -->
          <div class="upgrade-item">
            <h3>Weapon Damage</h3>
            <p>Level {{ player.upgrades.damageLevel }} / 3</p>
            <button
              v-if="player.upgrades.damageLevel < 3"
              @click="purchaseUpgrade('damage')"
              :disabled="!canAfford(getUpgradeCost('damage'))"
              class="upg-btn"
            >Upgrade — {{ getUpgradeCost("damage") }} coins</button>
            <span v-else class="maxed">MAX</span>
          </div>

          <!-- Health -->
          <div class="upgrade-item">
            <h3>Max Health</h3>
            <p>Level {{ player.upgrades.healthLevel }} / 3</p>
            <button
              v-if="player.upgrades.healthLevel < 3"
              @click="purchaseUpgrade('health')"
              :disabled="!canAfford(getUpgradeCost('health'))"
              class="upg-btn"
            >Upgrade — {{ getUpgradeCost("health") }} coins</button>
            <span v-else class="maxed">MAX</span>
          </div>

          <!-- Armor Piercing -->
          <div class="upgrade-item special">
            <h3>Armor Piercing</h3>
            <p>Bullets pass through enemies</p>
            <button
              v-if="!player.upgrades.armorPiercing"
              @click="purchaseUpgrade('armorPiercing')"
              :disabled="!canAfford(UPGRADES.armorPiercing.cost)"
              class="upg-btn special-btn"
            >Buy — {{ UPGRADES.armorPiercing.cost }} coins</button>
            <span v-else class="owned">OWNED</span>
          </div>

          <!-- Explosive -->
          <div class="upgrade-item special">
            <h3>Explosive Rounds</h3>
            <p>AOE damage on impact</p>
            <button
              v-if="!player.upgrades.explosive"
              @click="purchaseUpgrade('explosive')"
              :disabled="!canAfford(UPGRADES.explosive.cost)"
              class="upg-btn special-btn"
            >Buy — {{ UPGRADES.explosive.cost }} coins</button>
            <span v-else class="owned">OWNED</span>
          </div>
        </div>

        <button @click="showUpgradeMenu = false" class="close-upgrade">CLOSE [E]</button>
      </div>
    </div>

    <!-- Level Complete (normal mode only) -->
    <v-dialog
      v-if="levelComplete && !challengeMode"
      :model-value="true"
      class="complete-screen"
      max-width="500"
    >
      <v-card class="complete-content">
        <h1>LEVEL COMPLETE!</h1>
        <p>Kills: {{ kills }}</p>
        <p>Deaths: {{ deaths }}</p>
        <p>Coins: {{ player?.coins || 0 }}</p>
        <v-btn @click="$emit('return-to-menu')" class="menu-btn">RETURN TO MENU</v-btn>
      </v-card>
    </v-dialog>

    <!-- Challenge Over Screen -->
    <div v-if="challengeOver" class="challenge-over-overlay">
      <div class="challenge-over-card">
        <h1>CHALLENGE OVER</h1>
        <div class="score-item">
          <span class="score-label">WAVE REACHED</span>
          <span class="score-value">{{ challengeWave }}</span>
        </div>
        <div class="score-item">
          <span class="score-label">KILLS</span>
          <span class="score-value">{{ kills }}</span>
        </div>
        <div class="score-item">
          <span class="score-label">SURVIVED</span>
          <span class="score-value">{{ formatTime(challengeTimer) }}</span>
        </div>
        <div class="over-btn-group">
          <button class="over-btn" @click="restartChallenge">PLAY AGAIN</button>
          <button class="over-btn secondary" @click="$emit('return-to-menu')">MAIN MENU</button>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { CombatPlayer } from "../game/PlayerCombat";
import { generateLevel, generateSeed } from "../game/LevelGenerator";
import { createChallengeArena, createArenaUpgradeStation } from "../game/ChallengeArena";
import { createCollectibles } from "../game/Collectible";
import { Camera } from "../game/Camera";
import { Input } from "../game/Input";
import { Background } from "../game/Background";
import { ParticleSystem } from "../game/ParticleSystem";
import { ScreenShake } from "../game/ScreenShake";
import { BulletPool } from "../game/BulletPool";
import { EnemyBulletPool } from "../game/EnemyBulletPool";
import { EnemySpawner } from "../game/EnemySpawner";
import { createUpgradeStations, UPGRADES } from "../game/UpgradeStation";
import { createCheckpoints } from "../game/Checkpoint";
import { SaveManager } from "../game/SaveManager";
import { SoundManager } from "../game/SoundManager";
import { SpawnTrigger } from "../game/SpawnTrigger";
import { createEnemy } from "../game/EnemyTypes";
import { ScreenFade } from "../game/ScreenFade";
import { cloneDefaultGameSettings } from "../game/settingsDefaults";
import { createAmmoPickups } from "../game/AmmoPickup";
import { createEndingFlag } from "../game/EndingFlag";
import { WaveManager } from "../game/WaveManager";
import GameHUD from "./GameHUD.vue";
import PauseMenu from "./PauseMenu.vue";

export default {
  name: "CombatGame",
  components: { GameHUD, PauseMenu },
  props: {
    challengeMode: Boolean,
    continueGame: Boolean,
    settings: {
      type: Object,
      default: () => cloneDefaultGameSettings(),
    },
  },
  emits: ["return-to-menu"],
  setup(props) {
    const gameCanvas = ref(null);
    let ctx = null;

    const canvasWidth = ref(1200);
    const canvasHeight = ref(600);

    // Game state
    const isPaused = ref(false);
    const showUpgradeMenu = ref(false);
    const notification = ref("");
    const kills = ref(0);
    const deaths = ref(0);
    const levelLength = ref(0);
    const player = ref(null);
    const reachedCheckpointIds = ref([]);
    const levelComplete = ref(false);

    // Challenge mode state
    const challengeWave = ref(0);
    const challengeTimer = ref(0);
    const waveCountdown = ref(0);
    const challengeOver = ref(false);
    let waveManager = null;

    const checkpointProgressFloor = computed(() => {
      if (!reachedCheckpointIds.value.length || levelLength.value <= 0) return 0;
      const maxId = Math.max(...reachedCheckpointIds.value);
      const checkpoint = checkpoints[maxId];
      if (!checkpoint) return 0;
      return Math.max(0, Math.min(95, (checkpoint.x / levelLength.value) * 100));
    });

    const progressPercent = computed(() => {
      if (!player.value || levelLength.value <= 0) return checkpointProgressFloor.value;
      const raw = (player.value.x / levelLength.value) * 100;
      return Math.max(Math.max(0, Math.min(100, raw)), checkpointProgressFloor.value);
    });

    // Game objects
    let platforms = [];
    let collectibles = [];
    let camera = null;
    let input = null;
    let background = null;
    let particles = null;
    let screenShake = null;
    let bulletPool = null;
    let enemyBulletPool = null;
    let enemySpawner = null;
    let spawnTriggers = [];
    let upgradeStations = [];
    let checkpoints = [];
    let lastCheckpoint = null;
    let isRespawning = false;
    let playerDying = false;  // true from death start until respawn/restart
    let screenFade = null;
    let levelSections = [];
    let saveManager = null;
    let soundManager = null;
    let endingFlag = null;
    let ammoPickups = [];
    let currentSeed = null;

    let animationFrameId = null;

    const mouseOver = ref(false);
    const mouseCanvasX = ref(0);
    const mouseCanvasY = ref(0);

    // Watch for continueGame prop to hot-load save while in-game
    watch(
      () => props.continueGame,
      (newVal) => {
        if (newVal && saveManager && player.value) {
          const saveData = saveManager.loadGame();
          if (saveData) loadGameState(saveData);
        }
      }
    );

    function onMouseMove(e) {
      if (!gameCanvas.value) return;
      const rect = gameCanvas.value.getBoundingClientRect();
      mouseCanvasX.value = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      mouseCanvasY.value = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      if (input) {
        input.mouse.x = e.clientX;
        input.mouse.y = e.clientY;
      }
    }

    function intersectsRect(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    // Splash damage to enemies near an explosive-round impact. Excludes the
    // enemy that was hit directly — it already took the bullet's direct damage.
    function applyExplosionDamage(centerX, centerY, excludeEnemy) {
      const radius = 70;
      const splashDamage = 20;
      enemySpawner.getEnemies().forEach((enemy) => {
        if (enemy === excludeEnemy) return;
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        if (Math.hypot(ex - centerX, ey - centerY) > radius) return;
        const died = enemy.takeDamage(splashDamage);
        if (died) {
          kills.value++;
          player.value.addCoins(enemy.coinValue);
          if (props.challengeMode) player.value.addAmmo(5);
          particles.createEnemyDeathParticles(ex, ey, enemy.glowColor);
        }
      });
    }

    // ─── Init ──────────────────────────────────────────────────────────────────

    function initGame() {
      ctx = gameCanvas.value.getContext("2d", { alpha: false, desynchronized: true });

      saveManager = new SaveManager();
      soundManager = new SoundManager();
      input = new Input();
      background = new Background(canvasWidth.value, canvasHeight.value);
      particles = new ParticleSystem(300);
      screenShake = new ScreenShake();
      bulletPool = new BulletPool(100);
      enemyBulletPool = new EnemyBulletPool(120);
      screenFade = new ScreenFade();

      if (props.challengeMode) {
        // ── Challenge mode ──────────────────────────────────────────────────
        player.value = new CombatPlayer(580, 460, 40, 40);
        platforms = createChallengeArena();
        upgradeStations = [createArenaUpgradeStation(platforms)];
        levelLength.value = 0; // disables progress bar; camera maxX locked to 0
        waveManager = new WaveManager();
        enemySpawner = new EnemySpawner([]); // no auto-spawn points; we push manually
        // no checkpoints, no collectibles, no ammo pickups, no ending flag, no triggers
      } else {
        // ── Normal mode ─────────────────────────────────────────────────────
        player.value = new CombatPlayer(100, 400, 40, 40);

        // Read any existing save first — reuse its seed so Continue regenerates
        // the exact same layout instead of a fresh random one.
        const saveData = saveManager.loadGame();
        currentSeed = saveData && Number.isFinite(saveData.seed) ? saveData.seed : generateSeed();

        const level = generateLevel(currentSeed);
        platforms = level.platforms;
        levelLength.value = level.levelLength;
        levelSections = level.sections;
        collectibles = createCollectibles(platforms);
        checkpoints = createCheckpoints(level.checkpointPlatforms);
        upgradeStations = createUpgradeStations(level.upgradeStationSpecs);
        endingFlag = createEndingFlag(levelLength.value);
        enemySpawner = new EnemySpawner(level.enemySpawnPoints);
        spawnTriggers = level.spawnTriggerSpecs.map(
          (spec) => new SpawnTrigger(spec.x, spec.y, spec.width, spec.height, { enemies: spec.enemies }),
        );
        ammoPickups = createAmmoPickups(platforms, 8);

        if (saveData) loadGameState(saveData);
      }

      camera = new Camera(0, 0, canvasWidth.value, canvasHeight.value);
      camera.setLevelLength(levelLength.value);

      updateSettings(props.settings);
      screenFade.fadeIn(0.08);
      soundManager.startMusic();
      gameLoop();
    }

    // ─── Game loop ─────────────────────────────────────────────────────────────

    const gameLoop = () => {
      update();
      if (!isPaused.value) render();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // ─── Update ────────────────────────────────────────────────────────────────

    const update = () => {
      input.updateJustPressed();

      if (input.justPressed.escape) togglePause();

      // Track if we consumed the interact key so the station doesn't reopen immediately
      let interactConsumed = false;
      if (showUpgradeMenu.value && input.justPressed.interact) {
        showUpgradeMenu.value = false;
        interactConsumed = true;
      }

      if (isPaused.value || showUpgradeMenu.value || !player.value || challengeOver.value) return;

      // Platform movement
      platforms.forEach((p) => p.update());

      // Ammo pickup sync
      ammoPickups.forEach((p) => p.update());

      if (input.justPressed.reload) {
        if (player.value.reload()) soundManager.playSound("powerup");
      }

      // Player movement
      if (player.value.isAlive) {
        const jumped = player.value.update(input, platforms);
        if (jumped) {
          soundManager.playSound("jump");
          particles.createJumpParticles(
            player.value.x + player.value.width / 2,
            player.value.y + player.value.height
          );
        }
      }

      // Challenge mode: hard-clamp player to arena bounds
      if (props.challengeMode) {
        if (player.value.x < 30) {
          player.value.x = 30;
          player.value.velocityX = 0;
          player.value.targetVelocityX = 0;
        }
        if (player.value.x + player.value.width > 1170) {
          player.value.x = 1170 - player.value.width;
          player.value.velocityX = 0;
          player.value.targetVelocityX = 0;
        }
      }

      // Shoot
      if (input.justPressed.shoot && player.value) {
        const mouseWorldX = mouseCanvasX.value + camera.x;
        const mouseWorldY = mouseCanvasY.value + camera.y;
        if (player.value.shoot(bulletPool, mouseWorldX, mouseWorldY)) {
          soundManager.playSound("shoot");
        }
      }

      bulletPool.update();
      enemyBulletPool.update();
      screenShake.update();

      // Enemy spawning / wave logic
      if (props.challengeMode) {
        challengeTimer.value++;

        const result = waveManager.update(enemySpawner.getEnemies());

        if (result.action === "COUNTDOWN") {
          waveCountdown.value = result.remaining;
        } else {
          waveCountdown.value = 0;
        }

        if (result.action === "START_WAVE") {
          challengeWave.value = result.wave;
          waveManager.generateSpawnList(result.wave).forEach((s) => {
            const enemy = createEnemy(s.type, s.x, s.y);
            enemy.alpha = 0;
            enemy.fadeIn = true;
            enemySpawner.enemies.push(enemy);
          });
        }

        if (result.action === "WAVE_CLEARED") {
          showNotification(`Wave ${result.wave} complete!`);
        }
      } else {
        // Normal mode: position-based spawning + triggers
        enemySpawner.update();

        spawnTriggers.forEach((trigger) => {
          if (trigger.checkTrigger(player.value)) {
            const data = trigger.getSpawnData();
            if (data && data.enemies) {
              data.enemies.forEach((ed) => {
                const enemy = createEnemy(ed.type, ed.x, ed.y);
                enemy.alpha = 0;
                enemy.fadeIn = true;
                enemySpawner.enemies.push(enemy);
              });
            }
          }
        });
      }

      enemySpawner.updateEnemies(player.value, platforms, enemyBulletPool, soundManager);

      if (screenFade) screenFade.update();

      // Collect ammo pickups (normal mode only)
      ammoPickups = ammoPickups.filter((pickup) => {
        if (pickup.intersectsPlayer(player.value)) {
          player.value.addAmmo(pickup.amount);
          soundManager.playSound("coin");
          particles.createCollectParticles(pickup.x, pickup.y);
          pickup.collected = true;
          return false;
        }
        return true;
      });

      // Player bullets vs platforms
      const playerBullets = bulletPool.getActiveBullets();
      for (const b of playerBullets) {
        for (const p of platforms) {
          if (intersectsRect(b, p)) {
            particles.createBulletImpactParticles(b.x, b.y, b.glowColor);
            b.deactivate();
            break;
          }
        }
      }

      // Enemy bullets vs platforms
      const eBullets = enemyBulletPool.getActive();
      for (const b of eBullets) {
        for (const p of platforms) {
          if (intersectsRect(b, p)) {
            particles.createBulletImpactParticles(b.x, b.y, b.glowColor);
            b.deactivate();
            break;
          }
        }
      }

      // Bullet vs enemy collisions
      const activeBullets = bulletPool.getActiveBullets();
      const enemies = enemySpawner.getEnemies();

      activeBullets.forEach((bullet) => {
        enemies.forEach((enemy) => {
          if (bullet.checkCollision(enemy)) {
            const died = enemy.takeDamage(bullet.damage);
            if (died) {
              kills.value++;
              player.value.addCoins(enemy.coinValue);
              // In challenge mode enemies drop ammo so player never runs fully dry
              if (props.challengeMode) player.value.addAmmo(5);
              soundManager.playSound("enemyHit");
              particles.createCollectParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              particles.createEnemyDeathParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.glowColor);
              screenShake.shake(3, 8);
            }
            if (bullet.isExplosive) {
              const cx = bullet.x + bullet.width / 2;
              const cy = bullet.y + bullet.height / 2;
              particles.createEnemyDeathParticles(cx, cy, "#ff6600");
              screenShake.shake(6, 12);
              applyExplosionDamage(cx, cy, enemy);
            }
            if (!bullet.isArmorPiercing) bullet.deactivate();
          }
        });
      });

      // Enemy contact damage
      if (!playerDying) {
        enemies.forEach((enemy) => {
          if (enemy.checkPlayerCollision(player.value)) {
            const died = player.value.takeDamage(enemy.damage);
            if (died) {
              handlePlayerDeath();
            } else {
              soundManager.playSound("playerHit");
              screenShake.shake(5, 10);
            }
          }
        });

        // Enemy bullet vs player
        for (const b of eBullets) {
          if (player.value && intersectsRect(b, player.value)) {
            const died = player.value.takeDamage(10);
            if (died) {
              handlePlayerDeath();
            } else {
              soundManager.playSound("playerHit");
              screenShake.shake(5, 10);
            }
            b.deactivate();
          }
        }
      }

      // Collectibles (normal mode)
      collectibles.forEach((c) => {
        if (!c.collected && player.value.collectItem(c)) {
          c.collect();
          player.value.addCoins(5);
          soundManager.playSound("coin");
          particles.createCollectParticles(c.x + c.size / 2, c.y + c.size / 2);
        }
        c.update();
      });

      // Upgrade stations
      upgradeStations.forEach((station) => {
        station.update(player.value);
        if (!interactConsumed && station.isPlayerInRange() && input.justPressed.interact) {
          showUpgradeMenu.value = true;
        }
      });

      // Checkpoints (normal mode)
      checkpoints.forEach((checkpoint) => {
        const activated = checkpoint.update(player.value);
        if (activated) {
          lastCheckpoint = checkpoint;
          if (!reachedCheckpointIds.value.includes(checkpoint.id)) {
            reachedCheckpointIds.value.push(checkpoint.id);
          }
          saveGame();
          soundManager.playSound("checkpoint");
          showNotification("Checkpoint Saved!");
        }
      });

      // Ending flag (normal mode)
      if (endingFlag && !levelComplete.value) {
        const flagTouched = endingFlag.update(player.value);
        if (flagTouched) {
          levelComplete.value = true;
          player.value.velocityX = 0;
          player.value.velocityY = 0;
          player.value.targetVelocityX = 0;
          soundManager.playSound("powerup");
          showNotification("LEVEL COMPLETE!");
        }
      }

      // Camera — locked in challenge mode (maxX is already 0)
      if (!props.challengeMode) camera.follow(player.value);

      background.update();
      particles.update();

      // Spike collision
      if (!playerDying) {
        platforms.forEach((platform) => {
          if (platform.hasSpikes) {
            const fX = player.value.x + player.value.width / 2;
            const fY = player.value.y + player.value.height;
            if (platform.isPointOnSpikes(fX, fY)) handlePlayerDeath();
          }
        });

        // Fall death (normal mode only — arena has a floor)
        if (!props.challengeMode && player.value.y > canvasHeight.value + 100) {
          handlePlayerDeath();
        }
      }
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    const render = () => {
      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
      background.draw(ctx, camera.x);

      ctx.save();
      screenShake.apply(ctx);
      camera.apply(ctx);

      platforms.forEach((p) => { if (camera.isVisible(p)) p.draw(ctx); });
      collectibles.forEach((c) => { if (camera.isVisible(c) && !c.collected) c.draw(ctx); });
      upgradeStations.forEach((s) => { if (camera.isVisible(s)) s.draw(ctx); });
      checkpoints.forEach((cp) => { if (camera.isVisible(cp)) cp.draw(ctx); });

      if (endingFlag && camera.isVisible(endingFlag)) endingFlag.draw(ctx);

      enemySpawner.drawEnemies(ctx);
      bulletPool.draw(ctx);
      enemyBulletPool.draw(ctx);

      if (player.value && player.value.isAlive) {
        player.value.draw(ctx);
      }

      ammoPickups.forEach((p) => p.draw(ctx));

      // Gun barrel aimed at crosshair
      if (player.value && player.value.isAlive) {
        const px = player.value.x + player.value.width / 2;
        const py = player.value.y + player.value.height / 2;
        const dx = mouseCanvasX.value + camera.x - px;
        const dy = mouseCanvasY.value + camera.y - py;
        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.fillStyle = "#ff3b3b";
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#ff3b3b";
        ctx.beginPath();
        ctx.roundRect(0, -3, 28, 6, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      particles.draw(ctx);
      ctx.restore();

      if (screenFade) screenFade.draw(ctx, canvasWidth.value, canvasHeight.value);

      // Challenge mode HUD drawn on canvas (screen space)
      if (props.challengeMode) {
        const s = Math.floor(challengeTimer.value / 60);
        const mm = Math.floor(s / 60);
        const ss = String(s % 60).padStart(2, "0");
        const timeStr = `${mm}:${ss}`;

        ctx.save();
        ctx.textAlign = "center";
        ctx.shadowBlur = 12;

        ctx.font = "bold 22px monospace";
        ctx.shadowColor = "#ff4444";
        ctx.fillStyle = "#ff4444";
        ctx.fillText(
          challengeWave.value > 0 ? `WAVE ${challengeWave.value}` : "INCOMING...",
          canvasWidth.value / 2, 42
        );

        ctx.font = "bold 16px monospace";
        ctx.shadowColor = "#00ffff";
        ctx.fillStyle = "#00ffff";
        ctx.fillText(timeStr, canvasWidth.value / 2, 66);

        if (waveCountdown.value > 0) {
          ctx.font = "bold 26px monospace";
          ctx.shadowColor = "#ffff00";
          ctx.fillStyle = "#ffff00";
          ctx.fillText(
            `NEXT WAVE IN ${waveCountdown.value}...`,
            canvasWidth.value / 2,
            canvasHeight.value / 2 - 20
          );
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }
    };

    // ─── Player death ──────────────────────────────────────────────────────────

    function handlePlayerDeath() {
      // Use playerDying flag (not isAlive) because takeDamage() sets isAlive=false
      // before this function is called, which would cause the old guard to fire early.
      if (!player.value || playerDying || isRespawning) return;

      playerDying = true;
      deaths.value++;
      player.value.isAlive = false;
      player.value.velocityX = 0;
      player.value.velocityY = 0;
      player.value.targetVelocityX = 0;

      soundManager.playSound("death");
      screenShake.shake(8, 20);

      if (props.challengeMode) {
        // Challenge mode: game over — save run stats then show score screen
        screenFade.fadeOut(0.05, () => {
          saveManager.saveChallengeRun({
            kills: kills.value,
            wave:  challengeWave.value,
            time:  challengeTimer.value,
          });
          challengeOver.value = true;
        });
        return;
      }

      // Normal mode: respawn at last checkpoint
      screenFade.fadeOut(0.08, () => {
        respawnAtCheckpoint();
        setTimeout(() => screenFade.fadeIn(0.05), 100);
      });
    }

    // ─── Respawn ───────────────────────────────────────────────────────────────

    function respawnAtCheckpoint() {
      if (!player.value || isRespawning) return;
      isRespawning = true;
      playerDying = false;

      if (input) {
        Object.keys(input.keys).forEach((k) => { input.keys[k] = false; });
      }

      const respawnX = lastCheckpoint ? lastCheckpoint.getRespawnX() : 100;
      const respawnY = lastCheckpoint ? lastCheckpoint.getRespawnY() : 400;

      player.value.x = respawnX;
      player.value.y = respawnY;
      player.value.velocityX = 0;
      player.value.velocityY = 0;
      player.value.targetVelocityX = 0;
      player.value.isGrounded = false;
      player.value.coyoteTime = 0;
      player.value.jumpBuffer = 0;
      player.value.respawn(respawnX, respawnY);

      camera.x = Math.max(0, respawnX - canvasWidth.value / 2);
      camera.y = 0;

      enemySpawner.enemies = enemySpawner.enemies.filter(
        (e) => Math.abs(e.x - player.value.x) > 500
      );
      bulletPool.clear();
      if (enemyBulletPool) enemyBulletPool.clear();

      isPaused.value = false;
      setTimeout(() => { isRespawning = false; }, 300);
    }

    // ─── Challenge restart ──────────────────────────────────────────────────────

    function restartChallenge() {
      challengeOver.value = false;
      playerDying = false;
      challengeTimer.value = 0;
      challengeWave.value = 0;
      waveCountdown.value = 0;
      kills.value = 0;
      deaths.value = 0;
      waveManager = new WaveManager();
      player.value = new CombatPlayer(580, 460, 40, 40);
      enemySpawner.clear();
      bulletPool.clear();
      if (enemyBulletPool) enemyBulletPool.clear();
      screenFade.fadeIn(0.08);
    }

    function formatTime(frames) {
      const s = Math.floor(frames / 60);
      const m = Math.floor(s / 60);
      return `${m}:${String(s % 60).padStart(2, "0")}`;
    }

    // ─── Ammo purchase ─────────────────────────────────────────────────────────

    function buyAmmo() {
      if (!player.value || player.value.coins < 15) return;
      player.value.coins -= 15;
      player.value.addAmmo(40);
      soundManager.playSound("powerup");
      showNotification("+40 Ammo!");
      saveGame();
    }

    // ─── Upgrade system ────────────────────────────────────────────────────────

    function getUpgradeCost(type) {
      if (!player.value) return 0;
      const level = player.value.upgrades[type + "Level"] || 0;
      return UPGRADES[type].levels[level].cost;
    }

    function canAfford(cost) {
      return !!player.value && player.value.coins >= cost;
    }

    function purchaseUpgrade(type) {
      if (!player.value) return;
      if (type === "armorPiercing") {
        const cost = UPGRADES.armorPiercing.cost;
        if (player.value.coins >= cost) {
          player.value.coins -= cost;
          player.value.applyUpgrade("armorPiercing");
          soundManager.playSound("powerup");
          showNotification("Armor Piercing Unlocked!");
        }
      } else if (type === "explosive") {
        const cost = UPGRADES.explosive.cost;
        if (player.value.coins >= cost) {
          player.value.coins -= cost;
          player.value.applyUpgrade("explosive");
          soundManager.playSound("powerup");
          showNotification("Explosive Rounds Unlocked!");
        }
      } else {
        const level = player.value.upgrades[type + "Level"];
        if (level < 3) {
          const cost = getUpgradeCost(type);
          if (player.value.coins >= cost) {
            player.value.coins -= cost;
            player.value.applyUpgrade(type, level + 1);
            soundManager.playSound("powerup");
            showNotification(`${UPGRADES[type].name} Upgraded!`);
          }
        }
      }
      saveGame();
    }

    // ─── Notification ──────────────────────────────────────────────────────────

    function showNotification(message) {
      notification.value = message;
      setTimeout(() => { notification.value = ""; }, 3000);
    }

    // ─── Pause ─────────────────────────────────────────────────────────────────

    function togglePause() {
      isPaused.value = !isPaused.value;
      if (isPaused.value) soundManager.pauseAll();
      else soundManager.resumeAll();
    }

    // ─── Save / Load ───────────────────────────────────────────────────────────

    function saveGame() {
      if (!props.challengeMode && player.value) {
        saveManager.saveGame({
          seed: currentSeed,
          totalCheckpoints: checkpoints.length,
          lastCheckpoint: lastCheckpoint?.id ?? null,
          coins: player.value.coins,
          deaths: deaths.value,
          kills: kills.value,
          upgrades: player.value.upgrades,
        });
      }
    }

    function loadGameState(saveData) {
      if (!player.value) return;

      player.value.coins = saveData.coins || 0;
      deaths.value = saveData.deaths || 0;
      kills.value = saveData.kills || 0;

      if (saveData.upgrades) {
        Object.keys(saveData.upgrades).forEach((key) => {
          if (key.endsWith("Level")) {
            player.value.applyUpgrade(key.replace("Level", ""), saveData.upgrades[key]);
          } else if (saveData.upgrades[key] === true) {
            player.value.applyUpgrade(key);
          }
        });
      }

      if (Number.isInteger(saveData.lastCheckpoint)) {
        const checkpoint = checkpoints[saveData.lastCheckpoint];
        if (checkpoint) {
          checkpoint.activate();
          lastCheckpoint = checkpoint;
          if (!reachedCheckpointIds.value.includes(saveData.lastCheckpoint)) {
            reachedCheckpointIds.value.push(saveData.lastCheckpoint);
          }
          player.value.respawn(checkpoint.getRespawnX(), checkpoint.getRespawnY());
          // Snap camera so player doesn't start at x=0 visually
          if (camera) {
            camera.x = Math.max(0, checkpoint.getRespawnX() - canvasWidth.value / 2);
          }
        }
      }
    }

    // ─── Settings ──────────────────────────────────────────────────────────────

    function updateSettings(settings) {
      if (!soundManager) return;
      const s = { ...cloneDefaultGameSettings(), ...(settings || {}) };
      soundManager.setMusicVolume(s.musicVolume);
      soundManager.setSFXVolume(s.sfxVolume);
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    onMounted(() => {
      window.addEventListener("resize", handleResize);
      initGame();
      handleResize();
    });

    onUnmounted(() => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (input) input.destroy();
      if (soundManager) soundManager.destroy();
      window.removeEventListener("resize", handleResize);
    });

    function handleResize() {
      const width = Math.min(window.innerWidth - 40, 1200);
      const height = Math.min(window.innerHeight - 40, 600);
      canvasWidth.value = width;
      canvasHeight.value = height;
      if (camera) {
        camera.resize(width, height);
        if (levelLength.value > 0) camera.setLevelLength(levelLength.value);
      }
      if (background) background.resize(width, height);
    }

    return {
      gameCanvas,
      canvasWidth,
      canvasHeight,
      mouseOver,
      mouseCanvasX,
      mouseCanvasY,
      player,
      isPaused,
      showUpgradeMenu,
      notification,
      kills,
      deaths,
      levelLength,
      progressPercent,
      reachedCheckpointIds,
      levelComplete,
      challengeMode: props.challengeMode,
      challengeWave,
      challengeTimer,
      challengeOver,
      waveCountdown,
      formatTime,
      restartChallenge,
      togglePause,
      respawnAtCheckpoint,
      updateSettings,
      buyAmmo,
      getUpgradeCost,
      canAfford,
      purchaseUpgrade,
      onMouseMove,
      UPGRADES,
    };
  },
};
</script>

<style scoped>
.game-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a0033 100%);
  padding: 20px;
  overflow: hidden;
}

.canvas-wrapper {
  position: relative;
  display: inline-block;
  width: min(100vw - 40px, 1200px);
  max-height: calc(100vh - 40px);
  aspect-ratio: 2 / 1;
}

.game-canvas {
  width: 100%;
  height: 100%;
  border: 3px solid #ff00ff;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3);
  background: #000000;
  display: block;
  cursor: none;
}

.crosshair {
  position: absolute;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.8), 0 0 18px rgba(56, 189, 248, 0.5);
  background: transparent;
  pointer-events: none;
  z-index: 10;
}

.crosshair::before,
.crosshair::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  background: rgba(255, 255, 255, 0.95);
}

.crosshair::before {
  width: 20px;
  height: 2px;
  transform: translate(-50%, -50%);
}

.crosshair::after {
  width: 2px;
  height: 20px;
  transform: translate(-50%, -50%);
}

/* Upgrade Menu */
.upgrade-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  animation: fadeIn 0.15s ease-out;
}

.upgrade-content {
  background: linear-gradient(135deg, #0a001f 0%, #0a0a0f 100%);
  border: 2px solid #00ffff;
  border-radius: 20px;
  padding: 36px 40px;
  width: min(860px, 94vw);
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.6);
  font-family: monospace;
}

.upgrade-content h2 {
  color: #00ffff;
  text-align: center;
  margin: 0 0 8px 0;
  font-size: 26px;
  letter-spacing: 3px;
  text-shadow: 0 0 16px #00ffff;
}

.coins-display {
  text-align: center;
  color: #ffff00;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
  text-shadow: 0 0 10px #ffff00;
}

.upgrades-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.upgrade-item {
  background: rgba(0, 255, 255, 0.07);
  border: 2px solid #00ffff;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upgrade-item.special {
  border-color: #ff00ff;
  background: rgba(255, 0, 255, 0.07);
}

.upgrade-item h3 {
  color: #00ffff;
  margin: 0;
  font-size: 15px;
  letter-spacing: 1px;
}

.upgrade-item.special h3 { color: #ff00ff; }

.upgrade-item p {
  color: #aaa;
  margin: 0;
  font-size: 13px;
}

.upg-btn {
  margin-top: 6px;
  padding: 9px 12px;
  background: #00ffff;
  color: #000;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-family: monospace;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.upg-btn:hover:not(:disabled) {
  background: #00ff88;
  transform: scale(1.03);
}

.upg-btn:disabled {
  background: #2a2a2a;
  color: #555;
  cursor: not-allowed;
}

.special-btn {
  background: #ff00ff;
  color: #fff;
}

.special-btn:hover:not(:disabled) { background: #ff66cc; }

.maxed,
.owned {
  display: block;
  text-align: center;
  padding: 8px;
  color: #00ff00;
  font-weight: bold;
  border: 2px solid #00ff00;
  border-radius: 5px;
  font-size: 13px;
  margin-top: 6px;
}

.close-upgrade {
  display: block;
  width: 100%;
  padding: 14px;
  background: #ff00ff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  font-family: monospace;
  font-size: 16px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: background 0.15s;
}

.close-upgrade:hover { background: #ff66cc; }

/* Level Complete */
.complete-screen {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 255, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.5s;
}

.complete-content {
  text-align: center;
  padding: 40px;
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid #00ff00;
  border-radius: 20px;
  box-shadow: 0 0 40px rgba(0, 255, 0, 0.8);
}

.complete-content h1 {
  font-size: 64px;
  color: #00ff00;
  text-shadow: 0 0 20px #00ff00;
  margin: 0 0 20px 0;
}

.complete-content p {
  font-size: 24px;
  color: #fff;
  margin-bottom: 15px;
}

.menu-btn {
  padding: 15px 40px;
  font-size: 20px;
  font-weight: bold;
  background: #00ffff;
  color: #000;
  border: 3px solid #00ffff;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 20px;
}

/* Challenge Over */
.challenge-over-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.4s ease-out;
}

.challenge-over-card {
  background: linear-gradient(135deg, #1a0011 0%, #0a0a0f 100%);
  border: 3px solid #ff0044;
  border-radius: 20px;
  padding: 48px 56px;
  text-align: center;
  box-shadow: 0 0 60px rgba(255, 0, 68, 0.6);
  min-width: 380px;
  animation: cardIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.challenge-over-card h1 {
  font-size: 42px;
  color: #ff0044;
  text-shadow: 0 0 24px #ff0044;
  margin: 0 0 32px 0;
  font-family: monospace;
  letter-spacing: 3px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 40px;
}

.score-label {
  font-family: monospace;
  font-size: 14px;
  color: #aaa;
  letter-spacing: 2px;
}

.score-value {
  font-family: monospace;
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px #fff;
}

.over-btn-group {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  justify-content: center;
}

.over-btn {
  padding: 14px 32px;
  font-size: 16px;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: 2px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(135deg, #ff0044, #ff6688);
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 0, 68, 0.5);
}

.over-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 0, 68, 0.8);
}

.over-btn.secondary {
  background: linear-gradient(135deg, #333, #555);
  box-shadow: none;
}

.over-btn.secondary:hover {
  background: linear-gradient(135deg, #444, #666);
  box-shadow: none;
  transform: scale(1.03);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
