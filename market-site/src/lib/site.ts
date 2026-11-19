export const SITE_ORIGIN = "https://job-search-assistant.rebound-ops.org";
export const SITE_BASE = "";
export const SITE_URL = `${SITE_ORIGIN}${SITE_BASE}`;
export const GITHUB_REPO = "https://github.com/AnkitParekh007/job-search-assistant";
export const OG_IMAGE = `${SITE_URL}/assets/img/og-social.png`;

export type SeoMeta = {
  title: string;
  description: string;
  path: string;
};

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
