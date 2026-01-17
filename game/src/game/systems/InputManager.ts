/**
 * InputManager.ts
 * Unified input handling for keyboard, gamepad, and touch
 * Implements proper input system per CLAUDE.md line 92
 */

import type { InputSystem } from '../types/systems';

/**
 * Input state interface
 */
interface InputState {
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  interact: boolean;
  attack: boolean;
  pause: boolean;
}

/**
 * Touch input state
 */
interface TouchState {
  joystick: { x: number; y: number };
  buttons: Record<string, boolean>;
}

/**
 * InputManager class - implements InputSystem interface
 */
class InputManager implements InputSystem {
  name = 'InputManager';

  // Private internal state
  private keys: Record<string, boolean> = {};
  private gamepadInstance: Gamepad | null = null;
  private touchState: TouchState = {
    joystick: { x: 0, y: 0 },
    buttons: {},
  };

  // Public interface (matches InputSystem)
  keyboard = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    interact: false,
  };

  gamepad = {
    connected: false,
    left: 0,
    right: 0,
    jump: false,
    attack: false,
  };

  touch = {
    active: false,
    joystick: { x: 0, y: 0 } as { x: number; y: number } | null,
  };

  // Input state
  state: InputState = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    interact: false,
    attack: false,
    pause: false,
  };

  // Previous frame state for edge detection
  prevState: InputState = { ...this.state };
  private readonly keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
  private readonly keyUpHandler = (e: KeyboardEvent) => this.handleKeyUp(e);
  private readonly gamepadConnectedHandler = (e: GamepadEvent) => this.handleGamepadConnected(e);
  private readonly gamepadDisconnectedHandler = (e: GamepadEvent) =>
    this.handleGamepadDisconnected(e);

  constructor() {
    this.init();
  }

  init(): void {
    // Keyboard listeners
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // Gamepad detection
    window.addEventListener('gamepadconnected', this.gamepadConnectedHandler);
    window.addEventListener('gamepaddisconnected', this.gamepadDisconnectedHandler);

    // Prevent space/arrow default scrolling
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;
  }

  handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  handleGamepadConnected(e: GamepadEvent): void {
    this.gamepadInstance = e.gamepad;
    this.gamepad.connected = true;
  }

  handleGamepadDisconnected(_e: GamepadEvent): void {
    this.gamepadInstance = null;
    this.gamepad.connected = false;
  }

  /**
   * Update input state from all sources
   * Call this once per frame
   */
  update(_deltaTime?: number): void {
    // Store previous state for edge detection
    this.prevState = { ...this.state };

    // Update from keyboard
    this.updateKeyboard();

    // Update from gamepad
    if (this.gamepadInstance) {
      this.updateGamepad();
    }

    // Update from touch (updated externally by TouchControls component)
    this.updateTouch();
  }

  updateKeyboard(): void {
    // Movement (WASD + Arrows)
    this.state.moveLeft = this.keys.KeyA || this.keys.ArrowLeft;
    this.state.moveRight = this.keys.KeyD || this.keys.ArrowRight;
    this.keyboard.left = this.state.moveLeft;
    this.keyboard.right = this.state.moveRight;

    // Jump (W, ArrowUp, Space)
    this.state.jump = this.keys.KeyW || this.keys.ArrowUp || this.keys.Space;
    this.keyboard.jump = this.state.jump;

    // Interact (E, Enter)
    this.state.interact = this.keys.KeyE || this.keys.Enter;
    this.keyboard.interact = this.state.interact;

    // Attack (Left Mouse, J, Z)
    this.state.attack = this.keys.KeyJ || this.keys.KeyZ;
    this.keyboard.attack = this.state.attack;

    // Pause (Escape, P)
    this.state.pause = this.keys.Escape || this.keys.KeyP;
  }

  updateGamepad(): void {
    // Get fresh gamepad state
    const gamepads = navigator.getGamepads();
    if (!this.gamepadInstance || !gamepads[this.gamepadInstance.index]) return;

    const gp = gamepads[this.gamepadInstance.index];
    if (!gp) return;

    // Left stick / D-pad for movement
    const axisX = gp.axes[0]; // Left stick X
    const threshold = 0.2;

    this.state.moveLeft = axisX < -threshold || (gp.buttons[14]?.pressed ?? false); // D-pad left
    this.state.moveRight = axisX > threshold || (gp.buttons[15]?.pressed ?? false); // D-pad right
    this.gamepad.left = axisX < -threshold ? axisX : 0;
    this.gamepad.right = axisX > threshold ? axisX : 0;

    // Buttons
    this.state.jump = gp.buttons[0]?.pressed ?? false; // A / Cross
    this.state.interact = gp.buttons[1]?.pressed ?? false; // B / Circle
    this.state.attack = gp.buttons[2]?.pressed ?? false; // X / Square
    this.state.pause = gp.buttons[9]?.pressed ?? false; // Start

    this.gamepad.jump = this.state.jump;
    this.gamepad.attack = this.state.attack;
  }

  updateTouch(): void {
    // Touch input is updated externally by TouchControls component
    // via setTouchJoystick() and setTouchButton()

    const { joystick, buttons } = this.touchState;

    // Joystick for movement
    const threshold = 0.2;
    this.state.moveLeft = this.state.moveLeft || joystick.x < -threshold;
    this.state.moveRight = this.state.moveRight || joystick.x > threshold;

    // Touch buttons
    this.state.jump = this.state.jump || buttons.jump;
    this.state.interact = this.state.interact || buttons.interact;
    this.state.attack = this.state.attack || buttons.attack;

    // Update touch properties
    this.touch.active = Math.abs(joystick.x) > 0.1 || Math.abs(joystick.y) > 0.1;
    this.touch.joystick = { x: joystick.x, y: joystick.y };
  }

  /**
   * Get horizontal movement axis (-1 to 1)
   */
  getAxis(): number {
    let axis = 0;

    if (this.state.moveLeft) axis -= 1;
    if (this.state.moveRight) axis += 1;

    // Add touch joystick contribution
    if (Math.abs(this.touchState.joystick.x) > 0.2) {
      axis = this.touchState.joystick.x;
    }

    return axis;
  }

  /**
   * Check if button was just pressed this frame
   */
  isPressed(button: string): boolean {
    const buttonKey = button as keyof InputState;
    return this.state[buttonKey] && !this.prevState[buttonKey];
  }

  /**
   * Check if button is currently held
   */
  isHeld(button: string): boolean {
    return this.state[button as keyof InputState];
  }

  /**
   * Check if button was just released this frame
   */
  isReleased(button: string): boolean {
    const buttonKey = button as keyof InputState;
    return !this.state[buttonKey] && this.prevState[buttonKey];
  }

  /**
   * Get current input state
   */
  getState(): InputState {
    return this.state;
  }

  /**
   * Set touch joystick values (called by TouchControls component)
   */
  setTouchJoystick(x: number, y: number): void {
    this.touchState.joystick.x = x;
    this.touchState.joystick.y = y;
  }

  /**
   * Set touch button state (called by TouchControls component)
   */
  setTouchButton(button: string, pressed: boolean): void {
    this.touchState.buttons[button] = pressed;
  }

  /**
   * Reset all input state
   */
  reset(): void {
    this.keys = {};
    this.touchState = {
      joystick: { x: 0, y: 0 },
      buttons: {},
    };
    this.state = {
      moveLeft: false,
      moveRight: false,
      jump: false,
      interact: false,
      attack: false,
      pause: false,
    };
    this.prevState = { ...this.state };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    window.removeEventListener('gamepadconnected', this.gamepadConnectedHandler);
    window.removeEventListener('gamepaddisconnected', this.gamepadDisconnectedHandler);
  }

  destroy(): void {
    this.cleanup();
  }
}

// Export singleton instance (lazy initialization for SSR compatibility)
const _instance: InputManager | null = null;
export const inputManager = typeof window !== 'undefined' ? new InputManager() : null;

export default InputManager;
