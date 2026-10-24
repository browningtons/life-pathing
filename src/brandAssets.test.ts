/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The icons and share image are files the page only names in index.html and
// site.webmanifest, so nothing else fails when one goes missing or drifts.

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = join(ROOT, 'public');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(PUBLIC, 'site.webmanifest'), 'utf8')) as {
  icons: { src: string; sizes: string; purpose: string }[];
};

const SITE = 'https://lifepathing.app';

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (path: string) => {
  const b = readFileSync(path);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

/** Colour type 2 is RGB, 3 is palette without transparency: no clear pixels. */
const pngIsOpaque = (path: string) => {
  const b = readFileSync(path);
  return b[25] === 2 || (b[25] === 3 && !b.includes(Buffer.from('tRNS')));
};

const meta = (property: string) => html.match(new RegExp(`(?:property|name)="${property}" content="([^"]+)"`))?.[1];

describe('brand assets', () => {
  it('every icon and the manifest the head links to exists', () => {
    const hrefs = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*href="(\/[^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/site.webmanifest']);
    for (const href of hrefs) expect(existsSync(join(PUBLIC, href)), href).toBe(true);
  });

  it('every manifest icon exists at the size it claims, with a maskable one', () => {
    for (const icon of manifest.icons) {
      const path = join(PUBLIC, icon.src);
      expect(existsSync(path), icon.src).toBe(true);
      const { width, height } = pngSize(path);
      expect(`${width}x${height}`).toBe(icon.sizes);
    }
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });

  it('phone icons are opaque, so iOS has no clear corner to paint black', () => {
    for (const name of ['apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'icon-maskable-512.png']) {
      expect(pngIsOpaque(join(PUBLIC, name)), name).toBe(true);
    }
    expect(pngSize(join(PUBLIC, 'apple-touch-icon.png'))).toEqual({ width: 180, height: 180 });
  });

  it('the share image matches its tags and points at the live domain', () => {
    const og = join(PUBLIC, 'og.png');
    const { width, height } = pngSize(og);
    expect(String(width)).toBe(meta('og:image:width'));
    expect(String(height)).toBe(meta('og:image:height'));
    expect(readFileSync(og).length).toBeLessThan(300 * 1024);
    expect(meta('og:image')).toBe(`${SITE}/og.png`);
    expect(meta('twitter:image')).toBe(`${SITE}/og.png`);
    expect(meta('og:url')).toBe(SITE);
    expect(html).toContain(`<link rel="canonical" href="${SITE}" />`);
  });
});
