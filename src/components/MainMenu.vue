<template>
  <div class="main-menu">
    <!-- Animated Background -->
    <canvas ref="bgCanvas" class="menu-background"></canvas>

    <!-- Menu Content -->
    <v-container class="menu-content" fluid>

      <!-- Centre block: logo + progress + buttons + stats — fills available height and centres itself -->
      <div class="menu-center">
        <img
          src="@/assets/34ced20e-462e-4f36-b7bf-82a3ac89ac95.png"
          alt="Game Logo"
          class="game-logo"
        />

        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-text">
            Game Progress: {{ Math.round(progressPercent) }}%
          </div>
        </div>

        <div class="menu-buttons">
          <v-btn @click="$emit('new-game')" class="menu-btn primary">
            <span class="btn-icon">▶</span>
            NEW GAME
          </v-btn>

          <v-btn v-if="hasSave" @click="$emit('continue-game')" class="menu-btn">
            <span class="btn-icon">⟳</span>
            CONTINUE
          </v-btn>

          <v-btn @click="$emit('challenge-mode')" class="menu-btn">
            <span class="btn-icon">⚡</span>
            CHALLENGE MODE
          </v-btn>

          <v-btn @click="showSettings = true" class="menu-btn">
            <span class="btn-icon">⚙</span>
            SETTINGS
          </v-btn>
        </div>

        <!-- Challenge Mode Stats -->
        <div v-if="challengeStats" class="challenge-stats-box">
          <div class="cs-title">⚡ CHALLENGE STATS</div>
          <div class="cs-grid">
            <div class="cs-col">
              <div class="cs-header">ALL-TIME BEST</div>
              <div class="cs-row"><span>Best Wave</span><span>{{ challengeStats.bestWave }}</span></div>
              <div class="cs-row"><span>Best Kills</span><span>{{ challengeStats.bestKills }}</span></div>
              <div class="cs-row"><span>Longest Run</span><span>{{ fmtTime(challengeStats.bestTime) }}</span></div>
              <div class="cs-row"><span>Runs Played</span><span>{{ challengeStats.runsPlayed }}</span></div>
            </div>
            <div class="cs-col">
              <div class="cs-header">LAST RUN</div>
              <div class="cs-row"><span>Wave</span><span>{{ challengeStats.lastWave }}</span></div>
              <div class="cs-row"><span>Kills</span><span>{{ challengeStats.lastKills }}</span></div>
              <div class="cs-row"><span>Survived</span><span>{{ fmtTime(challengeStats.lastTime) }}</span></div>
            </div>
          </div>
        </div>
      </div><!-- /menu-center -->

      <!-- Controls footer — always sits at the very bottom -->
      <div class="menu-footer">
        <div class="controls-grid">
          <div class="ctrl-section">
            <div class="ctrl-header">MOVEMENT</div>
            <div class="ctrl-row"><span class="key">A / D</span><span>Move left / right</span></div>
            <div class="ctrl-row"><span class="key">W / Space</span><span>Jump — press again mid-air for double jump</span></div>
            <div class="ctrl-row"><span class="key">R</span><span>Reload ammo</span></div>
            <div class="ctrl-row"><span class="key">E</span><span>Use upgrade station</span></div>
            <div class="ctrl-row"><span class="key">Esc</span><span>Pause</span></div>
          </div>
          <div class="ctrl-section">
            <div class="ctrl-header">COMBAT</div>
            <div class="ctrl-row"><span class="key">X / Left-click</span><span>Shoot</span></div>
            <div class="ctrl-row"><span class="key">Mouse</span><span>Aim direction</span></div>
            <div class="ctrl-row"><span class="key">Arrows</span><span>Alternative movement</span></div>
          </div>
        </div>
      </div>

    </v-container>

    <!-- Settings Modal -->
    <GameSettingsPanel
      v-if="showSettings"
      :settings="settings"
      :show-fullscreen="true"
      @close="showSettings = false"
      @settings-changed="handleSettingsChanged"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import GameSettingsPanel from "./GameSettingsPanel.vue";
