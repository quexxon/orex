import Vue from 'vue';

import Color from 'lib/color';
import Palette from 'lib/palette';
import NesHeader from 'lib/header';

import { CONFIG } from 'config';

let nesData;
let nesHeader;

const initReader = (e) => {
  let r = new FileReader();
  let f = e.target.files;

  r.onload = readerHandler;

  if (f.length > 0) r.readAsArrayBuffer(f[0]);
};

const app = new Vue({
  el: "#orex",
  data: {
    nes: undefined,
  },
  methods: {
    initReader,
  },
  template: "#main"
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