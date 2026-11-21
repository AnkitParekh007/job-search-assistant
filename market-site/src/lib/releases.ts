import { GITHUB_REPO } from "./site";

/** Keep in sync with root package.json. This is the prepared release, not a prerelease tag. */
export const RELEASE_TAG = "v0.1.3";
export const RELEASE_VERSION = "0.1.3";

/**
 * Stay false until a regular GitHub Release for RELEASE_TAG exists.
 * The download page must not link a missing zip.
 */
export const RELEASE_PUBLISHED = false;

/** Last GitHub Release that actually has a native Apple Silicon zip. Do not rename that asset. */
export const LAST_PUBLISHED_TAG = "v0.1.2";
export const LAST_PUBLISHED_ASSET = "AI-Job-Search-0.1.2-macos-arm64.zip";

export const RELEASES_PAGE = `${GITHUB_REPO}/releases`;
export const RELEASE_TAG_URL = `${GITHUB_REPO}/releases/tag/${RELEASE_PUBLISHED ? RELEASE_TAG : LAST_PUBLISHED_TAG}`;

export type PlatformId = "macos-apple-silicon" | "macos-intel" | "windows";

export type PlatformDownload = {
  id: PlatformId;
  title: string;
  subtitle: string;
  badge: string;
  /**
   * native — GitHub Release zip containing a real .app / installer
   * docs — no native installer; link to build docs instead
   */
  kind: "native" | "docs";
  /** GitHub Release asset file name (native only) */
  asset?: string;
  /** In-app docs path when kind === "docs" */
  docsPath?: string;
  note?: string;
};

const preparedAppleSiliconAsset = `Job-Search-Assistant-${RELEASE_VERSION}-macos-arm64.zip`;

export const PLATFORM_DOWNLOADS: PlatformDownload[] = [
  {
    id: "macos-apple-silicon",
    title: "Apple Silicon",
    subtitle: "macOS 13+ · M1–M4",
    badge: RELEASE_PUBLISHED ? "macOS Apple Silicon" : "Published v0.1.2",
    kind: "native",
    asset: RELEASE_PUBLISHED ? preparedAppleSiliconAsset : LAST_PUBLISHED_ASSET,
    note: RELEASE_PUBLISHED
      ? "Ad-hoc signed · not notarized · right-click → Open on first launch. Auto-update is disabled."
      : "v0.1.3 is prepared and not published. This link is the existing v0.1.2 Apple Silicon zip: ad-hoc signed, not notarized, right-click → Open. Do not disable Gatekeeper.",
  },
  {
    id: "macos-intel",
    title: "Intel Mac",
    subtitle: "macOS 13+ · x86_64",
    badge: "Build from source",
    kind: "docs",
    docsPath: "/docs/install",
    note: "No Intel installer is published. Build on Intel hardware when you are ready.",
  },
  {
    id: "windows",
    title: "Windows",
    subtitle: "Windows 10/11 · x64",
    badge: "Build from source",
    kind: "docs",
    docsPath: "/docs/install",
    note: "No Windows installer is published. Build on a Windows machine.",
  },
];

export function releaseAssetUrl(assetFileName: string): string {
  const tag = RELEASE_PUBLISHED ? RELEASE_TAG : LAST_PUBLISHED_TAG;
  return `${GITHUB_REPO}/releases/download/${tag}/${assetFileName}`;
}