import { cloneDefaultGameSettings } from "../game/settingsDefaults";
import { SoundManager } from "../game/SoundManager";

export default {
  name: "MainMenu",
  components: {
    GameSettingsPanel,
  },
  props: {
    hasSave: Boolean,
    settings: {
      type: Object,
      default: () => cloneDefaultGameSettings(),
    },
    progressPercent: {
      type: Number,
      default: 0,
    },
    challengeStats: {
      type: Object,
      default: null,
    },
  },
  emits: ["new-game", "continue-game", "challenge-mode", "settings-changed"],
  setup(props, { emit }) {
    const bgCanvas = ref(null);
    const showSettings = ref(false);
    const progressPercent = computed(
      () => (Number.isFinite(props.progressPercent) ? props.progressPercent : 0)
    );

    let bgCtx = null;
    let stars = [];
    let animationId = null;
    let menuSound = null;

    // Animated background + music
    onMounted(() => {
      bgCtx = bgCanvas.value.getContext("2d");
      bgCanvas.value.width = window.innerWidth;
      bgCanvas.value.height = window.innerHeight;

      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * bgCanvas.value.width,
          y: Math.random() * bgCanvas.value.height,
          size: Math.random() * 2,
          speed: Math.random() * 0.5 + 0.1,
          brightness: Math.random(),
        });
      }

      animateBackground();

      // Start menu music (first user interaction already happened — button click navigated here)
      menuSound = new SoundManager();
      const vol = props.settings?.musicVolume ?? 0.5;
      menuSound.setMusicVolume(vol);
      menuSound.setSFXVolume(props.settings?.sfxVolume ?? 0.7);
      menuSound.startMusic();
    });

    onUnmounted(() => {
      if (animationId) cancelAnimationFrame(animationId);
      if (menuSound) menuSound.destroy();
    });

    // Sync volume when settings change while menu is open
    watch(
      () => props.settings,
      (s) => {
        if (!menuSound || !s) return;
        menuSound.setMusicVolume(s.musicVolume ?? 0.5);
        menuSound.setSFXVolume(s.sfxVolume ?? 0.7);
      },
      { deep: true }
    );

    function animateBackground() {
      bgCtx.fillStyle = "#000000";
      bgCtx.fillRect(0, 0, bgCanvas.value.width, bgCanvas.value.height);

      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > bgCanvas.value.height) {
          star.y = 0;
          star.x = Math.random() * bgCanvas.value.width;
        }

        bgCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        bgCtx.fillRect(star.x, star.y, star.size, star.size);
      });

      animationId = requestAnimationFrame(animateBackground);
    }

    function handleSettingsChanged(nextSettings) {
      emit("settings-changed", nextSettings);
    }

    function fmtTime(frames) {
      const s = Math.floor((frames || 0) / 60);
      const m = Math.floor(s / 60);
      return `${m}:${String(s % 60).padStart(2, "0")}`;
    }

    return {
      bgCanvas,
      showSettings,
      progressPercent,
      handleSettingsChanged,
      fmtTime,
    };
  },
};
</script>

<style scoped>
.main-menu {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1000;
}

.menu-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Outer scroll container */
.menu-content {
  position: relative;
  z-index: 10;
  text-align: center;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 0 clamp(12px, 3vw, 24px) clamp(12px, 2vh, 20px);
  overflow-y: auto;
}

/* Takes all remaining space and vertically centres its children */
.menu-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  padding: clamp(16px, 3vh, 28px) 0 clamp(8px, 1.5vh, 16px);
}

/* ── Logo ─────────────────────────────────────────────────────── */
.game-logo {
  width: clamp(160px, 22vw, 260px);
  height: auto;
  filter: drop-shadow(0 0 12px rgba(0,255,255,0.55)) drop-shadow(0 0 24px rgba(255,0,255,0.35));
  margin-bottom: clamp(6px, 1.2vh, 12px);
  animation: glow 2.5s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 12px rgba(0,255,255,0.55)) drop-shadow(0 0 24px rgba(255,0,255,0.35));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(0,255,255,0.7)) drop-shadow(0 0 36px rgba(255,0,255,0.5));
  }
}

