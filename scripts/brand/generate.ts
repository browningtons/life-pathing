// Generates the Life Pathing mark as plain SVG: the vector masters every
// icon, header and share image is cut from. Run with `npm run brand:generate`,
// then `scripts/brand/rasterize.sh` for the PNG and ICO files.
//
// The wheel, outside in:
//   - a base-60 dial (Babylon)
//   - the twelve Life Path numbers in Maya bar-and-dot, where a clock's hours sit
//   - the eight trigrams in Fu Xi order (the I Ching)
//   - the tetractys at the center (Pythagoras), its apex in pink
//
// No <style>, no <text>: every file renders the same in any browser, editor
// or image pipeline.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BRAND = join(ROOT, 'src', 'assets', 'brand');

// ── Palette ───────────────────────────────────────────────────────────

const INK = '#4338ca'; // indigo 700: lines on white, small marks
const DEEP = '#312e81'; // indigo 900: grounds, same as the hero card
const PINK = '#fb7aae'; // the one accent: the tetractys apex, a highlighted number
const MID = '#8b8fe8'; // secondary lines on white
const SOFT = '#c7caff'; // secondary lines on the deep ground
const WHITE = '#ffffff';

// ── Primitives ────────────────────────────────────────────────────────

const n = (v: number) => String(Math.round(v * 100) / 100);

const svg = (body: string, size = 400, vb = 400) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${vb} ${vb}">${body}</svg>\n`;

const circle = (cx: number, cy: number, r: number, fill = 'none', stroke?: string, sw?: number) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"${
    stroke ? ` stroke="${stroke}" stroke-width="${n(sw ?? 1)}"` : ''
  }/>`;

const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, sw: number) =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(sw)}"/>`;

const pill = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(h / 2)}" fill="${fill}"/>`;

/** Point at `r` from center `c`, `deg` degrees clockwise from the top. */
const polar = (c: number, r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [c + r * Math.sin(a), c - r * Math.cos(a)];
};

const placed = (x: number, y: number, deg: number, body: string) =>
  `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(deg)})">${body}</g>`;

// ── Maya bar-and-dot ──────────────────────────────────────────────────
// A dot is one, a bar is five, dots sit above bars. From 20 up the number
// takes a second, higher level (base 20), so 22 is one dot over two dots.

interface MayaSize {
  w: number;
  barH: number;
  dotR: number;
  gap: number;
  dotGap: number;
  levelGap: number;
}

const RING_NUMERAL: MayaSize = { w: 30, barH: 5.2, dotR: 2.9, gap: 2.9, dotGap: 7.6, levelGap: 5.2 };
const CENTER_NUMERAL: MayaSize = { w: 84, barH: 14, dotR: 7.6, gap: 8, dotGap: 19.5, levelGap: 14 };

const mayaLevel = (k: number, s: MayaSize, fill: string, top: number) => {
  const parts: string[] = [];
  let y = top;
  const dots = k % 5;
  const bars = Math.floor(k / 5);
  if (dots) {
    const span = (dots - 1) * s.dotGap;
    for (let i = 0; i < dots; i++) parts.push(circle(-span / 2 + i * s.dotGap, y + s.dotR, s.dotR, fill));
    y += s.dotR * 2 + s.gap;
  }
  for (let b = 0; b < bars; b++) {
    parts.push(pill(-s.w / 2, y, s.w, s.barH, fill));
    y += s.barH + s.gap;
  }
  return { parts, height: y - top - s.gap };
};

/** A Maya numeral centered on (0, 0). */
const maya = (value: number, fill: string, s: MayaSize) => {
  const levels = value >= 20 ? [Math.floor(value / 20), value % 20] : [value];
  // measure, then draw centered
  const heights = levels.map((k) => mayaLevel(k, s, fill, 0).height);
  const total = heights.reduce((a, h) => a + h, 0) + s.levelGap * (levels.length - 1);
  let y = -total / 2;
  const out: string[] = [];
  levels.forEach((k, i) => {
    out.push(...mayaLevel(k, s, fill, y).parts);
    y += heights[i] + s.levelGap;
  });
  return out.join('');
};

const LIFE_PATHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

// ── Trigrams ──────────────────────────────────────────────────────────
// Fu Xi (Earlier Heaven) order, clockwise from the top: Qian, Xun, Kan, Gen,
// Kun, Zhen, Li, Dui. Lines listed bottom first; the bottom line faces the
// center. 1 is a solid (yang) line, 0 a broken (yin) one.

const TRIGRAMS: [number, number, number][] = [
  [1, 1, 1],
  [0, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 0, 0],
  [1, 0, 0],
  [1, 0, 1],
  [1, 1, 0],
];

