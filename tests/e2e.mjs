/* Pedia Bloom end-to-end smoke sweep (Playwright + Chromium).
 *
 * Verifies the DESIGN.md re-skin and the whole app actually run:
 *   - every native route renders without console / page errors
 *   - every bundled topic screen renders and runs its inline scripts cleanly
 *   - the DESIGN.md tokens are live (cream canvas, leaf-green primary)
 *   - dark mode flips the canvas via the CSS-variable engine
 *   - core interactions work (library search, parent math-gate, settings name)
 *
 * Run:  node tests/e2e.mjs   (expects a static server — started by run-e2e.mjs)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8765";
const SHOT_DIR = "test-results";
const IGNORED = [
  /favicon\.ico/i,                 // not shipped, harmless
  /Failed to load resource.*placeholder/i,
];

const rgb = (s) => (s.match(/\d+/g) || []).map(Number);
const near = (a, b, t = 6) => a.length === 3 && b.length === 3 && a.every((v, i) => Math.abs(v - b[i]) <= t);

function attachErrorCollector(page, bag) {
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED.some((re) => re.test(m.text()))) bag.push("console: " + m.text());
  });
  page.on("pageerror", (e) => bag.push("pageerror: " + e.message));
  page.on("requestfailed", (r) => {
    const u = r.url();
    const err = r.failure()?.errorText || "";
    // ERR_ABORTED = the browser cancelled an in-flight request (e.g. images still loading
    // when the SPA navigates to the next screen). Benign — not a real load failure.
    if (err.includes("ERR_ABORTED")) return;
    if (!IGNORED.some((re) => re.test(u))) bag.push("requestfailed: " + u + " — " + err);
  });
}

async function goHash(page, hash) {
  await page.evaluate((h) => { window.location.hash = h; }, hash);
  await page.waitForTimeout(120);
  await page.waitForFunction(() => document.getElementById("view")?.children.length > 0, { timeout: 5000 });
}

const results = [];
const record = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
attachErrorCollector(page, errors);

await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });
await page.waitForFunction(() => Object.keys(window.PEDIA_SCREENS || {}).length > 0, { timeout: 10000 });

// 1. Tokens are live: cream canvas + leaf-green primary.
const tokens = await page.evaluate(() => {
  const cs = getComputedStyle(document.body);
  const probe = document.createElement("div");
  probe.className = "bg-primary"; document.body.appendChild(probe);
  const prim = getComputedStyle(probe).backgroundColor; probe.remove();
  return { bg: cs.backgroundColor, primary: prim };
});
record("canvas is cream #f5fbef", near(rgb(tokens.bg), [245, 251, 239]), tokens.bg);
record("primary is leaf-green #006e1c", near(rgb(tokens.primary), [0, 110, 28]), tokens.primary);

// 1b. Self-hosted fonts loaded (no CDN), and Material Symbols renders as a glyph not text.
const fonts = await page.evaluate(async () => {
  await document.fonts.ready;
  const usedCdn = performance.getEntriesByType("resource").some((r) => /fonts\.(googleapis|gstatic)\.com|cdn\.tailwindcss/.test(r.name));
  // An icon glyph is roughly square; the literal ligature text "settings" would be far wider than tall.
  const probe = document.createElement("span");
  probe.className = "material-symbols-outlined"; probe.textContent = "settings";
  probe.style.cssText = "position:absolute;font-size:48px"; document.body.appendChild(probe);
  const r = probe.getBoundingClientRect(); probe.remove();
  return {
    quicksand: document.fonts.check('16px "Quicksand"'),
    symbols: document.fonts.check('24px "Material Symbols Outlined"'),
    iconIsGlyph: r.width > 0 && r.width < 80,
    usedCdn,
  };
});
record("Quicksand self-hosted + loaded", fonts.quicksand);
record("Material Symbols self-hosted + loaded", fonts.symbols);
record("icons render as glyphs (not ligature text)", fonts.iconIsGlyph, "probe width " + fonts.iconIsGlyph);
record("no external CDN requested", !fonts.usedCdn);

// 2. Native routes render.
const routes = ["/home", "/explore", "/library", "/games", "/badges", "/ai", "/map", "/map/Jawa", "/parent", "/parent/dashboard", "/settings"];
for (const r of routes) {
  const before = errors.length;
  await goHash(page, "#" + r);
  record("route " + r, errors.length === before, errors.slice(before).join(" | "));
}

// 3. Bilingual cards: at least one English subtitle visible on library.
await goHash(page, "#/library");
const biCount = await page.evaluate(() => document.querySelectorAll("#view .bi-en").length);
record("bilingual subtitles present", biCount > 0, biCount + " .bi-en nodes");

// 4. Every bundled topic screen renders + runs its scripts cleanly.
const ids = await page.evaluate(() => Object.keys(window.PEDIA_SCREENS));
let screenFails = 0, firstFail = "";
for (const id of ids) {
  const before = errors.length;
  await goHash(page, "#/screen/" + id);
  const ok = await page.evaluate(() => document.getElementById("view").children.length > 0);
  if (!ok || errors.length > before) { screenFails++; if (!firstFail) firstFail = id + " — " + errors.slice(before).join(" | "); }
}
record(`all ${ids.length} topic screens render`, screenFails === 0, screenFails ? `${screenFails} failed; first: ${firstFail}` : "");

// 5. Library search filters live.
await goHash(page, "#/library");
await page.fill("#lib-search", "komodo");
await page.waitForTimeout(150);
const filtered = await page.evaluate(() => document.querySelectorAll("#lib-grid > a").length);
const total = await page.evaluate(() => Object.keys(window.PEDIA_SCREENS).length);
record("library search filters", filtered > 0 && filtered < total, `${filtered} of ${total}`);

// 6. Parent math-gate accepts the correct answer.
await goHash(page, "#/parent");
const gateOk = await page.evaluate(() => {
  const q = document.querySelector("#view p.font-headline-lg").textContent;
  const m = q.match(/(\d+)\s*\+\s*(\d+)/);
  document.getElementById("gate-ans").value = String(+m[1] + +m[2]);
  document.getElementById("gate-go").click();
  return location.hash.indexOf("dashboard") > -1;
});
record("parent gate accepts correct sum", gateOk);

// 7. Dark mode flips the canvas.
await goHash(page, "#/settings");
const darkBg = await page.evaluate(() => {
  document.documentElement.classList.add("dark");
  return getComputedStyle(document.body).backgroundColor;
});
record("dark mode darkens canvas", !near(rgb(darkBg), [245, 251, 239]) && rgb(darkBg)[0] < 60, darkBg);
await page.evaluate(() => document.documentElement.classList.remove("dark"));

// 8. PWA installability: linked valid manifest with name, icons, theme color.
const pwa = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return { ok: false };
  const m = await fetch(link.href).then((r) => r.json());
  return {
    ok: true, name: !!(m.name || m.short_name),
    icons: (m.icons || []).length, maskable: (m.icons || []).some((i) => (i.purpose || "").includes("maskable")),
    theme: !!m.theme_color, display: m.display,
    swRegistered: !!navigator.serviceWorker,
  };
});
record("manifest linked + named + themed", pwa.ok && pwa.name && pwa.theme && pwa.display === "standalone");
record("manifest has PNG + maskable icons", pwa.icons >= 3 && pwa.maskable);
record("service worker available", pwa.swRegistered);

// 9. Offline boot: SW precache + navigation fallback keep the app working with no network.
await goHash(page, "#/home");
try {
  await page.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 6000 });
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => window.PEDIA_SCREENS && Object.keys(window.PEDIA_SCREENS).length > 0, { timeout: 8000 });
  const booted = await page.evaluate(() => document.getElementById("view")?.children.length > 0);
  record("app boots fully offline (SW precache)", booted);
} catch (e) {
  record("app boots fully offline (SW precache)", false, String(e).split("\n")[0]);
} finally {
  await page.context().setOffline(false);
}

// Screenshots for visual review.
import("node:fs").then((fs) => fs.mkdirSync(SHOT_DIR, { recursive: true })).catch(() => {});
await goHash(page, "#/home");
await page.screenshot({ path: SHOT_DIR + "/home-light.png", fullPage: true });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.screenshot({ path: SHOT_DIR + "/home-dark.png", fullPage: true });
await page.evaluate(() => document.documentElement.classList.remove("dark"));
await goHash(page, "#/screen/" + ids.find((i) => i.indexOf("komodo") > -1) || ids[0]);
await page.screenshot({ path: SHOT_DIR + "/topic.png", fullPage: true });

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) { console.error("FAILURES:\n" + failed.map((f) => " - " + f.name + ": " + f.detail).join("\n")); process.exit(1); }
console.log("All E2E checks passed.");
