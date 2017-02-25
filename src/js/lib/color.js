/** Class representing a color. */
export default class Color {
  /**
   * Create a color.
   * @param {Number} color - A hex triplet, ex. 0xF0AA26.
   */
  constructor(color) {
    this.value = color;
    this.red   = (color & 0xFF0000) >> 16;
    this.green = (color & 0xFF00) >> 8;
    this.blue  = color & 0xFF;
  }

  /**
   * Get a CSS-friendly hexadecimal representation of the color.
   * @return {String} The hexadecimal representation of the color.
   */
  toHexString() {
    return `#${this.value.toString(16)}`;
  }

  /**
   * Get a CSS-friendly RGB representation of the color.
   * @return {String} The RGB representation of the color.
   */
  toRgbString() {
    return `rgb(${this.red},${this.green},${this.blue})`;
  }

  /**
   * Get the default string representation of the color.
   * @return {String} The default string representation of the color.
   */
  toString() {
    return this.toHexString();
  }

  /**
   * Get an ImageData representation of a single pixel of the color.
   * @return {Number[]} The ImageData representation of a pixel of the color.
   */
  toImageDataPixel() {
    return [this.red, this.green, this.blue, 255];
  }
}