const trigram = (bits: [number, number, number], fill: string) => {
  const length = 30;
  const th = 4.4;
  const step = 7.6;
  const split = 5.5;
  return bits
    .map((bit, i) => {
      const y = step - i * step - th / 2;
      if (bit) return pill(-length / 2, y, length, th, fill);
      const seg = (length - split) / 2;
      return pill(-length / 2, y, seg, th, fill) + pill(split / 2, y, seg, th, fill);
    })
    .join('');
};

// ── Tetractys ─────────────────────────────────────────────────────────

const tetractys = (cx: number, cy: number, spacing: number, r: number, fill: string, apex: string, rows = 4) => {
  const h = (spacing * Math.sqrt(3)) / 2;
  const count = (rows * (rows + 1)) / 2;
  let rowSum = 0;
  for (let i = 0; i < rows; i++) rowSum += i * (i + 1);
  // sit it by the centroid of its dots, which reads as optically centered
  const y0 = cy - (rowSum / count) * h;
  const out: string[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j <= i; j++) {
      out.push(circle(cx + (j - i / 2) * spacing, y0 + i * h, r, i === 0 ? apex : fill));
    }
  }
  return out.join('');
};

// ── The wheel ─────────────────────────────────────────────────────────

interface WheelOptions {
  ink: string;
  lines: string;
  accent: string;
  ground?: string;
  /** A Life Path to show at the center and pick out on the ring. */
  number?: number;
}

const wheel = ({ ink, lines, accent, ground, number }: WheelOptions) => {
  const c = 200;
  const b: string[] = [];
  if (ground) b.push(circle(c, c, 200, ground));

  b.push(circle(c, c, 193, 'none', ink, 4));
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const [x1, y1] = polar(c, 191, i * 6);
    const [x2, y2] = polar(c, major ? 177 : 183, i * 6);
    b.push(line(x1, y1, x2, y2, major ? ink : lines, major ? 3 : 1.8));
  }
  b.push(circle(c, c, 170, 'none', ink, 2.6));

  LIFE_PATHS.forEach((value, k) => {
    const [x, y] = polar(c, 151, k * 30);
    b.push(placed(x, y, k * 30, maya(value, value === number ? accent : ink, RING_NUMERAL)));
  });
  b.push(circle(c, c, 132, 'none', ink, 2.2));

  TRIGRAMS.forEach((bits, k) => {
    const [x, y] = polar(c, 112, k * 45);
    b.push(placed(x, y, k * 45, trigram(bits, lines)));
  });
  b.push(circle(c, c, 92, 'none', ink, 2.2));

  b.push(
    number === undefined
      ? tetractys(c, c, 21, 6.6, ink, accent)
      : `<g transform="translate(${c} ${c})">${maya(number, accent, CENTER_NUMERAL)}</g>`,
  );
  return b.join('');
};

/** Small cut on a 32 grid: a disk, one ring, the first three rows of the tetractys. */
const small = (withRing: boolean) =>
  [
    circle(16, 16, 16, INK),
    withRing ? circle(16, 16, 13.2, 'none', WHITE, 1.4) : '',
    tetractys(16, 16.3, withRing ? 5.6 : 6.6, withRing ? 1.75 : 2.05, WHITE, PINK, 3),
  ].join('');

/** Square icon on a solid ground; the platform rounds or masks the corners. */
const squareIcon = (body: string, ground: string, scale: number, size: number) => {
  const off = (400 * (1 - scale)) / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400">` +
    `<rect width="400" height="400" fill="${ground}"/>` +
    `<g transform="translate(${n(off)} ${n(off)}) scale(${scale})">${body}</g></svg>\n`
  );
};

// ── Write ─────────────────────────────────────────────────────────────

const write = (path: string, text: string) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

const reversed = { ink: WHITE, lines: SOFT, accent: PINK };

write(join(BRAND, 'mark.svg'), svg(wheel({ ink: INK, lines: MID, accent: PINK })));
write(join(BRAND, 'mark-reversed.svg'), svg(wheel(reversed)));
write(join(BRAND, 'mark-badge.svg'), svg(wheel({ ...reversed, ground: DEEP })));
write(join(BRAND, 'mark-small.svg'), svg(small(true), 32, 32));
write(join(BRAND, 'mark-16.svg'), svg(small(false), 16, 32));
write(join(BRAND, 'app-icon.svg'), squareIcon(wheel(reversed), DEEP, 0.86, 512));
// Android masks to as little as a circle 80% of the canvas; keep the wheel inside it.
write(join(BRAND, 'app-icon-maskable.svg'), squareIcon(wheel(reversed), DEEP, 0.74, 512));
for (const value of LIFE_PATHS) {
  write(
    join(BRAND, 'life-paths', `life-path-${value}.svg`),
    svg(wheel({ ink: INK, lines: MID, accent: PINK, number: value })),
  );
}
write(join(ROOT, 'public', 'favicon.svg'), svg(small(true), 32, 32));

console.log('Wrote the Life Pathing marks to src/assets/brand and public/favicon.svg');
