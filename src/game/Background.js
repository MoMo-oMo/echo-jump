// Enhanced Background Class with Offscreen Canvas Optimization
// Renders space background with parallax stars and planets

export class Background {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.stars = this.generateStars(250);
    this.planets = this.generatePlanets(4);

    // Offscreen canvas for static background
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.needsRedraw = true;

    this.createOffscreenCanvas();
  }

  // Create offscreen canvas for optimization
  createOffscreenCanvas() {
    if (typeof document !== "undefined") {
      this.offscreenCanvas = document.createElement("canvas");
      this.offscreenCanvas.width = this.width;
      this.offscreenCanvas.height = this.height;
      this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    }
  }

  // Generate random stars with different layers for parallax
  generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * this.width * 4, // Extended width for scrolling
        y: Math.random() * this.height,
        size: Math.random() * 2.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * 3), // 0, 1, or 2 for parallax layers
      });
    }
    return stars;
  }

  // Generate planets/celestial bodies
  generatePlanets(count) {
    const planets = [];
    const colors = [
      "#4a0e4e",
      "#1a0033",
      "#0d3d56",
      "#2d1b3d",
      "#3d1f4e",
      "#1e3a5f",
    ];

    for (let i = 0; i < count; i++) {
      planets.push({
        x: Math.random() * this.width * 4,
        y: Math.random() * this.height * 0.5, // Keep in upper portion
        size: Math.random() * 50 + 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        glowColor: colors[Math.floor(Math.random() * colors.length)],
        layer: Math.floor(Math.random() * 2), // 0 or 1 for parallax
      });
    }
    return planets;
  }

  // Update star twinkle animation
  update() {
    this.stars.forEach((star) => {
      star.twinklePhase += star.twinkleSpeed;
    });
  }

  // Draw background with parallax effect
  draw(ctx, cameraX) {
    // Clear with pitch black
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw deep space gradient for depth
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      this.width
    );
    gradient.addColorStop(0, "rgba(10, 10, 30, 0.3)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw planets with parallax (furthest layer)
    this.planets.forEach((planet) => {
      const parallaxX = planet.x - cameraX * (0.15 - planet.layer * 0.05);

      // Only draw if in view (with margin)
      if (parallaxX > -planet.size && parallaxX < this.width + planet.size) {
        // Draw glow
        ctx.shadowBlur = 35;
        ctx.shadowColor = planet.glowColor;
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(parallaxX, planet.y, planet.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw rim light
        const rimGradient = ctx.createRadialGradient(
          parallaxX - planet.size * 0.3,
          planet.y - planet.size * 0.3,
          0,
          parallaxX,
          planet.y,
          planet.size
        );
        rimGradient.addColorStop(0, "rgba(100, 100, 150, 0.4)");
        rimGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = rimGradient;
        ctx.beginPath();
        ctx.arc(parallaxX, planet.y, planet.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }
    });

    // Draw stars with parallax and twinkling
    this.stars.forEach((star) => {
      const parallaxX = star.x - cameraX * (0.3 - star.layer * 0.1);

      // Only draw if in view
      if (parallaxX > -10 && parallaxX < this.width + 10) {
        const twinkle = Math.sin(star.twinklePhase) * 0.4 + 0.6;
        const alpha = star.brightness * twinkle;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

        // Draw star with slight glow
        if (star.size > 1.5) {
          ctx.shadowBlur = 3;
          ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.5})`;
        }

        ctx.beginPath();
        ctx.arc(parallaxX, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }
    });
  }

  // Resize background
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.needsRedraw = true;

    // Recreate offscreen canvas
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
    }
  }
}
