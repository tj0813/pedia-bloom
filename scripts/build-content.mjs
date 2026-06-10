/* Assemble app/content/<id>.json (editable rich-content source) into app/content.js
 * (window.PEDIA_CONTENT), loaded by the app via <script src>. De-dups galleries/credits.
 * Run: node scripts/build-content.mjs  (or: npm run build:content) */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", "app", "content");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const out = {};
for (const f of files) {
  const c = JSON.parse(readFileSync(join(dir, f), "utf8"));
  if (Array.isArray(c.gallery)) c.gallery = [...new Set(c.gallery)];
  if (Array.isArray(c.credits)) {
    const seen = new Set();
    c.credits = c.credits.filter((x) => x && x.src && !seen.has(x.src) && seen.add(x.src));
  }
  out[c.id] = c;
}
const dest = join(import.meta.dirname, "..", "app", "content.js");
writeFileSync(dest, "window.PEDIA_CONTENT = " + JSON.stringify(out) + ";\n");
console.log(`assembled ${Object.keys(out).length} topics -> app/content.js`);
