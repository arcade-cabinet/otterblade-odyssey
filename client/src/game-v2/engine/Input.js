/**
 * Input Manager - Keyboard + Touch
 */

export class InputManager {
  constructor() {
    this.keys = {};
    this.touches = [];
    this.commands = {
      left: false,
      right: false,
      jump: false,
      attack: false,
      roll: false
    };

    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.updateCommands();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.updateCommands();
    });
  }

  setupTouch() {
    // Touch controls for mobile
    window.addEventListener('touchstart', (e) => {
      this.touches = Array.from(e.touches);
      this.updateCommands();
    });

    window.addEventListener('touchend', (e) => {
      this.touches = Array.from(e.touches);
      this.updateCommands();
    });
  }

  updateCommands() {
    this.commands.left = this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'];
    this.commands.right = this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'];
    this.commands.jump = this.keys[' '] || this.keys['w'] || this.keys['W'] || this.keys['ArrowUp'];
    this.commands.attack = this.keys['x'] || this.keys['X'] || this.keys['j'] || this.keys['J'];
    this.commands.roll = this.keys['z'] || this.keys['Z'] || this.keys['k'] || this.keys['K'];
  }

  getCommands() {
    return this.commands;
  }
}
