/**
 * Input Manager - Keyboard, Gamepad, and Touch Controls
 * Unified input system for cross-platform support
 */

import { Body } from 'matter-js';

// Key mappings
const KEY_MAP = {
  // Movement
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  KeyA: 'left',
  KeyD: 'right',
  KeyW: 'up',
  KeyS: 'down',

  // Actions
  Space: 'jump',
  KeyX: 'attack',
  KeyZ: 'roll',
  KeyF: 'interact',

  // System
  Escape: 'pause',
  KeyP: 'pause'
};

/**
 * Create and initialize input manager
 * @param {object} game - Game instance
 * @returns {object} Input manager
 */
export function createInputManager(game) {
  const input = {
    keys: new Set(),
    gamepadIndex: null,

    // Player movement constants (POC-proven values)
    MOVE_SPEED: 4,
    JUMP_FORCE: 12,
    AIR_CONTROL: 0.8,

    /**
     * Initialize input listeners
     */
    init() {
      // Keyboard events
      window.addEventListener('keydown', (e) => this.onKeyDown(e));
      window.addEventListener('keyup', (e) => this.onKeyUp(e));

      // Touch controls
      this.initTouchControls();

      // Gamepad detection
      window.addEventListener('gamepadconnected', (e) => {
        console.log('Gamepad connected:', e.gamepad.id);
        this.gamepadIndex = e.gamepad.index;
      });

      window.addEventListener('gamepaddisconnected', () => {
        this.gamepadIndex = null;
      });
    },

    /**
     * Handle key down event
     * @param {KeyboardEvent} e - Keyboard event
     */
    onKeyDown(e) {
      const action = KEY_MAP[e.code];
      if (action) {
        this.keys.add(action);
        e.preventDefault();
      }
    },

    /**
     * Handle key up event
     * @param {KeyboardEvent} e - Keyboard event
     */
    onKeyUp(e) {
      const action = KEY_MAP[e.code];
      if (action) {
        this.keys.delete(action);
        e.preventDefault();
      }
    },

    /**
     * Initialize touch controls
     */
    initTouchControls() {
      // Action buttons
      const buttons = document.querySelectorAll('.control-btn');
      buttons.forEach(button => {
        const action = button.dataset.action;

        button.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.keys.add(action);
          button.classList.add('active');
        });

        button.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.keys.delete(action);
          button.classList.remove('active');
        });
      });

      // Virtual joystick (simplified - can be enhanced later)
      const joystickZone = document.getElementById('joystickZone');
      if (joystickZone) {
        let touchId = null;
        let startX = 0;

        joystickZone.addEventListener('touchstart', (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          touchId = touch.identifier;
          startX = touch.clientX;
        });

        joystickZone.addEventListener('touchmove', (e) => {
          e.preventDefault();
          if (touchId === null) return;

          const touch = Array.from(e.touches).find(t => t.identifier === touchId);
          if (!touch) return;

          const deltaX = touch.clientX - startX;

          // Clear directional keys
          this.keys.delete('left');
          this.keys.delete('right');

          // Set direction based on delta
          if (deltaX < -20) {
            this.keys.add('left');
          } else if (deltaX > 20) {
            this.keys.add('right');
          }
        });

        joystickZone.addEventListener('touchend', (e) => {
          e.preventDefault();
          touchId = null;
          this.keys.delete('left');
          this.keys.delete('right');
        });
      }
    },

    /**
     * Update player movement based on input
     */
    update() {
      if (!game.player) return;

      const player = game.player;
      const body = player.body;

      // Horizontal movement
      let moveX = 0;
      if (this.keys.has('left')) moveX -= 1;
      if (this.keys.has('right')) moveX += 1;

      if (moveX !== 0) {
        // Update facing direction
        player.facing = moveX;

        // Apply movement force
        const speed = player.grounded ? this.MOVE_SPEED : this.MOVE_SPEED * this.AIR_CONTROL;
        Body.setVelocity(body, {
          x: moveX * speed,
          y: body.velocity.y
        });

        // Set animation state
        player.state = 'walking';
      } else if (player.grounded) {
        // Idle state
        player.state = 'idle';

        // Apply friction to stop movement
        Body.setVelocity(body, {
          x: body.velocity.x * 0.8,
          y: body.velocity.y
        });
      }

      // Jump
      if (this.keys.has('jump') && player.grounded) {
        Body.setVelocity(body, {
          x: body.velocity.x,
          y: -this.JUMP_FORCE
        });
        player.state = 'jumping';
        this.keys.delete('jump'); // Prevent repeated jumps
      }

      // Attack
      if (this.keys.has('attack')) {
        player.state = 'attacking';
        this.keys.delete('attack');
        // TODO: Implement attack logic
      }

      // Roll
      if (this.keys.has('roll')) {
        player.state = 'rolling';
        this.keys.delete('roll');
        // TODO: Implement roll logic
      }

      // Interact
      if (this.keys.has('interact')) {
        this.keys.delete('interact');
        // TODO: Implement interact logic (light fires, open doors)
      }

      // Pause
      if (this.keys.has('pause')) {
        this.keys.delete('pause');
        // TODO: Implement pause menu
      }

      // Read gamepad input
      this.updateGamepad();
    },

    /**
     * Update gamepad input
     */
    updateGamepad() {
      if (this.gamepadIndex === null) return;

      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[this.gamepadIndex];
      if (!gamepad) return;

      // Axes (left stick)
      const axisX = gamepad.axes[0];
      const axisY = gamepad.axes[1];

      // Apply deadzone
      const DEADZONE = 0.2;

      if (Math.abs(axisX) > DEADZONE) {
        if (axisX < 0) {
          this.keys.add('left');
        } else {
          this.keys.add('right');
        }
      }

      // Buttons
      if (gamepad.buttons[0].pressed) { // A button
        this.keys.add('jump');
      }
      if (gamepad.buttons[1].pressed) { // B button
        this.keys.add('roll');
      }
      if (gamepad.buttons[2].pressed) { // X button
        this.keys.add('attack');
      }
      if (gamepad.buttons[3].pressed) { // Y button
        this.keys.add('interact');
      }
    },

    /**
     * Clean up event listeners
     */
    destroy() {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }
  };

  input.init();
  return input;
}
