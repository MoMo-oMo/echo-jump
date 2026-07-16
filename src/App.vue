<template>
  <v-app id="app">
    <v-main>
      <!-- Main Menu -->
      <MainMenu
        v-if="gameState === 'menu'"
        :hasSave="hasSave"
        :settings="settings"
        :progress-percent="menuProgress"
        :challenge-stats="challengeStats"
        @new-game="startNewGame"
        @continue-game="continueGame"
        @challenge-mode="startChallengeMode"
        @settings-changed="updateSettings"
      />

      <!-- Game -->
      <CombatGame
        v-else-if="gameState === 'playing'"
        :challengeMode="challengeMode"
        :continue-game="isContinuingGame"
        :settings="settings"
        @return-to-menu="returnToMenu"
      />
    </v-main>
  </v-app>
</template>

<script>
import { ref, onMounted } from "vue";
import CombatGame from "./components/CombatGame.vue";
import MainMenu from "./components/MainMenu.vue";
import { SaveManager } from "./game/SaveManager";
import { cloneDefaultGameSettings } from "./game/settingsDefaults";

export default {
  name: "App",
  components: {
    CombatGame,
    MainMenu,
  },
  setup() {
    const gameState = ref("menu");
    const challengeMode = ref(false);
    const isContinuingGame = ref(false);
    const hasSave = ref(false);
    const menuProgress = ref(0);
    const challengeStats = ref(null);
    const saveManager = new SaveManager();
    const settings = ref({
      ...cloneDefaultGameSettings(),
      ...saveManager.loadSettings(),
    });

    function refreshMenuProgress() {
      const saveData = saveManager.loadGame();
      if (!saveData) {
        menuProgress.value = 0;
        return;
      }
      const checkpointId =
        saveData.lastCheckpoint ?? saveData.checkpoint ?? null;
      if (!Number.isInteger(checkpointId)) {
        menuProgress.value = 0;
        return;
      }
      const totalCheckpoints = saveData.totalCheckpoints || 1;
      const basePercent = ((checkpointId + 1) / totalCheckpoints) * 100;
      menuProgress.value = Math.max(0, Math.min(100, basePercent));
    }

    onMounted(() => {
      hasSave.value = saveManager.hasCheckpoint();
      refreshMenuProgress();
      challengeStats.value = saveManager.loadChallengeStats();
    });

    function startNewGame() {
      challengeMode.value = false;
      saveManager.deleteSave();
      gameState.value = "playing";
      hasSave.value = false;
      menuProgress.value = 0;
    }

    function continueGame() {
      challengeMode.value = false;
      isContinuingGame.value = true;
      gameState.value = "playing";
      // Reset the flag after a short delay to allow re-triggering
      setTimeout(() => {
        isContinuingGame.value = false;
      }, 100);
    }

    function startChallengeMode() {
      challengeMode.value = true;
      saveManager.deleteSave();
      gameState.value = "playing";
      hasSave.value = false;
      menuProgress.value = 0;
    }

    function returnToMenu() {
      gameState.value = "menu";
      hasSave.value = saveManager.hasCheckpoint();
      refreshMenuProgress();
      challengeStats.value = saveManager.loadChallengeStats();
    }

    function updateSettings(nextSettings) {
      const mergedSettings = {
        ...cloneDefaultGameSettings(),
        ...settings.value,
        ...(nextSettings && typeof nextSettings === "object" ? nextSettings : {}),
      };
      saveManager.saveSettings(mergedSettings);
      settings.value = mergedSettings;
    }

    return {
      gameState,
      challengeMode,
      isContinuingGame,
      hasSave,
      menuProgress,
      challengeStats,
      settings,
      startNewGame,
      continueGame,
      startChallengeMode,
      returnToMenu,
      updateSettings,
    };
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  font-family: "Courier New", monospace;
  background: #000;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>