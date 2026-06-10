/* Render the app icon SVG to the PNG sizes a production PWA needs.
 * Uses the already-installed Playwright Chromium (no extra image deps). */
import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = normalize(join(fileURLToPath(import.meta.url), "..", ".."));
const SVG = await readFile(join(ROOT, "app", "assets", "icon.svg"), "utf8");
const OUT = join(ROOT, "app", "assets", "icons");
await mkdir(OUT, { recursive: true });

// Maskable variant: full-bleed background (no rounded corners — the OS applies its own mask).
const MASKABLE_SVG = SVG.replace('rx="112"', 'rx="0"');

const jobs = [
  { file: "icon-192.png", size: 192, svg: SVG },
  { file: "icon-512.png", size: 512, svg: SVG },
  { file: "icon-maskable-512.png", size: 512, svg: MASKABLE_SVG },
  { file: "apple-touch-icon-180.png", size: 180, svg: SVG },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const j of jobs) {
  const dataUri = "data:image/svg+xml;base64," + Buffer.from(j.svg).toString("base64");
  await page.setViewportSize({ width: j.size, height: j.size });
  await page.setContent(
    `<html><body style="margin:0"><img src="${dataUri}" width="${j.size}" height="${j.size}"></body></html>`,
    { waitUntil: "networkidle" }
  );
  await page.screenshot({ path: join(OUT, j.file), clip: { x: 0, y: 0, width: j.size, height: j.size } });
  console.log("wrote", j.file, j.size + "px");
}
await browser.close();
console.log("icons done");
