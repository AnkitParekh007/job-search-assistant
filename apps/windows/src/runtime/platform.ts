import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl as tauriOpenUrl, revealItemInDir as tauriReveal } from "@tauri-apps/plugin-opener";
import { open as tauriOpen } from "@tauri-apps/plugin-dialog";

export const openUrl = (url: string) => tauriOpenUrl(url);
export const revealItemInDir = (path: string) => tauriReveal(path);

/** Native file/folder picker. Focuses the app window first so the panel isn't buried under other apps. */
export async function open(opts?: {
  directory?: boolean;
  title?: string;
  defaultPath?: string;
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | string[] | null> {
  try {
    await getCurrentWindow().setFocus();
  } catch {
    /* non-Tauri / preview */
  }
  return tauriOpen({
    directory: opts?.directory,
    title: opts?.title,
    defaultPath: opts?.defaultPath,
    multiple: opts?.multiple ?? false,
    filters: opts?.filters,
  });
}
