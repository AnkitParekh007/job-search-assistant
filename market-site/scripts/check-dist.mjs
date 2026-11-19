// Post-build smoke check: every URL in the sitemap must map to a prerendered
// file with its own canonical URL, a unique <title>, and real content (an <h1>)
// inside #root. Catches a regression of "every route is a 404 SPA fallback".
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const sitemap = readFileSync(join(dist, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

const failures = [];
const titles = new Map();
const base = new URL(urls[0]).pathname; // sitemap's first entry is the site root

for (const url of urls) {
  const rel = new URL(url).pathname.slice(base.length).replace(/\/$/, "");
  const file = rel ? join(dist, `${rel}.html`) : join(dist, "index.html");
  const label = `/${rel}`;
  if (!existsSync(file)) {
    failures.push(`${label}: missing ${file.slice(root.length + 1)}`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const body = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/)?.[1] ?? "";

  if (canonical !== url) failures.push(`${label}: canonical is ${canonical}, expected ${url}`);
  if (!/<h1[\s>]/.test(body)) failures.push(`${label}: no <h1> rendered inside #root`);
  if (titles.has(title)) failures.push(`${label}: duplicate <title> shared with ${titles.get(title)}`);
  titles.set(title, label);
}

if (failures.length) {
  console.error(`check-dist: ${failures.length} problem(s)\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`check-dist: ${urls.length} sitemap URLs prerendered with unique titles and content`);
