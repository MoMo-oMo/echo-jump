export const DEFAULT_GAME_SETTINGS = Object.freeze({
  musicVolume: 0.5,
  sfxVolume: 0.7,
  fullscreen: false,
});

export function cloneDefaultGameSettings() {
  return { ...DEFAULT_GAME_SETTINGS };
}