/* ── Progress ─────────────────────────────────────────────────── */
.progress-container {
  margin: clamp(4px, 0.8vh, 10px) 0 clamp(10px, 1.6vh, 18px);
  text-align: center;
}

.progress-bar {
  width: clamp(200px, 30vw, 340px);
  height: 10px;
  background: rgba(0, 255, 255, 0.12);
  border: 1px solid rgba(0, 255, 255, 0.45);
  border-radius: 6px;
  overflow: hidden;
  margin: 0 auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ccff, #00ffcc);
  border-radius: 6px;
  transition: width 0.4s ease;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
  min-width: 2px;
}

.progress-text {
  margin-top: 6px;
  font-size: clamp(11px, 1.3vw, 14px);
  color: #00ffff;
  font-weight: bold;
}

/* ── Buttons ──────────────────────────────────────────────────── */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.2vh, 12px);
  margin-bottom: clamp(10px, 1.6vh, 18px);
  width: clamp(200px, 38vw, 320px);
}

.menu-btn {
  width: 100%;
  padding: clamp(9px, 1.4vh, 13px) clamp(20px, 4vw, 40px);
  font-size: clamp(13px, 1.6vw, 17px);
  font-weight: bold;
  color: #000;
  background: linear-gradient(135deg, #00ffff 0%, #00e87a 100%);
  border: 2px solid rgba(0, 255, 255, 0.7);
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.menu-btn:hover {
  transform: scale(1.03) translateY(-1px);
  box-shadow: 0 0 18px rgba(0, 255, 255, 0.55);
}

.menu-btn.primary {
  background: linear-gradient(135deg, #e800e8 0%, #ff66cc 100%);
  border-color: rgba(255, 0, 255, 0.7);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
}

.menu-btn.primary:hover {
  box-shadow: 0 0 18px rgba(255, 0, 255, 0.55);
}

.btn-icon {
  font-size: clamp(16px, 2vw, 22px);
}

/* ── Challenge stats ──────────────────────────────────────────── */
.challenge-stats-box {
  margin: clamp(8px, 1vh, 14px) 0 0;
  background: rgba(255, 200, 0, 0.05);
  border: 1px solid rgba(255, 200, 0, 0.3);
  border-radius: 10px;
  padding: clamp(10px, 1.5vh, 16px) clamp(14px, 2vw, 22px);
  width: min(520px, 90vw);
  font-family: monospace;
}

.cs-title {
  color: #ffcc00;
  font-size: clamp(10px, 1.2vw, 13px);
  font-weight: bold;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 10px;
}

.cs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
}

.cs-col { display: flex; flex-direction: column; gap: 5px; }

.cs-header {
  font-size: clamp(8px, 0.9vw, 10px);
  letter-spacing: 2px;
  color: #777;
  margin-bottom: 3px;
}

.cs-row {
  display: flex;
  justify-content: space-between;
  font-size: clamp(11px, 1.2vw, 13px);
  color: #bbb;
}

.cs-row span:last-child { color: #fff; font-weight: bold; }

/* ── Controls footer ──────────────────────────────────────────── */
.menu-footer {
  width: min(580px, 94vw);
  padding-bottom: clamp(8px, 1.5vh, 16px);
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: clamp(8px, 1.2vh, 14px) clamp(12px, 2vw, 20px);
  font-family: monospace;
}

.ctrl-section { display: flex; flex-direction: column; gap: 3px; }

.ctrl-header {
  font-size: clamp(8px, 0.9vw, 10px);
  letter-spacing: 2px;
  color: #00cccc;
  margin-bottom: 4px;
}

.ctrl-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: clamp(10px, 1.1vw, 12px);
  color: #777;
}

.ctrl-row span:last-child { color: #999; }

.key {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: clamp(9px, 0.9vw, 11px);
  color: #ccc;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
