// Screen Fade Transition System
// Handles fade in/out effects for respawns and room transitions

export class ScreenFade {
  constructor() {
    this.fadeAlpha = 0;
    this.isFading = false;
    this.fadeDirection = 0; // -1 = fading out, 1 = fading in, 0 = not fading
    this.fadeSpeed = 0.05;
    this.onFadeComplete = null;
  }

  // Start fade out
  fadeOut(speed = 0.05, onComplete = null) {
    this.fadeDirection = -1;
    this.isFading = true;
    this.fadeSpeed = speed;
    this.onFadeComplete = onComplete;
    this.fadeAlpha = 0;
  }

  // Start fade in
  fadeIn(speed = 0.05, onComplete = null) {
    this.fadeDirection = 1;
    this.isFading = true;
    this.fadeSpeed = speed;
    this.onFadeComplete = onComplete;
    this.fadeAlpha = 1;
  }

  // Update fade animation
  update() {
    if (!this.isFading) return;

    if (this.fadeDirection === -1) {
      // Fading out
      this.fadeAlpha += this.fadeSpeed;
      if (this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        this.isFading = false;
        if (this.onFadeComplete) {
          this.onFadeComplete();
          this.onFadeComplete = null;
        }
      }
    } else if (this.fadeDirection === 1) {
      // Fading in
      this.fadeAlpha -= this.fadeSpeed;
      if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.isFading = false;
        if (this.onFadeComplete) {
          this.onFadeComplete();
          this.onFadeComplete = null;
        }
      }
    }
  }

  // Draw fade overlay
  draw(ctx, width, height) {
    if (this.fadeAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.fadeAlpha;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Check if currently fading
  isActive() {
    return this.isFading || this.fadeAlpha > 0;
  }

  // Reset fade state
  reset() {
    this.fadeAlpha = 0;
    this.isFading = false;
    this.fadeDirection = 0;
    this.onFadeComplete = null;
  }
}


