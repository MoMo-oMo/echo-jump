<template>
  <div v-if="player" class="game-hud">
    <!-- Top Center: Progress Bar -->
    <div class="hud-top-center">
      <div class="progress-container">
        <v-progress-linear
          class="progress-bar"
          :model-value="progressPercent"
          height="8"
          rounded
        />
        <div class="progress-text">
          Progress: {{ Math.round(progressPercent) }}%
        </div>
      </div>
    </div>

    <!-- Top Left: Health and Ammo -->
    <div class="hud-top-left">
      <!-- Health Bar -->
      <div class="hud-panel">
        <div class="panel-label">HEALTH</div>
        <div class="health-bar">
          <div
            class="health-fill"
            :style="{ width: healthPercent + '%' }"
            :class="healthClass"
          ></div>
          <span class="health-text"
            >{{ player.health }} / {{ player.maxHealth }}</span
          >
        </div>
      </div>

      <!-- Ammo -->
      <div class="hud-panel">
        <div class="panel-label">AMMO</div>
        <div class="ammo-display">
          <span class="ammo-count">{{ player.ammo }}</span>
          <span class="ammo-max">/ {{ player.reserveAmmo }}</span>
        </div>
      </div>
    </div>

    <!-- Top Right: Stats -->
    <div class="hud-top-right">
      <!-- Coins -->
      <div class="hud-stat">
        <span class="stat-icon">💰</span>
        <span class="stat-value">{{ player.coins }}</span>
      </div>

      <!-- Kills -->
      <div class="hud-stat">
        <span class="stat-icon">☠</span>
        <span class="stat-value">{{ kills }}</span>
      </div>

      <!-- Deaths -->
      <div class="hud-stat">
        <span class="stat-icon">⚰</span>
        <span class="stat-value">{{ deaths }}</span>
      </div>
    </div>

    <!-- Active Upgrades -->
    <div v-if="showUpgrades" class="active-upgrades">
      <div v-if="player.upgrades.armorPiercing" class="upgrade-badge">
        ARMOR PIERCING
      </div>
      <div v-if="player.upgrades.explosive" class="upgrade-badge">
        EXPLOSIVE ROUNDS
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="notification" class="notification">
      {{ notification }}
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

export default {
  name: "GameHUD",
  props: {
    player: Object,
    kills: Number,
    deaths: Number,
    notification: String,
    progressPercent: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const healthPercent = computed(() => {
      if (!props.player) return 100;
      return (props.player.health / props.player.maxHealth) * 100;
    });

    const healthClass = computed(() => {
      const percent = healthPercent.value;
      if (percent > 60) return "health-high";
      if (percent > 30) return "health-medium";
      return "health-low";
    });

    const showUpgrades = computed(() => {
      if (!props.player) return false;
      return (
        props.player.upgrades.armorPiercing || props.player.upgrades.explosive
      );
    });

    return {
      healthPercent,
      healthClass,
      showUpgrades,
    };
  },
};
</script>

<style scoped>
.game-hud {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  font-family: monospace;
}

.hud-top-center {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.hud-top-center .progress-container {
  margin: 0;
  text-align: center;
}

.hud-top-center .progress-bar {
  width: min(280px, 70vw);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.hud-top-center .progress-text {
  margin-top: 5px;
  font-size: 12px;
  color: #00ffff;
  text-shadow: 0 0 8px #00ffff;
  font-weight: bold;
  letter-spacing: 1px;
}

.hud-top-left {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hud-panel {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ffff;
  border-radius: 8px;
  padding: 10px 15px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  min-width: 200px;
}

.panel-label {
  color: #00ffff;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 5px;
  letter-spacing: 1px;
}

.health-bar {
  position: relative;
  height: 20px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  overflow: hidden;
}

.health-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
}

.health-high {
  background: linear-gradient(90deg, #00ff00, #00cc00);
  box-shadow: 0 0 10px #00ff00;
}

.health-medium {
  background: linear-gradient(90deg, #ffff00, #ffcc00);
  box-shadow: 0 0 10px #ffff00;
}

.health-low {
  background: linear-gradient(90deg, #ff0000, #cc0000);
  box-shadow: 0 0 10px #ff0000;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.health-text {
  position: relative;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  line-height: 20px;
  padding: 0 5px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.ammo-display {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.ammo-count {
  font-size: 24px;
  font-weight: bold;
  color: #ffff00;
  text-shadow: 0 0 10px #ffff00;
}

.ammo-max {
  font-size: 16px;
  color: #888;
}

.hud-top-right {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 15px;
}

.hud-stat {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #ff00ff;
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
}

.stat-icon {
  font-size: 20px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  min-width: 30px;
  text-align: right;
}

.active-upgrades {
  position: absolute;
  bottom: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upgrade-badge {
  background: rgba(255, 0, 255, 0.9);
  border: 2px solid #ff00ff;
  border-radius: 6px;
  padding: 8px 15px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.6);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-50px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 255, 255, 0.9);
  border: 2px solid #00ffff;
  border-radius: 10px;
  padding: 15px 30px;
  color: #000;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.8);
  animation: fadeInOut 3s ease-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  10%,
  90% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}
</style>
