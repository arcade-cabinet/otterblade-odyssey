/**
 * InputManager.js
 * Unified input handling for keyboard, gamepad, and touch
 * Implements proper input system per CLAUDE.md line 92
 */

class InputManager {
  constructor() {
    this.keys = {};
    this.gamepad = null;
    this.touch = {
      joystick: { x: 0, y: 0 },
      buttons: {}
    };

    // Input state
    this.state = {
      moveLeft: false,
      moveRight: false,
      jump: false,
      interact: false,
      attack: false,
      pause: false
    };

    // Previous frame state for edge detection
    this.prevState = { ...this.state };

    this.init();
  }

  init() {
    // Keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Gamepad detection
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));

    // Prevent space/arrow default scrolling
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  handleGamepadConnected(e) {
    console.log('Gamepad connected:', e.gamepad);
    this.gamepad = e.gamepad;
  }

  handleGamepadDisconnected(_e) {
    console.log('Gamepad disconnected');
    this.gamepad = null;
  }

  /**
   * Update input state from all sources
   * Call this once per frame
   */
  update() {
    // Store previous state for edge detection
    this.prevState = { ...this.state };

    // Update from keyboard
    this.updateKeyboard();

    // Update from gamepad
    if (this.gamepad) {
      this.updateGamepad();
    }

    // Update from touch (updated externally by TouchControls component)
    this.updateTouch();
  }

  updateKeyboard() {
    // Movement (WASD + Arrows)
    this.state.moveLeft = this.keys.KeyA || this.keys.ArrowLeft;
    this.state.moveRight = this.keys.KeyD || this.keys.ArrowRight;

    // Jump (W, ArrowUp, Space)
    this.state.jump = this.keys.KeyW || this.keys.ArrowUp || this.keys.Space;

    // Interact (E, Enter)
    this.state.interact = this.keys.KeyE || this.keys.Enter;

    // Attack (Left Mouse, J, Z)
    this.state.attack = this.keys.KeyJ || this.keys.KeyZ;

    // Pause (Escape, P)
    this.state.pause = this.keys.Escape || this.keys.KeyP;
  }

  updateGamepad() {
    // Get fresh gamepad state
    const gamepads = navigator.getGamepads();
    if (!gamepads[this.gamepad.index]) return;

    const gp = gamepads[this.gamepad.index];

    // Left stick / D-pad for movement
    const axisX = gp.axes[0]; // Left stick X
    const threshold = 0.2;

    this.state.moveLeft = axisX < -threshold || gp.buttons[14]?.pressed; // D-pad left
    this.state.moveRight = axisX > threshold || gp.buttons[15]?.pressed; // D-pad right

    // Buttons
    this.state.jump = gp.buttons[0]?.pressed; // A / Cross
    this.state.interact = gp.buttons[1]?.pressed; // B / Circle
    this.state.attack = gp.buttons[2]?.pressed; // X / Square
    this.state.pause = gp.buttons[9]?.pressed; // Start
  }

  updateTouch() {
    // Touch input is updated externally by TouchControls component
    // via setTouchJoystick() and setTouchButton()

    const { joystick, buttons } = this.touch;

    // Joystick for movement
    const threshold = 0.2;
    this.state.moveLeft = this.state.moveLeft || joystick.x < -threshold;
    this.state.moveRight = this.state.moveRight || joystick.x > threshold;

    // Touch buttons
    this.state.jump = this.state.jump || buttons.jump;
    this.state.interact = this.state.interact || buttons.interact;
    this.state.attack = this.state.attack || buttons.attack;
  }

  /**
   * Get horizontal movement axis (-1 to 1)
   */
  getAxis() {
    let axis = 0;

    if (this.state.moveLeft) axis -= 1;
    if (this.state.moveRight) axis += 1;

    // Add touch joystick contribution
    if (Math.abs(this.touch.joystick.x) > 0.2) {
      axis = this.touch.joystick.x;
    }

    return axis;
  }

  /**
   * Check if button was just pressed this frame
   */
  isPressed(button) {
    return this.state[button] && !this.prevState[button];
  }

  /**
   * Check if button is currently held
   */
  isHeld(button) {
    return this.state[button];
  }

  /**
   * Check if button was just released this frame
   */
  isReleased(button) {
    return !this.state[button] && this.prevState[button];
  }

  /**
   * Get current input state
   */
  getState() {
    return this.state;
  }

  /**
   * Set touch joystick values (called by TouchControls component)
   */
  setTouchJoystick(x, y) {
    this.touch.joystick.x = x;
    this.touch.joystick.y = y;
  }

  /**
   * Set touch button state (called by TouchControls component)
   */
  setTouchButton(button, pressed) {
    this.touch.buttons[button] = pressed;
  }

  /**
   * Reset all input state
   */
  reset() {
    this.keys = {};
    this.touch = {
      joystick: { x: 0, y: 0 },
      buttons: {}
    };
    this.state = {
      moveLeft: false,
      moveRight: false,
      jump: false,
      interact: false,
      attack: false,
      pause: false
    };
    this.prevState = { ...this.state };
  }

  /**
   * Cleanup
   */
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
  }
}

// Export singleton instance
export const inputManager = new InputManager();
