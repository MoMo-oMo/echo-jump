// Ending Flag (Mario-style)
// Touching this flag completes the level

export class EndingFlag {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 120;
    this.touched = false;
    this.pulsePhase = 0;
    this.wavePhase = 0;
  }

  update(player) {
    this.pulsePhase += 0.08;
    this.wavePhase += 0.1;

    // Check collision with player
    const touching = player.x < this.x + this.width &&
                     player.x + player.width > this.x &&
                     player.y < this.y + this.height &&
                     player.y + player.height > this.y;

    if (touching && !this.touched) {
      this.touched = true;
      return true; // Signal level complete
    }

    return false;
  }

  draw(ctx) {
    ctx.save();

    const pulse = Math.sin(this.pulsePhase) * 8 + 20;
    ctx.shadowBlur = pulse;
    ctx.shadowColor = "#00ff00";

    // Draw pole
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x + 20, this.y, 10, this.height);

    // Draw flag with wave effect
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.moveTo(this.x + 30, this.y + 10);
    
    const waveOffset = Math.sin(this.wavePhase) * 5;
    ctx.lineTo(this.x + 50 + waveOffset, this.y + 25);
    ctx.lineTo(this.x + 30, this.y + 40);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw checkered pattern on flag
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(
            this.x + 32 + i * 8,
            this.y + 15 + j * 10,
            8,
            10
          );
        }
      }
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

// Create ending flag at the end of the level
export function createEndingFlag(levelLength) {
  const flagX = levelLength - 100;
  const flagY = 550 - 120; // Ground Y - flag height
  return new EndingFlag(flagX, flagY);
}
