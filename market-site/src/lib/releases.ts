import { GITHUB_REPO } from "./site";

/** Keep in sync with the GitHub Release tag created for downloadable assets. */
export const RELEASE_TAG = "v0.1.0";
export const RELEASE_VERSION = "0.1.0";

export const RELEASES_PAGE = `${GITHUB_REPO}/releases`;
export const RELEASE_TAG_URL = `${GITHUB_REPO}/releases/tag/${RELEASE_TAG}`;

export type PlatformId = "macos-apple-silicon" | "macos-intel" | "windows" | "web";

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
    badge: "Recommended",
    asset: `AI-Job-Search-${RELEASE_VERSION}-macos-arm64.zip`,
    note: "Unsigned .app — right-click → Open the first time",
  },
  {
    id: "macos-intel",
    title: "Intel Mac",
    subtitle: "macOS 13+ · x86_64",
    badge: "Download",
    asset: `AI-Job-Search-${RELEASE_VERSION}-macos-x64.zip`,
    note: "Intel client package — unzip and follow README",
  },
  {
    id: "windows",
    title: "Windows",
    subtitle: "Windows 10/11 · x64",
    badge: "Download",
    asset: `AI-Job-Search-${RELEASE_VERSION}-windows-x64.zip`,
    note: "Windows client package — unzip and follow README",
  },
  {
    id: "web",
    title: "Web demo",
    subtitle: "Browser UI · sample data",
    badge: "Demo",
    asset: `AI-Job-Search-${RELEASE_VERSION}-web.zip`,
    note: "Static demo only — no AI provider bridge",
  },
];

export function releaseAssetUrl(assetFileName: string): string {
  return `${GITHUB_REPO}/releases/download/${RELEASE_TAG}/${assetFileName}`;
}
