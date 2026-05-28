// Erzeugt PNG-App-Icons ohne externe Abhaengigkeiten (reiner Node + zlib).
// Zeichnet ein Haus-Symbol auf einen Brand-Farbverlauf.
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public");
mkdirSync(outDir, { recursive: true });

// --- PNG-Encoder ---------------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- Zeichnen ------------------------------------------------------------
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const top = [45, 212, 191]; // brand-400
const bottom = [15, 118, 110]; // brand-700

function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function render(N, maskable) {
  const buf = Buffer.alloc(N * N * 4);
  const radius = maskable ? 0 : N * 0.22;
  const inset = maskable ? 0 : 0; // Hintergrund fuellt ganze Flaeche
  const set = (x, y, r, g, b, a) => {
    const i = (y * N + x) * 4;
    // einfache Alpha-Komposition ueber bestehendem Pixel
    const ba = buf[i + 3] / 255;
    const na = a / 255;
    const oa = na + ba * (1 - na);
    if (oa === 0) return;
    buf[i] = Math.round((r * na + buf[i] * ba * (1 - na)) / oa);
    buf[i + 1] = Math.round((g * na + buf[i + 1] * ba * (1 - na)) / oa);
    buf[i + 2] = Math.round((b * na + buf[i + 2] * ba * (1 - na)) / oa);
    buf[i + 3] = Math.round(oa * 255);
  };

  const insetR = inset;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // gerundetes Rechteck als Hintergrund
      let inside = true;
      const minX = insetR + radius,
        maxX = N - insetR - radius,
        minY = insetR + radius,
        maxY = N - insetR - radius;
      if (x < insetR || y < insetR || x >= N - insetR || y >= N - insetR) inside = false;
      else if (x < minX && y < minY) inside = (x - minX) ** 2 + (y - minY) ** 2 <= radius ** 2;
      else if (x > maxX && y < minY) inside = (x - maxX) ** 2 + (y - minY) ** 2 <= radius ** 2;
      else if (x < minX && y > maxY) inside = (x - minX) ** 2 + (y - maxY) ** 2 <= radius ** 2;
      else if (x > maxX && y > maxY) inside = (x - maxX) ** 2 + (y - maxY) ** 2 <= radius ** 2;
      if (!inside) continue;
      const t = y / N;
      set(x, y, lerp(top[0], bottom[0], t), lerp(top[1], bottom[1], t), lerp(top[2], bottom[2], t), 255);
    }
  }

  // Haus (weiss)
  const s = maskable ? 0.62 : 0.74; // Skalierung des Glyphs (maskable kleiner -> Safe-Zone)
  const o = (1 - s) / 2;
  const X = (f) => (o + f * s) * N;
  const Y = (f) => (o + f * s) * N;
  const apexX = X(0.5),
    apexY = Y(0.16);
  const roofL = X(0.12),
    roofR = X(0.88),
    roofY = Y(0.46);
  const bodyL = X(0.22),
    bodyR = X(0.78),
    bodyT = Y(0.46),
    bodyB = Y(0.86);
  const doorL = X(0.44),
    doorR = X(0.56),
    doorT = Y(0.62),
    doorB = Y(0.86);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inRoof = inTriangle(x + 0.5, y + 0.5, apexX, apexY, roofL, roofY, roofR, roofY);
      const inBody = x >= bodyL && x <= bodyR && y >= bodyT && y <= bodyB;
      const inDoor = x >= doorL && x <= doorR && y >= doorT && y <= doorB;
      if ((inRoof || inBody) && !inDoor) set(x, y, 255, 255, 255, 255);
    }
  }
  return encodePNG(N, N, buf);
}

const targets = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-512-maskable.png", 512, true],
  ["apple-touch-icon.png", 180, false],
  ["favicon-48.png", 48, false],
];
for (const [name, size, mask] of targets) {
  writeFileSync(join(outDir, name), render(size, mask));
  console.log("geschrieben:", name);
}
