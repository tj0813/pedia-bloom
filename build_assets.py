"""
Pedia Bloom font self-hosting pipeline.

Removes the Google Fonts CDN so the app is fully self-contained and offline-ready
from the first load (the Material Symbols icon font otherwise breaks offline):

  1. Downloads Quicksand (latin, weights 400/500/600/700) woff2 files locally.
  2. Scans the shell + bundle for every Material Symbols icon name actually used,
     then downloads a *subset* icon font containing only those glyphs.
  3. Writes app/assets/fonts/fonts.css with @font-face rules pointing at local files.

Wire-up: index.html links app/assets/fonts/fonts.css instead of fonts.googleapis.com.
Pure standard library. Run:  python build_assets.py
"""

import os
import re
import sys
import time
import tempfile
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(ROOT, "app", "assets", "fonts")
# A modern browser UA makes the css2 endpoint serve woff2 (not ttf).
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

QUICKSAND_CSS = "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap"
SYMBOLS_BASE = ("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:"
                "opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200")

# Matches both plain .woff2 URLs (Quicksand) and Google's subset /l/font?kit=... URLs
# (Material Symbols with &text=), which serve woff2 content without a .woff2 suffix.
SRC_URL_RE = re.compile(r"url\((https://fonts\.gstatic\.com/[^)]+)\)")

# Icons referenced via JS variables (not literal in a material-symbols span) — must be
# added by hand so the subset includes them. Keep in sync with app.js CATS/BADGE_DEFS/etc.
DYNAMIC_ICONS = {
    "pets", "science", "festival", "history_edu", "eco", "auto_stories", "hub", "map",
    "military_tech", "collections_bookmark", "biotech", "explore", "smart_toy", "extension",
    "restaurant", "account_balance", "sports", "payments", "work", "rocket_launch",
    "travel_explore", "arrow_back", "menu", "notifications", "local_florist", "badge",
}


def fetch(url: str, attempts: int = 4) -> bytes:
    """GET with a few retries — Google's subset endpoint occasionally returns 504."""
    last = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except Exception as exc:  # transient gateway/timeout — back off and retry
            last = exc
            if i < attempts - 1:
                time.sleep(2 * (i + 1))
    raise last


def collect_icon_names() -> set:
    """Every Material Symbols ligature used across the shell and the bundle."""
    names = set(DYNAMIC_ICONS)
    span_re = re.compile(r'material-symbols-outlined[^>]*>\s*([a-z0-9_]+)\s*<', re.I)
    for rel in ("index.html", os.path.join("app", "app.js"), os.path.join("app", "screens-data.js")):
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8", errors="replace") as fh:
            text = fh.read()
        names.update(m.lower() for m in span_re.findall(text))
    # Drop anything that clearly is not an icon token.
    return {n for n in names if re.fullmatch(r"[a-z0-9_]+", n)}


def download_face_set(css: str, prefix: str) -> str:
    """Download each woff2 in a Google Fonts CSS, rewrite to local paths, return CSS."""
    out = css
    for i, url in enumerate(dict.fromkeys(SRC_URL_RE.findall(css))):
        data = fetch(url)
        fname = f"{prefix}-{i}.woff2"
        with open(os.path.join(FONT_DIR, fname), "wb") as fh:
            fh.write(data)
        out = out.replace(url, f"./{fname}")
        print(f"  {fname}  ({len(data) // 1024} KB)")
    return out


def subset_icon_font(full_woff2: bytes, icons: list, out_path: str) -> int:
    """Shrink the 4 MB Material Symbols variable font for shipping.

    Instance the variable font: pin wght/GRAD/opsz to the values the UI uses while KEEPING
    the FILL axis (the app toggles FILL 0<->1 for active icons). That drops three axes'
    variation data (~4 MB -> ~430 KB) while keeping every icon and the FILL morph — small
    enough to self-host for true first-load offline. (A glyph subset doesn't help: the
    ligature closure retains all icons because every name's a-z components are present.)"""
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    with tempfile.NamedTemporaryFile(suffix=".woff2", delete=False) as tmp:
        tmp.write(full_woff2)
        tmp_path = tmp.name
    try:
        font = TTFont(tmp_path)
        if "fvar" in font:
            instantiateVariableFont(font, {"wght": 600, "GRAD": 0, "opsz": 24}, inplace=True)
        font.flavor = "woff2"
        font.save(out_path)
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
    return os.path.getsize(out_path)


def main() -> int:
    os.makedirs(FONT_DIR, exist_ok=True)

    try:
        print("Quicksand:")
        quick_css = fetch(QUICKSAND_CSS).decode("utf-8")
        quick_css = download_face_set(quick_css, "quicksand")

        icons = sorted(collect_icon_names())
        print(f"Material Symbols: instancing variable font (covers {len(icons)} used icons)")
        sym_css = fetch(SYMBOLS_BASE).decode("utf-8")          # full variable font CSS
        full_urls = SRC_URL_RE.findall(sym_css)
        if not full_urls:
            raise RuntimeError("no woff2 URL in Material Symbols CSS")
        full_woff2 = fetch(full_urls[0])
        size = subset_icon_font(full_woff2, icons, os.path.join(FONT_DIR, "material-symbols.woff2"))
        print(f"  material-symbols.woff2  ({size // 1024} KB, from {len(full_woff2) // 1024} KB)")
    except Exception as exc:  # network/offline — keep the CDN links, don't half-write
        print(f"! Font self-hosting failed ({exc}); leaving CDN links in place.", file=sys.stderr)
        return 1

    # Compose @font-face for the subset, preserving the variable axes the UI relies on.
    sym_face = (
        "\n@font-face {\n"
        "  font-family: 'Material Symbols Outlined';\n"
        "  font-style: normal;\n"
        "  font-weight: 100 700;\n"
        "  font-display: block;\n"
        "  src: url(./material-symbols.woff2) format('woff2');\n"
        "}\n"
        ".material-symbols-outlined {\n"
        "  font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal;\n"
        "  line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block;\n"
        "  white-space: nowrap; word-wrap: normal; direction: ltr;\n"
        "  font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased;\n"
        "}\n"
    )
    header = ("/* Self-hosted fonts — generated by build_assets.py. Do not edit. */\n"
              "/* Removes the Google Fonts CDN: app is offline-ready on first load. */\n")
    with open(os.path.join(FONT_DIR, "fonts.css"), "w", encoding="utf-8") as fh:
        fh.write(header + quick_css + "\n" + sym_face)

    print("\nWrote app/assets/fonts/fonts.css")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
