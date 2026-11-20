import { GITHUB_REPO } from "./site";

/** Existing historical release; its ZIPs are source/client archives, NOT native installers. */
export const RELEASE_TAG = "v0.1.1";
export const RELEASE_VERSION = "0.1.1";

export const RELEASES_PAGE = `${GITHUB_REPO}/releases`;
export const RELEASE_TAG_URL = `${GITHUB_REPO}/releases/tag/${RELEASE_TAG}`;

export type PlatformId = "macos-apple-silicon" | "macos-intel" | "windows";

export type PlatformDownload = {
  id: PlatformId;
  title: string;
  subtitle: string;
  badge: string;
  /** GitHub Release asset file name */
  asset: string;
  /** Optional secondary note shown under the badge */
  note?: string;
};

export const PLATFORM_DOWNLOADS: PlatformDownload[] = [
  {
    id: "macos-apple-silicon",
    title: "Apple Silicon",
    subtitle: "macOS 13+ · M1–M4",
    badge: "Source package",
    asset: `AI-Job-Search-${RELEASE_VERSION}-macos-arm64.zip`,
    note: "No verified .app installer in this release. Build from source.",
  },
  {
    id: "macos-intel",
    title: "Intel Mac",
    subtitle: "macOS 13+ · x86_64",
    badge: "Source port",
    asset: `AI-Job-Search-${RELEASE_VERSION}-macos-x64.zip`,
    note: "No verified Intel installer. Source build only.",
  },
  {
    id: "windows",
    title: "Windows",
    subtitle: "Windows 10/11 · x64",
    badge: "Download",
    asset: `AI-Job-Search-${RELEASE_VERSION}-windows-x64.zip`,
    note: "No verified Windows installer. Source build only.",
  },
];

export function releaseAssetUrl(assetFileName: string): string {
  return `${GITHUB_REPO}/releases/download/${RELEASE_TAG}/${assetFileName}`;
}
