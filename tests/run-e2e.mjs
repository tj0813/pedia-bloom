/* Starts a static file server for the app, runs the E2E sweep, then shuts the
 * server down. Self-contained so `node tests/run-e2e.mjs` just works. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = normalize(join(fileURLToPath(import.meta.url), "..", ".."));
const PORT = Number(process.env.PORT || 8765);
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".css": "text/css", ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split("?")[0]);
    if (path === "/") path = "/index.html";
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end("forbidden"); return; }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});

await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
console.log(`static server on http://127.0.0.1:${PORT}`);

const child = spawn(process.execPath, [join(ROOT, "tests", "e2e.mjs")], {
  stdio: "inherit",
  env: { ...process.env, BASE_URL: `http://127.0.0.1:${PORT}` },
});
child.on("exit", (code) => { server.close(); process.exit(code ?? 1); });
