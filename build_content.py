"""
Pedia Bloom content-enrichment pipeline (proof: Alam & Hewan / flora-fauna).

For each canonical topic, fetches grounding facts from Indonesian Wikipedia and a
gallery of freely-licensed images from Wikimedia Commons, downloads images locally
(so the app stays offline + CSP-safe), and writes a research JSON that the content
authors (LLM agents) turn into kid-level bilingual encyclopedia pages.

Pure standard library. Run with a Python that has internet egress:
    python build_content.py
Outputs:
    app/assets/img/wiki/<sha>.<ext>      downloaded, license-checked images
    .content_research/<id>.json          grounding facts + image manifest per topic
"""
import os
import re
import json
import html
import time
import hashlib
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(ROOT, "app", "assets", "img", "wiki")
RESEARCH_DIR = os.path.join(ROOT, ".content_research")
UA = "PediaBloom/1.0 (educational kids encyclopedia; tjarselan@gmail.com)"
WIKI = "https://id.wikipedia.org"
COMMONS = "https://commons.wikimedia.org"
IMAGES_PER_TOPIC = 6

# canonical topic id -> Indonesian Wikipedia article + Commons search term (scientific
# name where possible, for precise photo results).
TOPICS = {
    "ensiklopedia_anggrek_macan":     {"wiki": "Grammatophyllum speciosum", "search": "Grammatophyllum speciosum"},
    "ensiklopedia_anoa_sulawesi_1":   {"wiki": "Anoa", "search": "Bubalus Anoa"},
    "ensiklopedia_badak_jawa":        {"wiki": "Badak jawa", "search": "Rhinoceros sondaicus"},
    "ensiklopedia_bekantan":          {"wiki": "Bekantan", "search": "Nasalis larvatus"},
    "ensiklopedia_bunga_bangkai":     {"wiki": "Bunga bangkai raksasa", "search": "Amorphophallus titanum"},
    "ensiklopedia_cendrawasih":       {"wiki": "Cendrawasih", "search": "Paradisaeidae bird"},
    "ensiklopedia_burung_maleo_1":    {"wiki": "Maleo", "search": "Macrocephalon maleo"},
    "ensiklopedia_gajah_sumatra":     {"wiki": "Gajah sumatra", "search": "Elephas maximus sumatranus"},
    "ensiklopedia_harimau_sumatra_1": {"wiki": "Harimau sumatra", "search": "Panthera tigris sumatrae"},
    "ensiklopedia_hiu_paus":          {"wiki": "Hiu paus", "search": "Rhincodon typus"},
    "ensiklopedia_hutan_mangrove":    {"wiki": "Hutan bakau", "search": "Mangrove Indonesia"},
    "ensiklopedia_jalak_bali_1":      {"wiki": "Jalak bali", "search": "Leucopsar rothschildi"},
    "ensiklopedia_kantong_semar":     {"wiki": "Kantong semar", "search": "Nepenthes Indonesia"},
    "ensiklopedia_komodo_2":          {"wiki": "Komodo", "search": "Varanus komodoensis"},
    "ensiklopedia_orangutan":         {"wiki": "Orang utan", "search": "Pongo orangutan"},
    "ensiklopedia_penyu_hijau_1":     {"wiki": "Penyu hijau", "search": "Chelonia mydas"},
    "ensiklopedia_rafflesia_arnoldii":{"wiki": "Rafflesia arnoldii", "search": "Rafflesia arnoldii"},
    "ensiklopedia_tarsius":           {"wiki": "Tarsius", "search": "Tarsius spectrum"},
    # Not flora/fauna, but the user asked to fix his image: fetch the real portrait too.
    "pahlawan_ki_hajar_dewantara_1":  {"wiki": "Ki Hadjar Dewantara", "search": "Ki Hadjar Dewantara portrait", "portrait": True},

    # --- Budaya Nusantara (culture, crafts, food) ---
    "ensiklopedia_candi_borobudur_2": {"wiki": "Borobudur", "search": "Borobudur temple"},
    "budaya_candi_prambanan":         {"wiki": "Prambanan", "search": "Prambanan temple"},
    "budaya_wayang_kulit":            {"wiki": "Wayang kulit", "search": "Wayang kulit shadow puppet"},
    "budaya_alat_musik_angklung_1":   {"wiki": "Angklung", "search": "Angklung instrument"},
    "budaya_batik_indonesia":         {"wiki": "Batik", "search": "Batik Indonesia"},
    "budaya_tari_kecak_bali":         {"wiki": "Tari Kecak", "search": "Kecak dance Bali"},
    "budaya_tari_saman":              {"wiki": "Tari Saman", "search": "Saman dance Aceh"},
    "ensiklopedia_rumah_gadang":      {"wiki": "Rumah Gadang", "search": "Rumah Gadang Minangkabau"},
    "kuliner_rendang":                {"wiki": "Rendang", "search": "Rendang food"},
    "kuliner_nasi_goreng":            {"wiki": "Nasi goreng", "search": "Nasi goreng"},
    "kuliner_sate":                   {"wiki": "Sate", "search": "Satay Indonesia"},
    "kuliner_gado_gado":              {"wiki": "Gado-gado", "search": "Gado-gado"},
    "kuliner_soto_nusantara":         {"wiki": "Soto", "search": "Soto Indonesia"},

    # --- Sains Seru (science concepts) ---
    "sains_gunung_berapi_ring_of_fire_1": {"wiki": "Gunung berapi", "search": "Volcano eruption Indonesia"},
    "sains_keajaiban_energi_matahari_1":  {"wiki": "Energi surya", "search": "Solar panel solar energy"},
    "sains_keajaiban_siklus_air":         {"wiki": "Siklus air", "search": "Water cycle rain clouds"},
    "sains_menjelajah_luar_angkasa":      {"wiki": "Tata Surya", "search": "Solar System planets NASA"},
    "sains_rahasia_gravitasi":            {"wiki": "Gravitasi", "search": "Gravity planet Earth space"},
    "sains_rahasia_kekuatan_magnet":      {"wiki": "Magnet", "search": "Magnet horseshoe iron filings"},
    "sains_dunia_robotik":                {"wiki": "Robot", "search": "Robot technology humanoid"},

    # --- Lingkungan & Kehidupan Sehari-hari (environment, sports, professions) ---
    "lingkungan_hutan_tropis":     {"wiki": "Hutan hujan tropis", "search": "Tropical rainforest Indonesia"},
    "lingkungan_perubahan_iklim":  {"wiki": "Perubahan iklim", "search": "Climate change Earth"},
    "lingkungan_polusi_udara":     {"wiki": "Pencemaran udara", "search": "Air pollution city"},
    "lingkungan_sampah_plastik":   {"wiki": "Pencemaran plastik", "search": "Plastic pollution ocean"},
    "lingkungan_terumbu_karang":   {"wiki": "Terumbu karang", "search": "Coral reef fish"},
    "olahraga_bulu_tangkis":       {"wiki": "Bulu tangkis", "search": "Badminton player shuttlecock"},
    "olahraga_pencak_silat":       {"wiki": "Pencak silat", "search": "Pencak silat martial art"},
    "olahraga_sepak_bola":         {"wiki": "Sepak bola", "search": "Football soccer match"},
    "profesi_dokter":              {"wiki": "Dokter", "search": "Doctor physician hospital"},
    "profesi_guru":                {"wiki": "Guru", "search": "Teacher classroom students"},
    "profesi_petani":              {"wiki": "Petani", "search": "Farmer rice field Indonesia"},
    "ekonomi_uang_rupiah":         {"wiki": "Rupiah", "search": "Indonesian rupiah banknote"},
}

