/** Class representing an NES color palette. */
export default class Palette {
  /**
   * Create a palette.
   * @param {Number} color0 - A hex triplet, ex. 0xF0AA26.
   * @param {Number} color1 - A hex triplet.
   * @param {Number} color2 - A hex triplet.
   * @param {Number} color3 - A hex triplet.
   */
  constructor(color0, color1, color2, color3) {
    this.colors = [
      new Color(color0),
      new Color(color1),
      new Color(color2),
      new Color(color3)
    ];
  }

  /**
   * Get the color at the given index.
   * @return {Color} The color at index.
   */
  getColor(index) {
    return this.colors[index];
  }

  /**
   * Replace the color at the given index.
   * @param {Number} index - An index of the palette.
   * @param {Number} color - A hex triplet, ie. 0xFF2598.
   */
  setColor(index, color) {
    this.colors[index] = new Color(color);
  }
}