# ⚡ Echo Jump

A 2D side-scrolling combat platformer built with **Vue 3** and the **HTML5
Canvas 2D API** — neon space aesthetic, mouse-aimed shooting, six enemy
types with real AI, checkpoints with persistent saves, an upgrade economy,
and a separate survival "Challenge Mode." All music and sound effects are
synthesized live with the Web Audio API — there isn't a single audio file
in the project.

<!-- Add a gameplay GIF or screenshot here — this is the first thing anyone
     sees, and static text won't sell a platformer as well as a few seconds
     of footage will. -->

## 🎮 Play

**[Play it live](https://momo-omo.github.io/echo-jump/)** (deploys automatically
from `master` via GitHub Actions — see `.github/workflows/deploy.yml`)

## 🕹️ Controls

| Key                     | Action                                     |
| ------------------------ | ------------------------------------------- |
| `A` / `D` or `←` / `→`   | Move left / right                          |
| `W` / `Space`             | Jump — press again mid-air to double jump  |
| `X` / Left-click         | Shoot (aimed at the mouse cursor)          |
| `R`                       | Reload from reserve ammo                   |
| `E`                       | Use upgrade station (when in range)        |
| `Esc`                     | Pause                                      |

## ✨ Features

**Movement & combat**
- Physics-based movement with acceleration/friction, coyote time, and jump
  buffering for forgiving, responsive controls
- Counter-based double jump
- Mouse-aimed shooting with a magazine + reserve-ammo/reload system
- Upgrade economy: ammo capacity, weapon damage, max health, armor-piercing
  rounds, and explosive rounds (splash damage to nearby enemies on impact)

**Enemies**
- Six enemy archetypes with distinct behavior — fast runners, patrollers,
  jumpers, tanks, flying units, and ranged attackers — using line-of-sight
  checks against the level geometry to decide when to engage

**Progression & saves**
- Checkpoint system with respawn-with-invincibility, coin/kill/death
  tracking, and localStorage persistence so you can continue a run later
- A separate **Challenge Mode**: a fixed survival arena with escalating
  timed enemy waves, tracked against your all-time best kills/wave/time

**Presentation**
- Fully procedural audio — music and SFX are synthesized in real time via
  the Web Audio API, no audio assets
- Parallax starfield background, pooled particle effects, screen shake,
  and screen-fade transitions
- Settings panel for music/SFX volume, persisted across sessions

## 🛠️ Tech Stack

- **Vue 3** (Composition API) + **Vuetify** for menus/HUD chrome
- **HTML5 Canvas 2D** for all gameplay rendering (no rendering library)
- **Web Audio API** for procedural sound — see `src/game/SoundManager.js`
- **localStorage** for saves, settings, and challenge-mode best stats

## 🚀 Getting Started

```bash
npm install
npm run dev      # starts the dev server (defaults to :8081 if :8080 is busy)
npm run build     # production build, output in dist/
npm run lint      # ESLint + Prettier
```

## 📁 Project Structure

```
src/
├── game/                     # Framework-agnostic game logic (no Vue here)
│   ├── Player.js             # Base movement/physics/collision
│   ├── PlayerCombat.js        # Combat player: health, shooting, upgrades
│   ├── Enemy.js               # Shared enemy base (AI, line-of-sight)
│   ├── EnemyTypes.js          # The six enemy archetypes
│   ├── EnemySpawner.js        # Manages pre-placed + pooled enemy instances
│   ├── Bullet.js / BulletPool.js
│   ├── EnemyBulletPool.js
│   ├── Platform.js            # Platform class + the current hand-authored level
│   ├── ChallengeArena.js      # Fixed arena layout for Challenge Mode
│   ├── WaveManager.js         # Enemy wave pacing for Challenge Mode
│   ├── Checkpoint.js / SpawnTrigger.js / UpgradeStation.js
│   ├── Collectible.js / AmmoPickup.js
│   ├── SaveManager.js         # localStorage saves/settings/challenge stats
│   ├── SoundManager.js        # Procedural music + SFX (Web Audio API)
│   ├── ParticleSystem.js / ScreenShake.js / ScreenFade.js / Background.js
│   ├── Camera.js / Input.js
│   └── platformPlacement.js   # Shared helpers for snapping entities to platforms
├── components/
│   ├── CombatGame.vue         # Main game orchestrator: loop, render, HUD wiring
│   ├── GameHUD.vue            # Health/ammo/coins/upgrades overlay
│   ├── MainMenu.vue           # Title screen, continue/challenge/settings
│   ├── PauseMenu.vue
│   └── GameSettingsPanel.vue
├── App.vue                    # Top-level screen routing (menu ↔ game)
└── main.js
```

## 🗺️ Roadmap / Known Limitations

- **Desktop only** — controls are keyboard + mouse, no touch input yet.
- **Normal mode currently plays one hand-authored level** every run.
  Procedural level generation (seeded, so saves/checkpoints still work) is
  designed and next up.
- No automated test suite yet.