FREE_LICENSE = re.compile(r"public domain|^pd|cc0|cc[\s-]?by", re.I)
SKIP_FILE = re.compile(r"(distribution|locator|range|map|\.svg|\.ogg|\.ogv|\.webm|\.tif|"
                       r"icon|logo|commons-|wiki|flag|signature|stamp|coat_of_arms|sound)", re.I)


_last_req = [0.0]


def get(url, attempts=5):
    """Throttled GET with retry — Wikimedia returns HTTP 429 if we request too fast."""
    last = None
    for i in range(attempts):
        gap = time.time() - _last_req[0]
        if gap < 0.35:               # ~3 requests/sec, politely
            time.sleep(0.35 - gap)
        _last_req[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except Exception as exc:
            last = exc
            code = getattr(exc, "code", None)
            time.sleep((4 if code == 429 else 1.5) * (i + 1))
    raise last


def get_json(url):
    return json.loads(get(url).decode("utf-8"))


def wiki_extract(title):
    """Full plaintext intro + body from id.wikipedia (grounding for the authors)."""
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "extracts",
        "explaintext": "1", "redirects": "1", "titles": title,
    })
    data = get_json(f"{WIKI}/w/api.php?{q}")
    pages = data.get("query", {}).get("pages", {})
    for p in pages.values():
        return p.get("title", title), p.get("extract", "")
    return title, ""


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def image_candidates(topic):
    """File titles from the article's media + a Commons search, de-duplicated."""
    files = []
    # 1) images actually used on the Wikipedia article (most relevant)
    try:
        t = urllib.parse.quote(topic["wiki"].replace(" ", "_"))
        ml = get_json(f"{WIKI}/api/rest_v1/page/media-list/{t}")
        files += [m["title"] for m in ml.get("items", []) if m.get("type") == "image" and m.get("title")]
    except Exception:
        pass
    # 2) supplement from a Commons keyword search (scientific name)
    try:
        q = urllib.parse.urlencode({
            "action": "query", "format": "json", "generator": "search",
            "gsrsearch": topic["search"], "gsrnamespace": "6", "gsrlimit": "20",
        })
        sr = get_json(f"{COMMONS}/w/api.php?{q}")
        files += ["File:" + p["title"].split(":", 1)[-1] for p in sr.get("query", {}).get("pages", {}).values()]
    except Exception:
        pass
    # normalise + filter obvious non-photos, keep order, de-dup
    seen, out = set(), []
    for f in files:
        name = f.split(":", 1)[-1]
        if SKIP_FILE.search(name) or name in seen:
            continue
        if not re.search(r"\.(jpe?g|png)$", name, re.I):
            continue
        seen.add(name)
        out.append("File:" + name)
    return out


