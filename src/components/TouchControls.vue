<template>
  <div class="touch-controls">
    <!-- Movement (left thumb) -->
    <div class="tc-cluster tc-cluster--move">
      <button
        class="tc-btn tc-btn--move"
        @pointerdown.prevent="press('left', true)"
        @pointerup.prevent="press('left', false)"
        @pointerleave.prevent="press('left', false)"
        @pointercancel.prevent="press('left', false)"
        aria-label="Move left"
      >◀</button>
      <button
        class="tc-btn tc-btn--move"
        @pointerdown.prevent="press('right', true)"
        @pointerup.prevent="press('right', false)"
        @pointerleave.prevent="press('right', false)"
        @pointercancel.prevent="press('right', false)"
        aria-label="Move right"
      >▶</button>
    </div>

    <!-- Utility (reload / interact / pause) -->
    <div class="tc-cluster tc-cluster--utility">
      <button
        class="tc-btn tc-btn--utility"
        @pointerdown.prevent="press('reload', true)"
        @pointerup.prevent="press('reload', false)"
        @pointerleave.prevent="press('reload', false)"
        @pointercancel.prevent="press('reload', false)"
        aria-label="Reload"
      >R</button>
      <button
        class="tc-btn tc-btn--utility"
        @pointerdown.prevent="press('interact', true)"
        @pointerup.prevent="press('interact', false)"
        @pointerleave.prevent="press('interact', false)"
        @pointercancel.prevent="press('interact', false)"
        aria-label="Interact"
      >E</button>
      <button
        class="tc-btn tc-btn--utility"
        @pointerdown.prevent="$emit('pause')"
        aria-label="Pause"
      >⏸</button>
    </div>

    <!-- Actions (right thumb) -->
    <div class="tc-cluster tc-cluster--action">
      <button
        class="tc-btn tc-btn--action"
        @pointerdown.prevent="press('jump', true)"
        @pointerup.prevent="press('jump', false)"
        @pointerleave.prevent="press('jump', false)"
        @pointercancel.prevent="press('jump', false)"
        aria-label="Jump"
      >▲</button>
      <button
        class="tc-btn tc-btn--action tc-btn--fire"
        @pointerdown.prevent="press('shoot', true)"
        @pointerup.prevent="press('shoot', false)"
        @pointerleave.prevent="press('shoot', false)"
        @pointercancel.prevent="press('shoot', false)"
        aria-label="Shoot"
      >✕</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "TouchControls",
  emits: ["press", "pause"],
  methods: {
    press(key, isDown) {
      this.$emit("press", key, isDown);
    },
  },
};
</script>

<style scoped>
/* Overlaid directly on the canvas — landscape phones are short on height,
   there's no room to spare a separate bar below the game view. */
.touch-controls {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 10px calc(10px + env(safe-area-inset-right, 0px)) calc(10px + env(safe-area-inset-bottom, 0px))
    calc(10px + env(safe-area-inset-left, 0px));
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
}

.tc-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  pointer-events: auto;
}

.tc-cluster--utility {
  position: absolute;
  /* Below GameHUD's top-right coins/kills/deaths panel (top:20px + its own
     padding+content ~50px tall) so the two don't overlap. */
  top: calc(78px + env(safe-area-inset-top, 0px));
  right: calc(10px + env(safe-area-inset-right, 0px));
  gap: 8px;
}

.tc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 255, 255, 0.08);
  border: 2px solid rgba(0, 255, 255, 0.4);
  color: #00ffff;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

.tc-btn:active {
  background: rgba(0, 255, 255, 0.25);
}

.tc-btn--move {
  width: 56px;
  height: 56px;
  font-size: 1.4rem;
}

.tc-btn--action {
  width: 64px;
  height: 64px;
  font-size: 1.3rem;
}

.tc-btn--fire {
  background: rgba(255, 59, 59, 0.1);
  border-color: rgba(255, 59, 59, 0.55);
  color: #ff5c5c;
}
.tc-btn--fire:active {
  background: rgba(255, 59, 59, 0.28);
}

.tc-btn--utility {
  width: 38px;
  height: 38px;
  font-size: 0.85rem;
  color: #9be9e9;
  border-color: rgba(0, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.04);
}
</style>
