class NesHeader {
  constructor(data) {
    // I'm exploiting the fact that any non-zero value is true in JS to avoid
    // bit-shifting

    let isValid = String.fromCharCode(data[0], data[1], data[2]) === "NES";
    if (!isValid) throw new Error('Not a valid NES file.');

    // What type of header is this?
    let version;
    if ((data[7] & 0b1100) >> 2 === 2) {
      version = 'NES 2.0';
    } else if (data.slice(12, 16).reduce((x, y) => x + y) === 0) {
      version = 'iNES';
    } else {
      version = 'Archaic iNES';
    }

    this.prgRomSize =     data[4];
    this.chrRomSize =     data[5];
    this.mirroring =      (data[6] & 1) ? 'Vertical' : 'Horizontal';
    this.battery =        !!(data[6] & 2);
    this.trainer =        !!(data[6] & 4);
    this.fourScreenVram = !!(data[6] & 8);
    this.version =        version;
    this.mapper =         ((data[6] & 0xF0) >> 4) + (data[7] & 0xF0);
    this.vsUnisystem =    !!(data[7] & 1);
    this.playChoice10 =   !!(data[7] & 2);
    this.prgRamSize =     data[8];
    this.tvSystem =       (data[9] & 1) ? 'PAL' : 'NTSC';
  }
}

const CONFIG = {
  debug: false,
};

class ChrData {
  constructor(data) {
    this.raw = data;
    this.length = data.length;
  } 
}

/** Class representing a color. */
class Color {
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

/** Class representing an NES color palette. */
class Palette {
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

;(() => {
  'use strict';

  let nesData;
  let nesHeader;

  const app = new Vue({
    el: "#nes-reader",
    data: {
      nes: undefined,
    }
  });

  const readerHandler = (e) => {
    let imgData, chrBytes, prgBytes, chrIndex, stopIndex;
    let t0 = performance.now();

    let colors = [
      [20, 20, 20, 255],
      [218, 43, 1, 255],
      [255, 155, 59, 255],
      [139, 115, 0, 255]
    ];
    
    nesData = new Uint8Array(e.target.result);
    nesHeader = new NesHeader(nesData);
    app.nes = nesHeader;

    chrBytes = nesHeader.chrRomSize * 8 * 1024;
    prgBytes = nesHeader.prgRomSize * 16 * 1024;
    imgData = new Uint8ClampedArray(chrBytes / 16 * 64 * 4);
    chrIndex = 16 + prgBytes;
    stopIndex = chrIndex + chrBytes - 8;
    
    // Read Loop
    let xOffset = 0, yOffset = 0, pixels = 0;
    for (let y = 0; chrIndex <= stopIndex;) {
      for (let x = 0; x < 8; x++) {
        let ix = Math.abs(x - 7); // invert x to read bytes left to right
        let plane1bit = (nesData[chrIndex] & Math.pow(2, ix)) >> ix;
        let plane2bit = (nesData[chrIndex + 8] & Math.pow(2, ix)) >> ix;
        let color = colors[plane1bit + (plane2bit << 1)];

        for (let z = 0; z < 4; z++) {
          let tileRowOffset = (y % 8) * 4 * 8 * 16;
          let tileColumnOffset = x * 4 + z
          let rowOffset = yOffset * 4 * 8 * 8 * 16;
          let columnOffset = xOffset * 4 * 8;

          let i = rowOffset + columnOffset + tileRowOffset + tileColumnOffset;
          imgData[i] = color[z];
        }

        pixels++;
        if (pixels === 64) {
          xOffset++;
          pixels = 0;
          if (xOffset === 16) {
            xOffset = 0;
          }
        }
      }

      chrIndex++;
      y++;
      if (y % 8 === 0) {
        chrIndex += 8;
      }
      if (y === 128) {
        yOffset++;
        y = 0;
      }
    }

    let t1 = performance.now();
    console.log(`Read Time: ${t1 - t0}ms`);

    t0 = performance.now();

    let canvas = document.querySelector('#canvas');
    let ctx = canvas.getContext('2d');
    let zoomCanvas = document.querySelector('#zoom');
    let zoomCtx = zoomCanvas.getContext('2d');
    let w = 128;
    let h = imgData.length / 512;
    let zw = (w * 3) | 0;
    let zh = (h * 3) | 0;
    let canvasImgData = new ImageData(imgData, w, h);

    // Resize canvas
    canvas.width = w;
    canvas.height = h;
    zoomCanvas.width = zw;
    zoomCanvas.height = zh;

    // Disable pixel smoothing
    zoomCtx.imageSmoothingEnabled = false;
    zoomCtx.webkitImageSmoothingEnabled = false;
    zoomCtx.msImageSmoothingEnabled = false;

    // Draw
    ctx.putImageData(canvasImgData, 0, 0);
    zoomCtx.drawImage(canvas, 0, 0, w, h, 0, 0, zw, zh);

    t1 = performance.now();

    console.log(`Render Time: ${t1 - t0}ms`);

    window.nesData = nesData;
  };

  const main = () => {
    let input = document.querySelector('#nes-file');

    input.addEventListener('change', (e) => {
      let r = new FileReader();
      let f = e.target.files;

      r.onload = readerHandler;

      if (f.length > 0) r.readAsArrayBuffer(f[0]);
    });
  };

  main();
})();