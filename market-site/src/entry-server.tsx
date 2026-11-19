import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App";
import { PAGE_SEO } from "./lib/pages";
import { absoluteUrl, OG_IMAGE, type SeoMeta } from "./lib/site";
import { DOCS_META } from "./pages/docs/nav";

/** Every route that gets its own static HTML file at build time. */
export const ROUTES: SeoMeta[] = [
  ...Object.values(PAGE_SEO),
  ...Object.values(DOCS_META).map(({ title, description, path }) => ({ title, description, path })),
];

export function render(path: string, basename: string): string {
  const location = basename.replace(/\/$/, "") + (path === "/" ? "/" : path);
  return renderToString(
    <StrictMode>
      <StaticRouter basename={basename} location={location}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
}

const escapeAttr = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Head tags matching what `applySeo` sets on the client. */
export function headTags({ title, description, path }: SeoMeta): string {
  const url = absoluteUrl(path);
  const t = escapeAttr(title);
  const d = escapeAttr(description);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${escapeAttr(OG_IMAGE)}" />`,
  ]
    .map((tag) => `    ${tag}`)
    .join("\n");
}