def imageinfo(file_title):
    """Resolve a File: to its URL + license + author (federates Commons)."""
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "imageinfo",
        "iiprop": "url|extmetadata", "iiurlwidth": "1024", "titles": file_title,
    })
    data = get_json(f"{COMMONS}/w/api.php?{q}")
    for p in data.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        ext = ii.get("extmetadata", {})
        return {
            "url": ii.get("thumburl") or ii.get("url", ""),
            "license": ext.get("LicenseShortName", {}).get("value", ""),
            "artist": strip_html(ext.get("Artist", {}).get("value", ""))[:80],
            "descurl": ii.get("descriptionurl", ""),
        }
    return None


def ext_for(data):
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    return ".jpg"


def download_image(info):
    data = get(info["url"])
    if len(data) < 3000:  # too small to be a useful photo
        return None
    digest = hashlib.sha1(info["url"].encode()).hexdigest()[:16]
    fname = digest + ext_for(data)
    with open(os.path.join(IMG_DIR, fname), "wb") as fh:
        fh.write(data)
    return "app/assets/img/wiki/" + fname


def collect_images(topic, want):
    out = []
    for ft in image_candidates(topic):
        if len(out) >= want:
            break
        try:
            info = imageinfo(ft)
            if not info or not info["url"] or not FREE_LICENSE.search(info["license"]):
                continue
            rel = download_image(info)
            if not rel:
                continue
            out.append({
                "src": rel, "credit": info["artist"] or "Wikimedia Commons",
                "license": info["license"], "source": info["descurl"],
                "file": ft,
            })
        except Exception as exc:
            print(f"      ! image skip ({ft.split(':')[-1][:30]}): {exc}")
    return out


def main():
    os.makedirs(IMG_DIR, exist_ok=True)
    os.makedirs(RESEARCH_DIR, exist_ok=True)
    summary = []
    for tid, topic in TOPICS.items():
        # Idempotent: skip topics already fetched (so re-runs only fetch new ones).
        if os.path.exists(os.path.join(RESEARCH_DIR, tid + ".json")):
            continue
        print(f"- {tid}  <-  {topic['wiki']}")
        try:
            resolved, extract = wiki_extract(topic["wiki"])
        except Exception as exc:
            print(f"    ! wiki fail: {exc}")
            resolved, extract = topic["wiki"], ""
        images = collect_images(topic, IMAGES_PER_TOPIC)
        research = {
            "id": tid,
            "wiki_title": resolved,
            "source_url": f"{WIKI}/wiki/" + urllib.parse.quote(resolved.replace(" ", "_")),
            "extract": extract[:6000],
            "images": images,
        }
        with open(os.path.join(RESEARCH_DIR, tid + ".json"), "w", encoding="utf-8") as fh:
            json.dump(research, fh, ensure_ascii=False, indent=1)
        print(f"    extract {len(extract)} chars | {len(images)} images")
        summary.append((tid, len(extract), len(images)))

    print("\n=== summary ===")
    for tid, ec, ic in summary:
        flag = "  <-- LOW IMAGES" if ic < 3 else ""
        print(f"  {ic} img | {ec:>5} chars | {tid}{flag}")
    total_img = sum(ic for _, _, ic in summary)
    print(f"\n{len(summary)} topics, {total_img} images downloaded.")


if __name__ == "__main__":
    main()
