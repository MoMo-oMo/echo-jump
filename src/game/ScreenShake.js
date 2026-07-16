// Screen Shake Effect
// Adds camera shake for impact feedback

export class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.duration = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  // Trigger a screen shake
  shake(intensity, duration) {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
  }

  // Update shake effect
  update() {
    if (this.duration > 0) {
      // Generate random offset based on intensity
      this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
      this.offsetY = (Math.random() - 0.5) * this.intensity * 2;

      // Decay intensity
      this.intensity *= 0.9;
      this.duration--;

      if (this.duration === 0) {
        this.offsetX = 0;
        this.offsetY = 0;
        this.intensity = 0;
      }
    }
  }

  // Apply shake offset to context
  apply(ctx) {
    if (this.duration > 0) {
      ctx.translate(this.offsetX, this.offsetY);
    }
  }

  // Reset shake
  reset() {
    this.intensity = 0;
    this.duration = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}





