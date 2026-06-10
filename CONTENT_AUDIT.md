# Pedia Bloom — Content Integrity Audit

**Date:** 2026-06-10 · **Scope:** all 102 topics (every thumbnail image viewed + source text scanned)
**Method:** 8 parallel vision agents — image-subject match + high-confidence factual errors only.

**Result: 89 clean · 13 issues** (4 HIGH image, 2 MEDIUM image, 1 MEDIUM factual, 6 LOW missing-image)

> Root cause for most HIGH cases: `build.py`'s `first_image()` picks the **first** `<img>` in a
> fragment as the card thumbnail — which on several screens is a *decorative* mascot/robot/boy,
> not the topic hero. For 3 of the 4 HIGH issues the correct image **already exists in the same
> screen** — the fix is repointing the thumbnail, no new artwork needed.

---

## 🔴 HIGH — wrong subject on the card (teaches a child the wrong thing)

| Topic | Card shows | Should show | Fix |
|---|---|---|---|
| **Badak Jawa** (Javan Rhino) | a **lion's** face | a Javan rhino | Repoint thumb → `ea85c637d8dea96d.png` (correct rhino, already in screen). Note: a wrong **lion** image also sits in the screen body — replace/remove that asset too. |
| **Bunga Bangkai** (Corpse Flower) | a cartoon **robot** | the Titan Arum bloom | Repoint thumb to the flower hero referenced in the screen (no new art needed). |
| **Candi Borobudur (Part 2)** | a 3D cartoon **boy** mascot | the temple | Repoint thumb → `d3971614de970c9e.png` (correct Borobudur, already in screen). |
| **Jelajah Sumatra Barat** (West Sumatra) | a **Toraja Tongkonan** house (Sulawesi) | a Minangkabau **Rumah Gadang** | Needs a correct Rumah Gadang image — no right asset in screen. Source new art. |

## 🟠 MEDIUM — partial / likeness mismatch + one factual error

| Topic | Issue | Fix |
|---|---|---|
| **Ki Hajar Dewantara** | hero portrait is a **generic bearded man**, not his real likeness (peci, glasses, mustache) | Replace with an accurate portrait so kids learn his real face. |
| **Burung Maleo (Part 2)** | thumb is just a bird **egg** (the tap-to-hatch game asset), the Maleo bird isn't shown | Repoint thumb to an image of the actual Maleo bird. |
| **Cerita Sangkuriang** | text falsely claims Tangkuban Perahu folklore is **"UNESCO-recognized"** — it is not | Remove/reword the false UNESCO claim (e.g. "cerita rakyat khas Sunda"). |

## 🟡 LOW — no image (placeholder shown on the card)

These 6 topics render the generic placeholder — not wrong, just missing a cover image:

`pusat_budaya_tradisi` (Culture & Tradition hub) · `sains_dunia_robotik` (Robotics) ·
`sains_rahasia_kekuatan_magnet` (Magnets) · `misi_netiket_pahlawan_digital` (Internet Manners) ·
`hub_luar_angkasa` (Space hub) · `misi_rahasia_tidur_nyenyak` (Healthy Sleep)

---

## What was verified clean
- **Texts:** all spot-checked facts hold — Borobudur (72 stupas / 2,672 reliefs / Raffles 1814), Komodo (largest lizard, Indonesia-only), Anoa (smallest buffalo, Sulawesi), Rafflesia (Sumatra, Tetrastigma parasite), Diponegoro (1785–1830), Pancasila (5 sila + etymology), Rupiah history (ORI→BI→QRIS), Maleo (Sulawesi endemic, casque, egg-burying), volcanoes (Ring of Fire), solar energy, Wayang (Pandawa 5 / Kurawa 100). Only **one** false claim found (Sangkuriang UNESCO).
- **Images:** 89 thumbnails correctly depict their subject. Borderline-but-accepted: Angklung (bamboo tubes, reads slightly calung-like), Proboscis Monkey (stylized, correct habitat), Bung Tomo (stylized warrior), hub screens using the Nara mascot header (normal portal pattern).

## Fixes applied (2026-06-10) — no new artwork needed

| Fix | Status |
|---|---|
| **Badak Jawa** — lion asset swapped to the Javan rhino on the **card and in the page body** (lion fully removed) | ✅ done |
| **Candi Borobudur 2** — card thumbnail → the actual temple image | ✅ done |
| **Burung Maleo 2** — card thumbnail → a real Maleo bird (borrowed from the Maleo Part-1 screen) | ✅ done |
| **Cerita Sangkuriang** — false "UNESCO-recognized" claim reworded to "Cerita rakyat khas Sunda yang melegenda" (in bundle **and** source `code.html`) | ✅ done |
| **`build.py` hardened** — added `THUMB_OVERRIDE` map + `thumb_for()` so the correct thumbnails survive a rebuild (stable sha1 filenames) | ✅ done |

All target images were visually verified before repointing. Re-verified: 26/26 E2E pass, 9 *legitimate* UNESCO mentions (Saman, Wayang, Angklung, Batik) correctly preserved.

## New artwork — resolved with hand-built storybook illustrations (2026-06-10)

All 9 remaining gaps now ship custom, self-contained SVG illustrations (palette-matched,
never expire, recolor with the theme). Each replaces the card thumbnail **and** the in-screen
hero, verified rendered + 26/26 E2E:

| Topic | Illustration |
|---|---|
| Bunga Bangkai (Corpse Flower) | `illus-bunga-bangkai.svg` — Titan Arum (tall spadix + maroon spathe) |
| Jelajah Sumatra Barat | `illus-rumah-gadang.svg` — Minangkabau house with buffalo-horn gonjong roof |
| Ki Hajar Dewantara | `illus-ki-hajar-dewantara.svg` — stylized portrait (peci, round glasses, mustache) |
| Robotics | `illus-robotik.svg` |
| Magnets | `illus-magnet.svg` — horseshoe magnet + field lines |
| Space hub | `illus-luar-angkasa.svg` — ringed planet, moon, rocket |
| Internet Manners | `illus-netiket.svg` — phone + heart + thumbs-up + safety shield |
| Culture hub | `illus-budaya.svg` — wayang gunungan on batik |
| Healthy Sleep | `illus-tidur.svg` — child sleeping, moon, Zzz |

> ⚠️ **Ki Hajar Dewantara** is a *stylized* representation (signature attributes), **not** a
> photographic likeness. If exact likeness matters, drop in his public-domain photo (Rp20,000 note).

**Result: 0 wrong-image / missing-image defects remain.** Only the deliberately-deferred full
body-prose EN translation is outstanding (headings/titles already bilingual).
