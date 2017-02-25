export default class NesHeader {
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