#!/usr/bin/env bash
# Rasterizes the SVG masters in src/assets/brand into the files browsers and
# phones ask for, and screenshots og.html into the share image.
#
#   npm run brand:generate && scripts/brand/rasterize.sh
#
# Needs Google Chrome (run headless; set CHROME to its binary if it lives
# somewhere else) and Python 3 with Pillow. Each mark renders at 1024 px and
# is scaled down, so the small sizes come from a clean large render.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BRAND="$ROOT/src/assets/brand"
PUBLIC="$ROOT/public"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

chrome() {
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --virtual-time-budget=8000 "$@" >/dev/null 2>&1
}

render() { # <svg> <out.png>: the SVG at 1024 x 1024 on a clear background
  printf '<html><body style="margin:0"><img src="file://%s" style="display:block;width:1024px;height:1024px"></body></html>' \
    "$1" > "$TMP/page.html"
  chrome --window-size=1024,1024 --screenshot="$2" "file://$TMP/page.html"
}

render "$BRAND/mark-16.svg" "$TMP/mark-16.png"
render "$BRAND/mark-small.svg" "$TMP/mark-small.png"
render "$BRAND/app-icon.svg" "$TMP/app-icon.png"
render "$BRAND/app-icon-maskable.svg" "$TMP/app-icon-maskable.png"
chrome --window-size=1200,630 --screenshot="$TMP/og.png" "file://$ROOT/scripts/brand/og.html"

python3 -I - "$TMP" "$PUBLIC" <<'PY'
import sys
from PIL import Image

tmp, public = sys.argv[1], sys.argv[2]
open_rgba = lambda name: Image.open(f"{tmp}/{name}").convert("RGBA")
fit = lambda im, size: im.resize((size, size), Image.LANCZOS)

# Browser tab: the 16 px cut drops the ring; 32 and 48 keep it.
ico = [fit(open_rgba("mark-16.png"), 16), fit(open_rgba("mark-small.png"), 32), fit(open_rgba("mark-small.png"), 48)]
ico[2].save(f"{public}/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])

# Phones: opaque squares, so iOS never fills a clear corner with black.
app = open_rgba("app-icon.png").convert("RGB")
fit(app, 180).save(f"{public}/apple-touch-icon.png", optimize=True)
fit(app, 192).save(f"{public}/android-chrome-192x192.png", optimize=True)
fit(app, 512).save(f"{public}/android-chrome-512x512.png", optimize=True)
fit(open_rgba("app-icon-maskable.png").convert("RGB"), 512).save(f"{public}/icon-maskable-512.png", optimize=True)

# Share image: flat color, so a 256-color palette keeps it small.
og = Image.open(f"{tmp}/og.png").convert("RGB")
assert og.size == (1200, 630), og.size
og.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(f"{public}/og.png", optimize=True)
print("Wrote favicon.ico, apple-touch-icon.png, android-chrome-192/512, icon-maskable-512.png and og.png to public/")
PY
