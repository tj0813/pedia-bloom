"""
Pedia Bloom build pipeline.

Turns 76 standalone Google Stitch screen exports into one navigable PWA:
  1. Scans every <folder>/code.html content screen.
  2. Downloads all remote Stitch CDN images locally (they expire otherwise).
  3. Extracts each screen's <main> fragment + custom <style>/<script> blocks.
  4. Rewrites image URLs to local paths and emits app/screens-data.js
     (a single bundle loaded by index.html via <script src>, so the app
      works when opened directly from the filesystem).

Pure standard library. Run:  python build.py
"""

import os
import re
import json
import html
import hashlib
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_APP = os.path.join(ROOT, "app")
OUT_IMG = os.path.join(OUT_APP, "assets", "img")
PLACEHOLDER_REL = "app/assets/placeholder.svg"

# Effect demos / empty folders that are not real content screens.
EXCLUDE = {"animated_svg", "shader", "three.js", "nusantara_explorers"}

# folder prefix -> (display category, Material Symbols icon)
CATEGORY_MAP = {
    "ensiklopedia":    ("Alam & Hewan Indonesia", "pets"),
    "budaya":          ("Budaya Nusantara", "festival"),
    "pahlawan":        ("Sejarah & Pahlawan", "military_tech"),
    "sains":           ("Sains Seru", "science"),
    "sejarah":         ("Sejarah & Pahlawan", "history_edu"),
    "misi":            ("Sains Seru", "rocket_launch"),
    "hub":             ("Budaya Nusantara", "hub"),
    "jelajah":         ("Budaya Nusantara", "map"),
    "galeri":          ("Sejarah & Pahlawan", "collections_bookmark"),
    "lab":             ("Sains Seru", "biotech"),
    "pusat":           ("Budaya Nusantara", "explore"),
    "tanya":           ("Lainnya", "smart_toy"),
    "arena":           ("Sains Seru", "extension"),
    "kuliner":         ("Budaya Nusantara", "restaurant"),
    "cerita":          ("Budaya Nusantara", "auto_stories"),
    "kewarganegaraan": ("Sejarah & Pahlawan", "account_balance"),
    "olahraga":        ("Lingkungan & Kehidupan Sehari-hari", "sports"),
    "lingkungan":      ("Lingkungan & Kehidupan Sehari-hari", "eco"),
    "ekonomi":         ("Lingkungan & Kehidupan Sehari-hari", "payments"),
    "profesi":         ("Lingkungan & Kehidupan Sehari-hari", "work"),
}


URL_RE = re.compile(r'''src=["'](https://[^"']+)["']''')
CSSURL_RE = re.compile(r'''url\(\s*["']?(https://[^)"']+)["']?\s*\)''')
# Any external URL that survives rewriting (e.g. inside an inline <script> string) gets
# neutralised to the local placeholder so the app stays self-contained and CSP-clean.
EXTERNAL_RE = re.compile(r'https://(?:[a-z0-9-]+\.)*(?:googleusercontent|gstatic|googleapis)\.com/[^"\')\s]+')


def category_for(folder: str):
    prefix = folder.split("_", 1)[0]
    return CATEGORY_MAP.get(prefix, ("Lainnya", "auto_stories"))


def collect_screens():
    screens = {}
    urls = set()
    for name in sorted(os.listdir(ROOT)):
        folder = os.path.join(ROOT, name)
        code = os.path.join(folder, "code.html")
        if not os.path.isdir(folder) or name in EXCLUDE or not os.path.exists(code):
            continue
        with open(code, encoding="utf-8", errors="replace") as fh:
            raw = fh.read()
        if "<main" not in raw:
            continue
        screens[name] = raw
        urls.update(URL_RE.findall(raw))
        urls.update(CSSURL_RE.findall(raw))
    return screens, urls


def ext_for(data: bytes) -> str:
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    head = data[:64].lstrip()
    if head[:4] == b"<svg" or head[:5] == b"<?xml":
        return ".svg"
    return ".jpg"


def download(url: str):
    """Return (url, relpath|None). Failures are tolerated -> placeholder."""
    digest = hashlib.sha1(url.encode()).hexdigest()[:16]
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        if len(data) < 64:  # error stub or empty
            return url, None
        fname = digest + ext_for(data)
        with open(os.path.join(OUT_IMG, fname), "wb") as out:
            out.write(data)
        return url, "app/assets/img/" + fname
    except Exception as exc:  # network/expired/403 — keep going
        print(f"  ! failed {digest}: {exc}")
        return url, None


def extract_fragment(raw: str, url_map: dict):
    """Pull <main> inner HTML and rewrite remote image URLs to local paths."""
    match = re.search(r"<main\b[^>]*>(.*)</main>", raw, re.S)
    frag = match.group(1).strip() if match else ""

    def repl_src(m):
        return f'src="{url_map.get(m.group(1)) or PLACEHOLDER_REL}"'

    def repl_css(m):
        return f"url({url_map.get(m.group(1)) or PLACEHOLDER_REL})"

    frag = URL_RE.sub(repl_src, frag)
    frag = CSSURL_RE.sub(repl_css, frag)
    return frag


