// Camera Class
// Handles smooth camera scrolling that follows the player

export class Camera {
  constructor(x, y, canvasWidth, canvasHeight, levelLength = 0) {
    this.x = x;
    this.y = y;
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.followSpeed = 0.08; // Smoother following for long maps
    this.deadZoneX = 150; // Tighter dead zone for better tracking
    this.levelLength = levelLength;
    this.maxX = 0;
  }

  // Set level length for camera clamping
  setLevelLength(levelLength) {
    this.levelLength = levelLength;
    this.maxX = Math.max(0, levelLength - this.width);
  }

  // Update camera position to follow player
  follow(player) {
    // Calculate the center point
    const playerCenterX = player.x + player.width / 2;
    const cameraCenterX = this.x + this.width / 2;

    // Only move camera if player is outside the dead zone
    const distanceX = playerCenterX - cameraCenterX;

    if (Math.abs(distanceX) > this.deadZoneX) {
      // Smoothly move camera towards player
      const targetX = playerCenterX - this.width / 2;
      this.x += (targetX - this.x) * this.followSpeed;
    }

    // Clamp camera to level bounds
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.maxX > 0 && this.x > this.maxX) {
      this.x = this.maxX;
    }
  }

  // Apply camera transformation to canvas
  apply(ctx) {
    ctx.translate(-this.x, -this.y);
  }

  // Reset camera transformation
  reset(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Check if an object is visible in camera view
  isVisible(object) {
    return (
      object.x + (object.width || object.size || 0) > this.x &&
      object.x < this.x + this.width &&
      object.y + (object.height || object.size || 0) > this.y &&
      object.y < this.y + this.height
    );
  }

  // Update camera dimensions on resize
  resize(width, height) {
    this.width = width;
    this.height = height;
    if (this.levelLength > 0) {
      this.maxX = Math.max(0, this.levelLength - this.width);
    }
  }
}





