import { openUrl as tauriOpenUrl, revealItemInDir as tauriReveal } from "@tauri-apps/plugin-opener";
import { open as tauriOpen } from "@tauri-apps/plugin-dialog";

export const openUrl = (url: string) => tauriOpenUrl(url);
export const revealItemInDir = (path: string) => tauriReveal(path);
export const open = (opts?: { directory?: boolean; title?: string; defaultPath?: string }) =>
  tauriOpen(opts);
