// SoundManager — Web Audio API, procedural SFX + looping background music

// 16-step sci-fi arpeggio: [bassHz, leadHz]
const MELODY = [
  [110, 220], [110,   0], [110, 330], [110,   0],
  [130, 392], [110, 440], [110,   0], [110, 330],
  [ 98, 262], [ 98,   0], [ 98, 294], [110, 330],
  [110,   0], [110, 392], [110, 330], [110, 220],
];

export class SoundManager {
  constructor() {
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.musicPlaying = false;
    this._musicTimer = null;
    this._nextNoteTime = 0;
    this._step = 0;
    this.ctx = null;
    this.sfxGain = null;
    this.musicGain = null;

    if (typeof window === "undefined") return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);

      // Compressor prevents music oscillators from clipping when they stack
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 20;
      this.compressor.ratio.value = 8;
      this.compressor.attack.value = 0.005;
      this.compressor.release.value = 0.18;
      this.compressor.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume * 0.45;
      this.musicGain.connect(this.compressor);
    } catch (_) {
      this.ctx = null;
    }
  }

  // ─── SFX ────────────────────────────────────────────────────────────────

  _note(freq, type, t, dur, gainPeak) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.sfxGain);
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.01);
  }

  _sweep(freqFrom, freqTo, type, t, dur, gainPeak) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.sfxGain);
    o.type = type;
    o.frequency.setValueAtTime(freqFrom, t);
    o.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(gainPeak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.01);
  }

  playSound(name) {
    if (!this.ctx || this.sfxVolume === 0) return;
    // Resume suspended context (Chrome autoplay policy)
    if (this.ctx.state === "suspended") this.ctx.resume();
    const t = this.ctx.currentTime;
    const v = this.sfxVolume;

    switch (name) {
      case "shoot":
        this._sweep(500, 80, "sawtooth", t, 0.08, v * 0.28);
        break;
      case "jump":
        this._sweep(200, 700, "square", t, 0.13, v * 0.18);
        break;
      case "enemyHit":
        this._note(180, "sawtooth", t, 0.07, v * 0.24);
        this._note(90,  "square",   t, 0.10, v * 0.14);
        break;
      case "playerHit":
        this._sweep(220, 55, "sawtooth", t, 0.22, v * 0.36);
        break;
      case "coin":
        this._note(880,  "sine", t,        0.07, v * 0.28);
        this._note(1320, "sine", t + 0.06, 0.10, v * 0.22);
        break;
      case "powerup":
        [220, 330, 440, 660].forEach((f, i) =>
          this._note(f, "square", t + i * 0.06, 0.09, v * 0.16)
        );
        break;
      case "death":
        this._sweep(440, 38, "sawtooth", t, 0.7, v * 0.38);
        this._sweep(220, 20, "square",   t, 0.8, v * 0.18);
        break;
      case "checkpoint":
        this._note(440, "sine", t,        0.15, v * 0.24);
        this._note(660, "sine", t + 0.13, 0.20, v * 0.24);
        break;
      default:
        break;
    }
  }

  // ─── Music ──────────────────────────────────────────────────────────────

  _scheduleNote(step, when, stepDur) {
    if (!this.ctx || !this.musicGain) return;
    const [bassHz, leadHz] = MELODY[step % 16];
    const len = stepDur * 0.72;

    if (bassHz) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g); g.connect(this.musicGain);
      o.type = "sawtooth";
      o.frequency.value = bassHz;
      g.gain.setValueAtTime(0.001, when);
      g.gain.linearRampToValueAtTime(0.42, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, when + len);
      o.start(when); o.stop(when + len + 0.01);
    }

    if (leadHz) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g); g.connect(this.musicGain);
      o.type = "triangle";   // triangle is softer than square, less harsh harmonics
      o.frequency.value = leadHz;
      g.gain.setValueAtTime(0.001, when);
      g.gain.linearRampToValueAtTime(0.30, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, when + len * 0.85);
      o.start(when); o.stop(when + len + 0.01);
    }
  }

  _tick() {
    if (!this.ctx || !this.musicPlaying) return;

    // If context is still suspended, wait for it
    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(() => {
        this._nextNoteTime = this.ctx.currentTime + 0.05;
        this._musicTimer = setTimeout(() => this._tick(), 50);
      });
      return;
    }

    const BPM = 118;
    const stepDur = 60 / BPM / 2; // 8th notes ≈ 0.254s
    const lookAhead = 0.15;

    while (this._nextNoteTime < this.ctx.currentTime + lookAhead) {
      this._scheduleNote(this._step, this._nextNoteTime, stepDur);
      this._nextNoteTime += stepDur;
      this._step = (this._step + 1) % 16;
    }

    this._musicTimer = setTimeout(() => this._tick(), 50);
  }

  startMusic() {
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;
    this._step = 0;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(() => {
        this._nextNoteTime = this.ctx.currentTime + 0.05;
        this._tick();
      });
    } else {
      this._nextNoteTime = this.ctx.currentTime + 0.05;
      this._tick();
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this._musicTimer) clearTimeout(this._musicTimer);
    this._musicTimer = null;
  }

  // ─── Volume ─────────────────────────────────────────────────────────────

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume * 0.45;
    if (this.musicVolume > 0 && !this.musicPlaying) this.startMusic();
    if (this.musicVolume === 0) this.stopMusic();
  }

  setSFXVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  // ─── Pause / resume ─────────────────────────────────────────────────────

  pauseAll() {
    if (this.ctx && this.ctx.state === "running") this.ctx.suspend();
  }

  resumeAll() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  // ─── Teardown ───────────────────────────────────────────────────────────

  destroy() {
    this.stopMusic();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}
