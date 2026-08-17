<template>
  <button class="tour-trigger" @click="open" aria-label="Show quick tour" title="How to play">
    ?
  </button>

  <div v-if="isOpen" class="tour-overlay" @click.self="close">
    <div class="tour-card">
      <button class="tour-close" @click="close" aria-label="Close">✕</button>

      <div class="tour-eyebrow">HOW TO PLAY · {{ stepIndex + 1 }}/{{ steps.length }}</div>

      <div class="tour-header">
        <div class="tour-icon">{{ currentStep.icon }}</div>
        <h3 class="tour-title">{{ currentStep.title }}</h3>
      </div>

      <p class="tour-text">{{ currentStep.text }}</p>

      <div class="tour-dots">
        <span
          v-for="(step, i) in steps"
          :key="step.title"
          class="tour-dot"
          :class="{ active: i === stepIndex }"
        />
      </div>

      <div class="tour-actions">
        <button class="tour-skip" @click="close">Skip</button>
        <div class="tour-actions-right">
          <button v-if="stepIndex > 0" class="tour-back" @click="stepIndex--">Back</button>
          <button class="tour-next" @click="next">{{ isLastStep ? 'Got it' : 'Next' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const STORAGE_KEY = "echo-jump-tour-seen";

export default {
  name: "WelcomeTour",
  data() {
    return {
      isOpen: false,
      stepIndex: 0,
      steps: [
        {
          icon: "⚑",
          title: "The Objective",
          text: "Fight through a procedurally generated level, collect glowing coins, and reach the ending flag to complete your run. Checkpoints save your progress along the way.",
        },
        {
          icon: "◆",
          title: "Upgrade Stations",
          text: "Press E near a glowing cyan station to spend the coins you've collected on upgrades — mid-level, before you push on.",
        },
        {
          icon: "⚡",
          title: "Challenge Mode",
          text: "Prefer no ending? Challenge Mode throws endless enemy waves at you instead — survive as long as you can and chase your best wave, kill count, and time.",
        },
      ],
    };
  },
  computed: {
    currentStep() {
      return this.steps[this.stepIndex];
    },
    isLastStep() {
      return this.stepIndex === this.steps.length - 1;
    },
  },
  mounted() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(this.open, 900);
    }
  },
  methods: {
    open() {
      this.stepIndex = 0;
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
      localStorage.setItem(STORAGE_KEY, "true");
    },
    next() {
      if (this.isLastStep) {
        this.close();
      } else {
        this.stepIndex++;
      }
    },
  },
};
</script>

<style scoped>
.tour-trigger {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 500;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(0, 255, 255, 0.5);
  color: #00ffff;
  font-family: "Courier New", monospace;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0, 255, 255, 0.25);
}
.tour-trigger:hover {
  background: rgba(0, 255, 255, 0.12);
}

.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(2px);
  font-family: "Courier New", monospace;
}

.tour-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 1.6rem;
  background: #0a0a0a;
  border: 2px solid rgba(0, 255, 255, 0.35);
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.15);
  color: #fff;
}

.tour-close {
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  background: none;
  border: none;
  color: #888;
  font-size: 1rem;
  cursor: pointer;
}
.tour-close:hover {
  color: #fff;
}

.tour-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #00cccc;
  margin-bottom: 0.75rem;
}

.tour-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

.tour-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.3);
  color: #00ffff;
  font-size: 1.3rem;
}

.tour-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}

.tour-text {
  margin: 0 0 1.2rem;
  font-size: 0.85rem;
  line-height: 1.55;
  color: #ccc;
}

.tour-dots {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.2rem;
}
.tour-dot {
  height: 6px;
  width: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  transition: all 0.25s ease;
}
.tour-dot.active {
  width: 22px;
  background: #00ffff;
}

.tour-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tour-skip {
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
}
.tour-skip:hover {
  color: #ccc;
}

.tour-actions-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.tour-back {
  background: none;
  border: 1px solid rgba(0, 255, 255, 0.35);
  color: #00ffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.tour-next {
  background: linear-gradient(135deg, #00ffff 0%, #00e87a 100%);
  color: #000;
  border: none;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.55rem 1.1rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}
</style>
