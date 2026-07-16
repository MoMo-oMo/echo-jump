// Platform Class

export class Platform {
  constructor(x, y, width, height, type = "normal", options = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.color = "#1a1a2e";
    this.outlineColor = "#ff00ff";
    this.pulsePhase = Math.random() * Math.PI * 2;

    this.hasSpikes = options.hasSpikes || false;
    this.spikeCount = options.spikeCount || 0;

    this.dx = options.dx || 0;
    this.dy = options.dy || 0;
    this.minX = options.minX ?? x;
    this.maxX = options.maxX ?? x;
    this.minY = options.minY ?? y;
    this.maxY = options.maxY ?? y;

    this.prevX = x;
    this.prevY = y;

    this.attachedItems = [];
  }

  draw(ctx) {
    this.pulsePhase += 0.02;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    if (this.hasSpikes && this.spikeCount > 0) {
      ctx.fillStyle = "#ff0000";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff0000";
      const sw = this.width / this.spikeCount;
      for (let i = 0; i < this.spikeCount; i++) {
        const sx = this.x + i * sw + sw / 2;
        const sy = this.y;
        ctx.beginPath();
        ctx.moveTo(sx,             sy);
        ctx.lineTo(sx - sw / 3,   sy - 16);
        ctx.lineTo(sx + sw / 3,   sy - 16);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    const pulse = Math.sin(this.pulsePhase) * 3 + 10;
    ctx.shadowBlur = pulse;
    ctx.shadowColor = this.outlineColor;
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }

  isPointOnSpikes(x, y) {
    if (!this.hasSpikes) return false;
    // Spike tip zone: 16px above platform surface
    if (y < this.y - 16 || y > this.y + 2) return false;
    // Require x to be within inner 80% of platform to avoid edge false-positives
    const margin = this.width * 0.1;
    if (x < this.x + margin || x > this.x + this.width - margin) return false;
    return true;
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;

    if (this.type === "moving") {
      this.x += this.dx;
      this.y += this.dy;
      if (this.x < this.minX || this.x > this.maxX) this.dx *= -1;
      if (this.y < this.minY || this.y > this.maxY) this.dy *= -1;
    }
  }

  getDeltaX() { return this.x - this.prevX; }
  getDeltaY() { return this.y - this.prevY; }

  attachItem(item) {
    if (!this.attachedItems.includes(item)) {
      this.attachedItems.push(item);
    }
  }
}
