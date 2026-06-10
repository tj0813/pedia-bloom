"""Unit tests for the Pedia Bloom build pipeline (build.py + build_assets.py).

Focus: the pure transformation logic that turns Stitch exports into the bundle —
image-URL rewriting (incl. the single-quote/placeholder cases the CSP work surfaced),
script/style extraction, category mapping, format sniffing, and external-URL sanitising.

Run:  pytest -q
"""
import build
import build_assets


# --------------------------------------------------------------- ext_for (magic bytes)
class TestExtFor:
    def test_png(self):
        assert build.ext_for(b"\x89PNG\r\n\x1a\n" + b"\x00" * 16) == ".png"

    def test_jpg(self):
        assert build.ext_for(b"\xff\xd8\xff\xe0" + b"\x00" * 16) == ".jpg"

    def test_webp(self):
        assert build.ext_for(b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 8) == ".webp"

    def test_gif(self):
        assert build.ext_for(b"GIF89a" + b"\x00" * 16) == ".gif"

    def test_svg(self):
        assert build.ext_for(b"<svg xmlns='...'></svg>") == ".svg"

    def test_unknown_defaults_to_jpg(self):
        assert build.ext_for(b"not an image at all here") == ".jpg"


# --------------------------------------------------------------- category_for
class TestCategoryFor:
    def test_known_prefix_maps_to_category(self):
        assert build.category_for("ensiklopedia_komodo_2")[0] == "Alam & Hewan Indonesia"

    def test_culture_prefix(self):
        assert build.category_for("budaya_wayang_kulit")[0] == "Budaya Nusantara"

    def test_returns_icon(self):
        assert build.category_for("sains_listrik")[1] == "science"

    def test_unknown_prefix_falls_back_to_lainnya(self):
        assert build.category_for("xyzzy_unknown") == ("Lainnya", "auto_stories")


# --------------------------------------------------------------- extract_fragment
class TestExtractFragment:
    def test_extracts_main_inner_html(self):
        raw = "<html><body><main><h1>Hi</h1></main></body></html>"
        assert build.extract_fragment(raw, {}) == "<h1>Hi</h1>"

    def test_rewrites_double_quoted_src_to_local(self):
        url = "https://cdn.example.com/a.png"
        raw = f'<main><img src="{url}"></main>'
        out = build.extract_fragment(raw, {url: "app/assets/img/a.png"})
        assert 'src="app/assets/img/a.png"' in out
        assert "https://" not in out

    def test_rewrites_single_quoted_src(self):
        url = "https://cdn.example.com/b.png"
        raw = f"<main><img src='{url}'></main>"
        out = build.extract_fragment(raw, {url: "app/assets/img/b.png"})
        assert "app/assets/img/b.png" in out
        assert "https://" not in out

    def test_unmapped_src_falls_back_to_placeholder(self):
        url = "https://expired.example.com/gone.png"
        raw = f'<main><img src="{url}"></main>'
        out = build.extract_fragment(raw, {url: None})
        assert build.PLACEHOLDER_REL in out

    def test_rewrites_quoted_css_url(self):
        url = "https://cdn.example.com/bg.jpg"
        raw = f"<main><div style=\"background-image: url('{url}')\"></div></main>"
        out = build.extract_fragment(raw, {url: "app/assets/img/bg.jpg"})
        assert "app/assets/img/bg.jpg" in out
        assert "https://" not in out


# --------------------------------------------------------------- script / style extraction
class TestExtractScripts:
    def test_keeps_inline_script(self):
        raw = "<main></main><script>var x = 1;</script>"
        assert build.extract_scripts(raw) == ["var x = 1;"]

    def test_skips_external_src_script(self):
        raw = '<script src="https://cdn.tailwindcss.com"></script>'
        assert build.extract_scripts(raw) == []

    def test_skips_tailwind_config_script(self):
        raw = '<script id="tailwind-config">tailwind.config = {};</script>'
        assert build.extract_scripts(raw) == []

    def test_ignores_empty_script(self):
        assert build.extract_scripts("<script>   </script>") == []


class TestExtractStyles:
    def test_returns_nonempty_style_body(self):
        assert build.extract_styles("<style>.a{color:red}</style>") == [".a{color:red}"]

    def test_drops_empty_style(self):
        assert build.extract_styles("<style></style>") == []


# --------------------------------------------------------------- title_of / first_image
class TestTitleOf:
    def test_strips_suffix(self):
        assert build.title_of("<title>Komodo - Pedia Bloom</title>", "fb") == "Komodo"

    def test_uses_fallback_when_missing(self):
        assert build.title_of("<html></html>", "Fallback") == "Fallback"


class TestFirstImage:
    def test_finds_first_local_image(self):
        frag = '<img src="app/assets/img/x.png"><img src="app/assets/img/y.png">'
        assert build.first_image(frag) == "app/assets/img/x.png"

    def test_returns_placeholder_when_none(self):
        assert build.first_image("<p>no images</p>") == build.PLACEHOLDER_REL


# --------------------------------------------------------------- external URL sanitiser
class TestExternalSanitiser:
    def test_matches_googleusercontent(self):
        s = 'var a = "https://lh3.googleusercontent.com/aida-public/ABC123";'
        assert build.EXTERNAL_RE.sub(build.PLACEHOLDER_REL, s) == f'var a = "{build.PLACEHOLDER_REL}";'

    def test_matches_gstatic(self):
        assert build.EXTERNAL_RE.search("https://fonts.gstatic.com/s/x.woff2") is not None

    def test_leaves_local_paths_untouched(self):
        s = 'src="app/assets/img/x.png"'
        assert build.EXTERNAL_RE.sub(build.PLACEHOLDER_REL, s) == s


# --------------------------------------------------------------- build_assets icon scan
class TestCollectIconNames:
    def test_includes_dynamic_icons(self):
        names = build_assets.collect_icon_names()
        assert build_assets.DYNAMIC_ICONS <= names

    def test_picks_up_real_shell_icons(self):
        names = build_assets.collect_icon_names()
        # These appear in index.html / app.js material-symbols spans.
        assert {"home", "explore", "search"} <= names

    def test_all_names_are_valid_tokens(self):
        import re
        assert all(re.fullmatch(r"[a-z0-9_]+", n) for n in build_assets.collect_icon_names())
