<template>
  <div class="pause-overlay" @click.self="$emit('resume')">
    <div class="pause-card">
      <h1 class="pause-title">PAUSED</h1>

      <div class="pause-stats">
        <div class="stat">
          <span class="stat-label">Coins</span>
          <span class="stat-value">{{ stats.coins }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Kills</span>
          <span class="stat-value">{{ stats.kills }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Deaths</span>
          <span class="stat-value">{{ stats.deaths }}</span>
        </div>
      </div>

      <div class="pause-buttons">
        <button @click="$emit('resume')" class="pause-btn primary">▶ RESUME</button>
        <button @click="$emit('checkpoint')" class="pause-btn">⟳ RESTART FROM CHECKPOINT</button>
        <button @click="showSettings = true" class="pause-btn">⚙ SETTINGS</button>
        <button @click="$emit('main-menu')" class="pause-btn danger">✕ EXIT TO MAIN MENU</button>
      </div>
    </div>

    <GameSettingsPanel
      v-if="showSettings"
      :settings="settings"
      @close="showSettings = false"
      @settings-changed="handleSettingsChanged"
    />
  </div>
</template>

<script>
import { ref } from "vue";
import GameSettingsPanel from "./GameSettingsPanel.vue";
import { cloneDefaultGameSettings } from "../game/settingsDefaults";

export default {
  name: "PauseMenu",
  components: { GameSettingsPanel },
  props: {
    stats: {
      type: Object,
      default: () => ({ coins: 0, kills: 0, deaths: 0 }),
    },
    settings: {
      type: Object,
      default: () => cloneDefaultGameSettings(),
    },
  },
  emits: ["resume", "checkpoint", "main-menu", "settings-changed"],
  setup(_props, { emit }) {
    const showSettings = ref(false);
    function handleSettingsChanged(next) {
      emit("settings-changed", next);
    }
    return { showSettings, handleSettingsChanged };
  },
};
</script>

<style scoped>
/* Full-viewport transparent overlay — game is visible behind */
.pause-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 10, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: overlayIn 0.2s ease-out;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.pause-card {
  background: rgba(10, 0, 30, 0.88);
  border: 2px solid #ff00ff;
  border-radius: 16px;
  padding: 40px 48px;
  min-width: 360px;
  box-shadow: 0 0 40px rgba(255, 0, 255, 0.4), 0 0 80px rgba(0, 0, 0, 0.8);
  animation: cardIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from { transform: scale(0.88); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.pause-title {
  font-size: 52px;
  font-weight: bold;
  color: #ff00ff;
  text-shadow: 0 0 18px #ff00ff, 0 0 36px #ff00ff;
  margin: 0 0 28px 0;
  letter-spacing: 6px;
  text-align: center;
}

.pause-stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.4);
  border-radius: 10px;
  min-width: 80px;
}

.stat-label {
  color: #00ffff;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-value {
  color: #fff;
  font-size: 26px;
  font-weight: bold;
}

.pause-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pause-btn {
  padding: 13px 24px;
  font-size: 15px;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: 1px;
  color: #000;
  background: linear-gradient(135deg, #00ffff 0%, #00ff88 100%);
  border: 2px solid #00ffff;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 0 14px rgba(0, 255, 255, 0.4);
}

.pause-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 0 24px rgba(0, 255, 255, 0.7);
}

.pause-btn.primary {
  background: linear-gradient(135deg, #ff00ff 0%, #ff66cc 100%);
  border-color: #ff00ff;
  box-shadow: 0 0 14px rgba(255, 0, 255, 0.4);
  color: #fff;
}

.pause-btn.primary:hover {
  box-shadow: 0 0 24px rgba(255, 0, 255, 0.7);
}

.pause-btn.danger {
  background: linear-gradient(135deg, #ff3333 0%, #ff6666 100%);
  border-color: #ff3333;
  box-shadow: 0 0 14px rgba(255, 51, 51, 0.4);
  color: #fff;
}

.pause-btn.danger:hover {
  box-shadow: 0 0 24px rgba(255, 51, 51, 0.7);
}
</style>
