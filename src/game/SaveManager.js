// Save System
// Handles localStorage for game progress

import { cloneDefaultGameSettings } from "./settingsDefaults";

export class SaveManager {
  constructor() {
    this.saveKey = "spaceShooterSave";
    this.settingsKey = "spaceShooterSettings";
    this.challengeKey = "echojumpChallenge";
  }

  // Save game state
  saveGame(gameState) {
    const checkpointId = gameState.lastCheckpoint ?? gameState.checkpoint ?? null;
    const saveData = {
      // Keep both fields for backward compatibility with older saves.
      lastCheckpoint: checkpointId,
      checkpoint: checkpointId,
      seed: gameState.seed,
      totalCheckpoints: gameState.totalCheckpoints,
      coins: gameState.coins,
      deaths: gameState.deaths,
      upgrades: gameState.upgrades,
      kills: gameState.kills || 0,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error("Failed to save game:", e);
      return false;
    }
  }

  // Load game state. Saves from before procedural generation (no seed) can't
  // regenerate a matching level, so they're treated as absent.
  loadGame() {
    try {
      const data = localStorage.getItem(this.saveKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (!Number.isFinite(parsed.seed)) return null;
        const checkpointId = parsed.lastCheckpoint ?? parsed.checkpoint ?? null;
        return {
          ...parsed,
          lastCheckpoint: checkpointId,
          checkpoint: checkpointId,
        };
      }
    } catch (e) {
      console.error("Failed to load game:", e);
    }
    return null;
  }

  // Check if save exists
  hasSave() {
    return this.loadGame() !== null;
  }

  // Check if a save exists that has a checkpoint
  hasCheckpoint() {
    const saveData = this.loadGame();
    return !!saveData && Number.isInteger(saveData.lastCheckpoint);
  }

  // Delete save
  deleteSave() {
    localStorage.removeItem(this.saveKey);
  }

  // Save a completed challenge run; keeps all-time bests
  saveChallengeRun({ kills, wave, time }) {
    const prev = this.loadChallengeStats() || {};
    const data = {
      bestKills: Math.max(prev.bestKills || 0, kills),
      bestWave:  Math.max(prev.bestWave  || 0, wave),
      bestTime:  Math.max(prev.bestTime  || 0, time),
      lastKills: kills,
      lastWave:  wave,
      lastTime:  time,
      runsPlayed: (prev.runsPlayed || 0) + 1,
    };
    try { localStorage.setItem(this.challengeKey, JSON.stringify(data)); } catch (e) { /**/ }
  }

  // Load challenge all-time stats
  loadChallengeStats() {
    try {
      const data = localStorage.getItem(this.challengeKey);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  // Save settings
  saveSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }

  // Load settings
  loadSettings() {
    try {
      const data = localStorage.getItem(this.settingsKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") {
          return {
            ...cloneDefaultGameSettings(),
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }

    // Default settings
    return cloneDefaultGameSettings();
  }
}

