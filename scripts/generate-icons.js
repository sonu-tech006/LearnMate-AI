import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createPNG(width, height, r, g, b) {
  // Simple uncompressed or deflate PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC calculation
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  // Scanlines: filter byte 0 followed by 3 bytes per pixel
  const rowBytes = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Gradient background from indigo to violet
      const t = (x + y) / (width + height);
      let pr = Math.round(79 + (124 - 79) * t);
      let pg = Math.round(70 + (58 - 70) * t);
      let pb = Math.round(229 + (237 - 229) * t);

      // Simple rounded corner
      const cornerR = width * 0.22;
      const inCornerX = x < cornerR ? cornerR - x : x > width - cornerR ? x - (width - cornerR) : 0;
      const inCornerY = y < cornerR ? cornerR - y : y > height - cornerR ? y - (height - cornerR) : 0;
      const distCorner = Math.sqrt(inCornerX * inCornerX + inCornerY * inCornerY);

      if (distCorner > cornerR) {
        // Transparent / dark background border
        pr = 30; pg = 27; pb = 75;
      } else {
        // Draw centered stylized motif
        const dx = x - cx;
        const dy = y - cy;
        // Cap diamond
        const dCap = Math.abs(dx) / (width * 0.3) + Math.abs(dy + height * 0.08) / (height * 0.15);
        if (dCap < 1.0) {
          pr = 245; pg = 247; pb = 255;
        }
        // AI Sparkle star below cap
        const sX = Math.abs(dx);
        const sY = Math.abs(dy - height * 0.22);
        if (sX < width * 0.08 && sY < height * 0.08 && (sX * sY < width * height * 0.001)) {
          pr = 253; pg = 224; pb = 71;
        }
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPNG(180, 180));
console.log('PWA PNG icons generated successfully!');
