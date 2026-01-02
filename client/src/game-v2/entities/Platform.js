/**
 * Platform Entity
 */

export class Platform {
  constructor(x, y, width, height, type = 'ground') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.solid = true;
  }
}
