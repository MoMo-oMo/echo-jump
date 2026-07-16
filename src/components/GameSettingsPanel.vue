<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <div class="settings-card">
      <h2>SETTINGS</h2>

      <div class="setting-item">
        <label>Music Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          :value="musicVolumePercent"
          @input="updateMusicVolume($event)"
        />
        <span>{{ musicVolumePercent }}%</span>
      </div>

      <div class="setting-item">
        <label>SFX Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          :value="sfxVolumePercent"
          @input="updateSFXVolume($event)"
        />
        <span>{{ sfxVolumePercent }}%</span>
      </div>

      <div v-if="showFullscreen" class="setting-item">
        <label>Fullscreen</label>
        <button @click="toggleFullscreen" class="toggle-btn">
          {{ isFullscreen ? "ON" : "OFF" }}
        </button>
      </div>

      <button @click="$emit('close')" class="close-btn">CLOSE</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { cloneDefaultGameSettings, DEFAULT_GAME_SETTINGS } from "../game/settingsDefaults";

export default {
  name: "GameSettingsPanel",
  props: {
    settings: {
      type: Object,
      default: () => cloneDefaultGameSettings(),
    },
    showFullscreen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close", "settings-changed"],
  setup(props, { emit }) {
    const musicVolumePercent = computed(() =>
      Math.round((props.settings?.musicVolume ?? DEFAULT_GAME_SETTINGS.musicVolume) * 100)
    );
    const sfxVolumePercent = computed(() =>
      Math.round((props.settings?.sfxVolume ?? DEFAULT_GAME_SETTINGS.sfxVolume) * 100)
    );

    // Track actual browser fullscreen state (not just the setting value)
    const isFullscreen = ref(!!document.fullscreenElement);

    function onFullscreenChange() {
      isFullscreen.value = !!document.fullscreenElement;
      emit("settings-changed", {
        ...DEFAULT_GAME_SETTINGS,
        ...props.settings,
        fullscreen: isFullscreen.value,
      });
    }

    onMounted(() => {
      document.addEventListener("fullscreenchange", onFullscreenChange);
    });
    onUnmounted(() => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    });

    function emitPatch(patch) {
      emit("settings-changed", { ...DEFAULT_GAME_SETTINGS, ...props.settings, ...patch });
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    return {
      musicVolumePercent,
      sfxVolumePercent,
      isFullscreen,
      updateMusicVolume: (e) => emitPatch({ musicVolume: Number(e.target.value) / 100 }),
      updateSFXVolume:   (e) => emitPatch({ sfxVolume:   Number(e.target.value) / 100 }),
      toggleFullscreen,
    };
  },
};
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: overlayIn 0.15s ease-out;
}

@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.settings-card {
  background: linear-gradient(135deg, #1a0033 0%, #0a0a0f 100%);
  border: 2px solid #00ffff;
  border-radius: 16px;
  padding: 36px 44px;
  min-width: 380px;
  box-shadow: 0 0 36px rgba(0, 255, 255, 0.5);
  animation: cardIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardIn {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.settings-card h2 {
  color: #00ffff;
  margin: 0 0 24px 0;
  text-shadow: 0 0 16px #00ffff;
  font-family: monospace;
  letter-spacing: 3px;
}

.setting-item {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.setting-item label {
  flex: 1;
  color: #fff;
  font-size: 15px;
  font-family: monospace;
}

.setting-item input[type="range"] {
  flex: 2;
  height: 6px;
  background: #333;
  border-radius: 3px;
  outline: none;
  accent-color: #00ffff;
}

.setting-item span {
  color: #00ffff;
  font-weight: bold;
  min-width: 44px;
  font-family: monospace;
}

.toggle-btn {
  padding: 6px 18px;
  background: #00ffff;
  color: #000;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  font-family: monospace;
  cursor: pointer;
}

.close-btn {
  margin-top: 24px;
  padding: 11px 0;
  background: #ff00ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-family: monospace;
  font-size: 15px;
  letter-spacing: 2px;
  cursor: pointer;
  width: 100%;
  transition: background 0.15s;
}

.close-btn:hover {
  background: #ff66cc;
}
</style>
