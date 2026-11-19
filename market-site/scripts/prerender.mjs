// Renders every route to static HTML so GitHub Pages serves each URL with
// HTTP 200, real content, and its own <title>/meta (not the home page's).
//
// Writes `<route>.html` (GitHub Pages serves /features from features.html) and
// `<route>/index.html` (covers /features/). `/` becomes index.html; 404.html
// stays the empty SPA shell for unknown and legacy URLs.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ssrDir = join(root, "dist-ssr");
const basename = (process.env.BASE_PATH || "/job-search-assistant/").replace(/\/$/, "");

const { render, headTags, ROUTES } = await import(pathToFileURL(join(ssrDir, "entry-server.js")).href);
const template = readFileSync(join(dist, "index.html"), "utf8");

const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/;
const ROOT = '<div id="root"></div>';
if (!SEO_BLOCK.test(template) || !template.includes(ROOT)) {
  throw new Error("dist/index.html is missing the <!--seo--> block or an empty #root");
}

const write = (file, html) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

for (const meta of ROUTES) {
  const body = render(meta.path, basename);
  const html = template
    .replace(SEO_BLOCK, `<!--seo-->\n${headTags(meta)}\n    <!--/seo-->`)
    .replace(ROOT, `<div id="root">${body}</div>`);

  if (meta.path === "/") {
    write(join(dist, "index.html"), html);
  } else {
    const rel = meta.path.replace(/^\//, "");
    write(join(dist, `${rel}.html`), html);
    write(join(dist, rel, "index.html"), html);
  }
  console.log(`prerendered ${meta.path}`);
}

rmSync(ssrDir, { recursive: true, force: true });
