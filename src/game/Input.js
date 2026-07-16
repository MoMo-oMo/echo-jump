// Input Class
// Handles keyboard input for player controls

export class Input {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      jump: false,
      shoot: false,
      reload: false,
      interact: false,
      escape: false,
    };

    // Track which keys were just pressed this frame
    this.justPressed = {
      left: false,
      right: false,
      jump: false,
      shoot: false,
      reload: false,
      interact: false,
      escape: false,
    };

    this.mouse = {
      x: 0,
      y: 0,
      leftClick: false,
    };

    // Bind events
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);

    // Store previous key states to detect justPressed
    this.previousKeys = { ...this.keys };
  }

  // Update justPressed states (call this once per frame)
  updateJustPressed() {
    Object.keys(this.justPressed).forEach((key) => {
      this.justPressed[key] = this.keys[key] && !this.previousKeys[key];
    });
    this.previousKeys = { ...this.keys };
  }

  // Handle key press
  handleKeyDown(e) {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.keys.left = true;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.keys.right = true;
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case " ":
        this.keys.jump = true;
        e.preventDefault();
        break;
      case "x":
      case "X":
        this.keys.shoot = true;
        break;
      case "r":
      case "R":
        this.keys.reload = true;
        break;
      case "e":
      case "E":
        this.keys.interact = true;
        break;
      case "Escape":
        this.keys.escape = true;
        break;
    }
  }

  // Handle key release
  handleKeyUp(e) {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.keys.left = false;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.keys.right = false;
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case " ":
        this.keys.jump = false;
        break;
      case "x":
      case "X":
        this.keys.shoot = false;
        break;
      case "r":
      case "R":
        this.keys.reload = false;
        break;
      case "e":
      case "E":
        this.keys.interact = false;
        break;
      case "Escape":
        this.keys.escape = false;
        break;
    }
  }

  // Handle mouse down
  handleMouseDown(e) {
    if (e.button === 0) {
      this.mouse.leftClick = true;
      this.keys.shoot = true;
    }
  }

  // Handle mouse up
  handleMouseUp(e) {
    if (e.button === 0) {
      this.mouse.leftClick = false;
      this.keys.shoot = false;
    }
  }

  // Handle mouse move
  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  // Clean up event listeners
  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
  }
}