# Curated thumbnail overrides (content audit, 2026-06-10). first_image() picks the FIRST
# <img> in a fragment, which on these screens is a decorative element (mascot/boy) or the
# wrong AI-generated asset (a lion on the rhino page) — point the card at the correct hero.
# Image filenames are sha1(url)[:16], stable across rebuilds, so these survive regeneration.
THUMB_OVERRIDE = {
    "ensiklopedia_candi_borobudur_2": "app/assets/img/d3971614de970c9e.png",  # temple, not the boy mascot
    "ensiklopedia_badak_jawa":        "app/assets/img/ea85c637d8dea96d.png",  # Javan rhino, not a lion
    "ensiklopedia_burung_maleo_2":    "app/assets/img/f1c3b8ab84b64f49.png",  # Maleo bird, not the bare egg
}


def thumb_for(folder: str, frag: str) -> str:
    # Use the override only if its file actually exists (it may live in another screen,
    # e.g. the Maleo bird), otherwise fall back so we never point a card at a missing image.
    override = THUMB_OVERRIDE.get(folder)
    if override and os.path.exists(os.path.join(ROOT, override.replace("/", os.sep))):
        return override
    return first_image(frag)


def first_image(frag: str) -> str:
    m = re.search(r'src="(app/assets/img/[^"]+)"', frag)
    return m.group(1) if m else PLACEHOLDER_REL


def extract_styles(raw: str):
    return [b.strip() for _, b in
            re.findall(r"<style\b([^>]*)>(.*?)</style>", raw, re.S) if b.strip()]


def extract_scripts(raw: str):
    scripts = []
    for attrs, body in re.findall(r"<script\b([^>]*)>(.*?)</script>", raw, re.S):
        if "src=" in attrs or "tailwind-config" in attrs:
            continue
        body = body.strip()
        if body:
            scripts.append(body)
    return scripts


def title_of(raw: str, fallback: str) -> str:
    m = re.search(r"<title>(.*?)</title>", raw, re.S)
    if not m:
        return fallback
    t = html.unescape(m.group(1)).replace(" - Pedia Bloom", "").strip()
    return t or fallback


def write_placeholder():
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" '
        'viewBox="0 0 400 300"><rect width="400" height="300" fill="#dce9ff"/>'
        '<text x="200" y="155" font-family="Quicksand,sans-serif" font-size="22" '
        'font-weight="700" fill="#006b5f" text-anchor="middle">Pedia Bloom</text></svg>'
    )
    with open(os.path.join(OUT_APP, "assets", "placeholder.svg"), "w", encoding="utf-8") as fh:
        fh.write(svg)


def main():
    os.makedirs(OUT_IMG, exist_ok=True)
    write_placeholder()

    screens, urls = collect_screens()
    print(f"Content screens: {len(screens)}  |  unique remote images: {len(urls)}")

    url_map = {}
    print("Downloading images...")
    with ThreadPoolExecutor(max_workers=8) as pool:
        for url, rel in pool.map(download, sorted(urls)):
            url_map[url] = rel
    ok = sum(1 for v in url_map.values() if v)
    print(f"Downloaded {ok}/{len(url_map)} images ({len(url_map) - ok} fell back to placeholder)")

    bundle = {}
    styles = []
    for name, raw in screens.items():
        frag = extract_fragment(raw, url_map)
        # Defense in depth: kill any external CDN URL the rewriting missed (e.g. inside
        # a fragment's inline script string) so nothing escapes the CSP / offline guarantee.
        frag = EXTERNAL_RE.sub(PLACEHOLDER_REL, frag)
        scripts = [EXTERNAL_RE.sub(PLACEHOLDER_REL, s) for s in extract_scripts(raw)]
        for css in extract_styles(raw):
            if css not in styles:
                styles.append(css)
        cat, icon = category_for(name)
        bundle[name] = {
            "id": name,
            "title": title_of(raw, name.replace("_", " ").title()),
            "category": cat,
            "icon": icon,
            "thumb": thumb_for(name, frag),
            "html": frag,
            "scripts": scripts,
        }

    os.makedirs(OUT_APP, exist_ok=True)
    with open(os.path.join(OUT_APP, "screens-data.js"), "w", encoding="utf-8") as fh:
        fh.write("window.PEDIA_SCREENS = ")
        json.dump(bundle, fh, ensure_ascii=False)
        fh.write(";\n")
        fh.write("window.PEDIA_STYLES = ")
        json.dump("\n".join(styles), fh, ensure_ascii=False)
        fh.write(";\n")

    cats = {}
    for s in bundle.values():
        cats[s["category"]] = cats.get(s["category"], 0) + 1
    print("\nScreens per category:")
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {n:>3}  {c}")
    print(f"\nWrote app/screens-data.js ({len(bundle)} screens)")


if __name__ == "__main__":
    main()
