import { GITHUB_REPO } from "./site";

/** Keep in sync with root package.json and the GitHub Release tag for downloadable assets. */
export const RELEASE_TAG = "v0.1.2";
export const RELEASE_VERSION = "0.1.2";

export const RELEASES_PAGE = `${GITHUB_REPO}/releases`;
export const RELEASE_TAG_URL = `${GITHUB_REPO}/releases/tag/${RELEASE_TAG}`;

export type PlatformId = "macos-apple-silicon" | "macos-intel" | "windows";

export type PlatformDownload = {
  id: PlatformId;
  title: string;
  subtitle: string;
  badge: string;
  /**
   * native — GitHub Release zip containing a real .app / installer
   * docs — no native installer in the Phase A pipeline; link to build docs instead
   */
  kind: "native" | "docs";
  /** GitHub Release asset file name (native only) */
  asset?: string;
  /** In-app docs path when kind === "docs" */
  docsPath?: string;
  note?: string;
};

export const PLATFORM_DOWNLOADS: PlatformDownload[] = [
  {
    id: "macos-apple-silicon",
    title: "Apple Silicon",
    subtitle: "macOS 13+ · M1–M4",
    badge: "Developer preview",
    kind: "native",
    asset: `AI-Job-Search-${RELEASE_VERSION}-macos-arm64.zip`,
    note: "Ad-hoc signed · not notarized · Gate A verified locally — right-click → Open on first launch",
  },
  {
    id: "macos-intel",
    title: "Intel Mac",
    subtitle: "macOS 13+ · x86_64",
    badge: "Build from source",
    kind: "docs",
    docsPath: "/docs/install",
    note: "Native installer not offered in Phase A (source-archive fallbacks removed). Build on Intel/Rosetta when ready.",
  },
  {
    id: "windows",
    title: "Windows",
    subtitle: "Windows 10/11 · x64",
    badge: "Build from source",
    kind: "docs",
    docsPath: "/docs/install",
    note: "Native NSIS/MSI not offered until built on a Windows host. Source zips are no longer packaged as installers.",
  },
];

export function releaseAssetUrl(assetFileName: string): string {
  return `${GITHUB_REPO}/releases/download/${RELEASE_TAG}/${assetFileName}`;
}
